import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  AlertCircle,
  CheckCircle,
  Eye,
  FileText,
  Image as ImageIcon,
  Loader2,
  Search,
  Trash2,
  Upload,
  X,
} from 'lucide-react';
import axios from 'axios';
import { FileRecord } from '../types';
import { useAuth } from '../context/AuthContext';
import { deleteUserFile, listUserFiles, saveUserFiles } from '../services/userFiles';

export const UploadPage: React.FC = () => {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { user } = useAuth();

  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [recentFiles, setRecentFiles] = useState<FileRecord[]>([]);
  const [isLoadingRecent, setIsLoadingRecent] = useState(true);

  const fetchRecentFiles = async () => {
    if (!user) return;
    try {
      setIsLoadingRecent(true);
      setRecentFiles(await listUserFiles(user.uid));
    } catch (err: any) {
      console.error('Failed to load recent files:', err);
      setErrorMsg('Could not load your Firestore document library.');
    } finally {
      setIsLoadingRecent(false);
    }
  };

  useEffect(() => {
    fetchRecentFiles();
  }, [user]);

  const validateAndAddFiles = (files: File[]) => {
    setErrorMsg('');
    setSuccessMsg('');

    const allowedExtensions = ['pdf', 'jpg', 'jpeg', 'png'];
    const valid: File[] = [];
    const invalid: string[] = [];

    for (const file of files) {
      const ext = file.name.split('.').pop()?.toLowerCase() || '';
      if (allowedExtensions.includes(ext)) valid.push(file);
      else invalid.push(file.name);
    }

    if (invalid.length > 0) {
      setErrorMsg(`Unsupported file types: ${invalid.join(', ')}. Select PDF, JPG, JPEG, or PNG files.`);
    }

    if (valid.length > 0) setSelectedFiles((prev) => [...prev, ...valid]);
  };

  const handleUpload = async () => {
    if (!user) {
      navigate('/login', { replace: true, state: { from: '/upload' } });
      return;
    }

    if (selectedFiles.length === 0) {
      setErrorMsg('Please select at least one PDF or image file to upload.');
      return;
    }

    setIsUploading(true);
    setErrorMsg('');
    setSuccessMsg('');
    setUploadProgress('Uploading files and extracting document text...');

    try {
      const formData = new FormData();
      selectedFiles.forEach((file) => formData.append('files', file));

      const token = await user.getIdToken();
      const response = await axios.post<{ records: FileRecord[] }>('/api/upload', formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data',
        },
      });

      await saveUserFiles(user.uid, response.data.records);
      setRecentFiles(await listUserFiles(user.uid));
      setSuccessMsg(`Uploaded and indexed ${response.data.records.length} file(s) in your Firestore library.`);
      setSelectedFiles([]);
      if (fileInputRef.current) fileInputRef.current.value = '';
    } catch (err: any) {
      console.error('Upload error:', err);
      setErrorMsg(err.response?.data?.error || err.message || 'Failed to upload and process files.');
    } finally {
      setIsUploading(false);
      setUploadProgress('');
    }
  };

  const handleDeleteFile = async (id: string) => {
    if (!user) return;
    try {
      await deleteUserFile(user.uid, id);
      await axios.delete(`/api/files/${id}`);
      setRecentFiles((prev) => prev.filter((file) => file.id !== id));
    } catch (err) {
      console.error('Failed to delete file:', err);
      setErrorMsg('Could not delete that document.');
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-zinc-950 text-zinc-100 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto space-y-8">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div className="space-y-2">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white flex items-center gap-3">
              <Upload className="w-7 h-7 text-zinc-300" />
              Upload Documents
            </h1>
            <p className="text-zinc-400 text-sm max-w-2xl">
              Process PDFs and images, then save the document index to your authenticated Firestore library.
            </p>
          </div>
          <button
            onClick={() => navigate('/library')}
            className="h-10 px-4 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-200 text-sm font-semibold flex items-center justify-center gap-2 transition-colors"
          >
            <FileText className="w-4 h-4" />
            <span>Open Library</span>
          </button>
        </div>

        <section className="bg-zinc-900/90 border border-zinc-800 rounded-2xl p-5 sm:p-6 shadow-xl space-y-6">
          <div
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault();
              validateAndAddFiles(Array.from(e.dataTransfer.files));
            }}
            onClick={() => fileInputRef.current?.click()}
            className="border-2 border-dashed border-zinc-700 hover:border-zinc-500 bg-zinc-950/70 hover:bg-zinc-950 rounded-2xl p-6 sm:p-8 text-center cursor-pointer transition-colors"
          >
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept=".pdf,.jpg,.jpeg,.png"
              onChange={(e) => validateAndAddFiles(Array.from(e.target.files || []))}
              className="hidden"
            />
            <div className="flex flex-col items-center gap-3">
              <span className="h-14 w-14 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-200">
                <Upload className="w-7 h-7" />
              </span>
              <div className="space-y-1">
                <p className="text-sm sm:text-base font-semibold text-zinc-100">
                  Drop files here or <span className="underline decoration-zinc-500">browse</span>
                </p>
                <p className="text-xs text-zinc-500">PDF, JPG, JPEG, PNG up to 25MB each</p>
              </div>
            </div>
          </div>

          {selectedFiles.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between gap-3 text-xs font-semibold uppercase tracking-wide text-zinc-400">
                <span>Selected Queue ({selectedFiles.length})</span>
                <button onClick={() => setSelectedFiles([])} className="hover:text-white transition-colors">
                  Clear Queue
                </button>
              </div>

              <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                {selectedFiles.map((file, index) => {
                  const isPdf = file.name.toLowerCase().endsWith('.pdf');
                  return (
                    <div
                      key={`${file.name}-${index}`}
                      className="min-h-14 flex items-center justify-between gap-3 rounded-xl bg-zinc-950/80 border border-zinc-800 px-3 py-2"
                    >
                      <div className="min-w-0 flex items-center gap-3">
                        <span className={`h-9 w-9 rounded-lg border flex items-center justify-center shrink-0 ${isPdf ? 'bg-red-950/40 text-red-300 border-red-900/70' : 'bg-emerald-950/40 text-emerald-300 border-emerald-900/70'}`}>
                          {isPdf ? <FileText className="w-4 h-4" /> : <ImageIcon className="w-4 h-4" />}
                        </span>
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium text-zinc-100">{file.name}</p>
                          <p className="text-xs text-zinc-500">{(file.size / 1024).toFixed(1)} KB</p>
                        </div>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedFiles((prev) => prev.filter((_, fileIndex) => fileIndex !== index));
                        }}
                        className="h-8 w-8 rounded-lg text-zinc-500 hover:text-red-300 hover:bg-red-950/40 flex items-center justify-center"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {errorMsg && (
            <div className="flex gap-2 rounded-xl border border-red-900/70 bg-red-950/40 p-3 text-sm text-red-200">
              <AlertCircle className="w-5 h-5 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="flex gap-2 rounded-xl border border-emerald-900/70 bg-emerald-950/40 p-3 text-sm text-emerald-200">
              <CheckCircle className="w-5 h-5 shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <span className="text-xs text-zinc-500">
              {isUploading ? uploadProgress : 'Ready for OCR and Firestore indexing'}
            </span>
            <button
              onClick={handleUpload}
              disabled={isUploading || selectedFiles.length === 0}
              className="h-12 px-5 rounded-xl bg-zinc-100 hover:bg-white disabled:opacity-50 disabled:cursor-not-allowed text-zinc-950 font-bold text-sm flex items-center justify-center gap-2 transition-colors"
            >
              {isUploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
              <span>{isUploading ? 'Processing...' : 'Upload & Index'}</span>
            </button>
          </div>
        </section>

        <section className="space-y-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <h2 className="text-lg sm:text-xl font-bold text-white flex items-center gap-2">
              Recent Firestore Documents
              <span className="text-xs px-2 py-0.5 rounded-full bg-zinc-900 text-zinc-400 border border-zinc-800 font-medium">
                {recentFiles.length}
              </span>
            </h2>
            <button
              onClick={() => navigate('/search')}
              className="text-sm font-semibold text-zinc-300 hover:text-white flex items-center gap-2"
            >
              <Search className="w-4 h-4" />
              <span>Search your documents</span>
            </button>
          </div>

          {isLoadingRecent ? (
            <div className="rounded-2xl border border-zinc-800 bg-zinc-900/80 p-8 text-zinc-400 flex items-center justify-center gap-2">
              <Loader2 className="w-5 h-5 animate-spin" />
              <span>Loading your Firestore library...</span>
            </div>
          ) : recentFiles.length === 0 ? (
            <div className="rounded-2xl border border-zinc-800 bg-zinc-900/80 p-8 text-center text-zinc-400">
              No documents in your library yet.
            </div>
          ) : (
            <div className="rounded-2xl border border-zinc-800 bg-zinc-900/80 divide-y divide-zinc-800 overflow-hidden shadow-xl">
              {recentFiles.map((file) => (
                <div key={file.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-zinc-900 transition-colors">
                  <div className="min-w-0 flex items-center gap-3">
                    <span className={`h-11 w-11 rounded-xl border flex items-center justify-center shrink-0 ${file.fileType === 'PDF' ? 'bg-red-950/40 text-red-300 border-red-900/70' : 'bg-emerald-950/40 text-emerald-300 border-emerald-900/70'}`}>
                      {file.fileType === 'PDF' ? <FileText className="w-5 h-5" /> : <ImageIcon className="w-5 h-5" />}
                    </span>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-white" title={file.originalName}>{file.originalName}</p>
                      <p className="text-xs text-zinc-500 mt-1">
                        {file.fileType} · {file.fileType === 'PDF' ? `${file.pageCount || 1} page(s)` : 'Image'} · {(file.fileSize / 1024).toFixed(1)} KB
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <a
                      href={`/api/files/${file.id}/view`}
                      target="_blank"
                      rel="noreferrer"
                      className="h-9 px-3 rounded-lg bg-zinc-950 hover:bg-zinc-800 border border-zinc-800 text-zinc-200 text-xs font-semibold flex items-center gap-1.5"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>Open</span>
                    </a>
                    <button
                      onClick={() => navigate(`/search?fileId=${file.id}`)}
                      className="h-9 px-3 rounded-lg bg-zinc-950 hover:bg-zinc-800 border border-zinc-800 text-zinc-200 text-xs font-semibold flex items-center gap-1.5"
                    >
                      <Search className="w-3.5 h-3.5" />
                      <span>Search</span>
                    </button>
                    <button
                      onClick={() => handleDeleteFile(file.id)}
                      className="h-9 w-9 rounded-lg text-red-300 hover:text-red-200 hover:bg-red-950/40 border border-red-900/50 flex items-center justify-center"
                      title="Delete document"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
};
