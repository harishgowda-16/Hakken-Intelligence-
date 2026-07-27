import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Database,
  Eye,
  FileSearch,
  FileText,
  Image as ImageIcon,
  Loader2,
  RefreshCw,
  Search,
  Trash2,
  Upload,
} from 'lucide-react';
import axios from 'axios';
import { FileRecord } from '../types';
import { FileViewerModal } from '../components/FileViewerModal';
import { useAuth } from '../context/AuthContext';
import { deleteUserFile, listUserFiles } from '../services/userFiles';

export const LibraryPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [files, setFiles] = useState<FileRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  const [selectedResultModal, setSelectedResultModal] = useState<any>(null);

  const fetchFiles = async () => {
    if (!user) return;
    try {
      setErrorMsg('');
      setIsLoading(true);
      setFiles(await listUserFiles(user.uid));
    } catch (err) {
      console.error('Failed to load library:', err);
      setErrorMsg('Could not load your Firestore document library.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchFiles();
  }, [user]);

  const handleDelete = async (id: string) => {
    if (!user) return;
    try {
      await deleteUserFile(user.uid, id);
      await axios.delete(`/api/files/${id}`);
      setFiles((prev) => prev.filter((file) => file.id !== id));
    } catch (err) {
      console.error('Delete error:', err);
      setErrorMsg('Could not delete that document.');
    }
  };

  const handleInspectFile = async (fileId: string) => {
    try {
      const res = await axios.get<FileRecord>(`/api/files/${fileId}`);
      const file = res.data;
      const fullText = file.pages?.map((page) => `--- Page ${page.pageNumber} ---\n${page.text}`).join('\n\n') || '';

      setSelectedResultModal({
        id: file.id,
        fileId: file.id,
        fileName: file.originalName,
        mimeType: file.mimeType,
        fileType: file.fileType,
        pageNumber: file.fileType === 'PDF' ? `Total Pages: ${file.pageCount}` : 'Image File',
        matchingText: fullText,
        fullPageText: fullText,
        matchCount: 1,
        uploadDate: file.uploadDate,
        fileSize: file.fileSize,
        viewUrl: `/api/files/${file.id}/view`,
        downloadUrl: `/api/files/${file.id}/download`,
      });
    } catch (err) {
      console.error('Failed to inspect file:', err);
      setErrorMsg('Could not open that document.');
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-zinc-950 text-zinc-100 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto space-y-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="space-y-2">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white flex items-center gap-3">
              <Database className="w-7 h-7 text-zinc-300" />
              Document Library
            </h1>
            <p className="text-zinc-400 text-sm max-w-2xl">
              Documents indexed in Firestore for your signed-in account.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-2">
            <button
              onClick={fetchFiles}
              className="h-10 px-4 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-200 text-sm font-semibold flex items-center justify-center gap-2 transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Refresh</span>
            </button>
            <button
              onClick={() => navigate('/upload')}
              className="h-10 px-4 rounded-xl bg-zinc-100 hover:bg-white text-zinc-950 text-sm font-bold flex items-center justify-center gap-2 transition-colors"
            >
              <Upload className="w-4 h-4" />
              <span>Upload</span>
            </button>
          </div>
        </div>

        {errorMsg && (
          <div className="rounded-xl border border-red-900/70 bg-red-950/40 p-3 text-sm text-red-200">
            {errorMsg}
          </div>
        )}

        {isLoading ? (
          <div className="rounded-2xl border border-zinc-800 bg-zinc-900/80 p-12 text-center text-zinc-400 flex flex-col items-center justify-center gap-3 shadow-xl">
            <Loader2 className="w-8 h-8 animate-spin text-zinc-300" />
            <p className="text-sm font-medium">Loading your Firestore library...</p>
          </div>
        ) : files.length === 0 ? (
          <div className="rounded-2xl border border-zinc-800 bg-zinc-900/80 p-10 sm:p-12 text-center text-zinc-400 space-y-4 shadow-xl">
            <Database className="w-10 h-10 text-zinc-500 mx-auto" />
            <div className="space-y-1">
              <p className="text-lg font-semibold text-white">Library is empty</p>
              <p className="text-sm text-zinc-500">Upload a document to create your first Firestore file record.</p>
            </div>
            <button
              onClick={() => navigate('/upload')}
              className="h-10 px-4 rounded-xl bg-zinc-100 hover:bg-white text-zinc-950 text-sm font-bold inline-flex items-center justify-center gap-2 transition-colors"
            >
              <Upload className="w-4 h-4" />
              <span>Upload document</span>
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
            {files.map((file) => {
              const isPdf = file.fileType === 'PDF';
              return (
                <article
                  key={file.id}
                  className="rounded-2xl border border-zinc-800 bg-zinc-900/80 p-5 shadow-xl hover:border-zinc-700 transition-colors flex flex-col justify-between gap-5"
                >
                  <div className="space-y-4">
                    <div className="flex items-start justify-between gap-3">
                      <span className={`h-12 w-12 rounded-xl border flex items-center justify-center shrink-0 ${isPdf ? 'bg-red-950/40 text-red-300 border-red-900/70' : 'bg-emerald-950/40 text-emerald-300 border-emerald-900/70'}`}>
                        {isPdf ? <FileText className="w-6 h-6" /> : <ImageIcon className="w-6 h-6" />}
                      </span>
                      <span className={`text-[10px] font-bold uppercase tracking-wide px-2 py-1 rounded-full border ${file.status === 'completed' ? 'bg-emerald-950/40 text-emerald-300 border-emerald-900/70' : 'bg-amber-950/40 text-amber-300 border-amber-900/70'}`}>
                        {file.status}
                      </span>
                    </div>

                    <div className="min-w-0">
                      <h3 className="font-bold text-white text-sm truncate" title={file.originalName}>
                        {file.originalName}
                      </h3>
                      <p className="text-xs text-zinc-500 mt-2">
                        {file.fileType} · {isPdf ? `${file.pageCount || 1} page(s)` : 'Image File'} · {(file.fileSize / 1024).toFixed(1)} KB
                      </p>
                      <p className="text-xs text-zinc-600 mt-1">
                        {new Date(file.uploadDate).toLocaleString()}
                      </p>
                    </div>
                  </div>

                  <div className="pt-4 border-t border-zinc-800 flex items-center justify-between gap-2">
                    <button
                      onClick={() => handleInspectFile(file.id)}
                      className="h-9 px-3 rounded-lg bg-zinc-950 hover:bg-zinc-800 border border-zinc-800 text-zinc-200 text-xs font-semibold flex items-center gap-1.5"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>Inspect</span>
                    </button>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => navigate(`/search?q=${encodeURIComponent(file.originalName.split('.')[0])}`)}
                        className="h-9 w-9 rounded-lg bg-zinc-950 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 flex items-center justify-center"
                        title="Search within document"
                      >
                        <Search className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleInspectFile(file.id)}
                        className="h-9 w-9 rounded-lg bg-zinc-950 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 flex items-center justify-center"
                        title="View extracted text"
                      >
                        <FileSearch className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDelete(file.id)}
                        className="h-9 w-9 rounded-lg text-red-300 hover:text-red-200 hover:bg-red-950/40 border border-red-900/50 flex items-center justify-center"
                        title="Delete file"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </div>

      <FileViewerModal result={selectedResultModal} onClose={() => setSelectedResultModal(null)} />
    </div>
  );
};
