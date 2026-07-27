import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FileText, Image as ImageIcon, Search, ArrowRight, Cpu, FileSearch } from 'lucide-react';
import { FileRecord, StatsOverview } from '../types';
import { WebGLShader } from '../components/WebGLShader';
import { useAuth } from '../context/AuthContext';
import { listUserFiles } from '../services/userFiles';
import { LiquidGlassButton } from '../components/LiquidGlassButton';
import { api } from '../services/api';

export const HomePage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [stats, setStats] = useState<StatsOverview | null>(null);

  useEffect(() => {
    if (user) {
      listUserFiles(user.uid)
        .then((files: FileRecord[]) => {
          const totalPages = files.reduce((sum, file) => sum + (file.pageCount || 1), 0);
          const totalWords = files.reduce(
            (sum, file) =>
              sum +
              (file.pages || []).reduce(
                (pageSum, page) => pageSum + (page.text || '').trim().split(/\s+/).filter(Boolean).length,
                0,
              ),
            0,
          );

          setStats({
            totalFiles: files.length,
            pdfCount: files.filter((file) => file.fileType === 'PDF').length,
            imageCount: files.filter((file) => file.fileType === 'IMAGE').length,
            totalPages,
            totalWords,
          });
        })
        .catch((err) => console.error('Failed to fetch Firestore stats:', err));
      return;
    }

    api
      .get<StatsOverview>('/api/stats')
      .then((res) => setStats(res.data))
      .catch((err) => console.error('Failed to fetch stats:', err));
  }, [user]);

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-zinc-950 text-zinc-100 flex flex-col justify-between relative overflow-hidden transition-colors duration-200">
      {/* WebGL Shader Background */}
      <WebGLShader />

      {/* Dark Overlay for high contrast */}
      <div className="absolute inset-0 bg-zinc-950/70 backdrop-blur-[2px] pointer-events-none z-0" />

      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 pb-20 relative z-10 my-auto">
        {/* Badge Header */}
        <div className="flex justify-center mb-6">
          <div className="inline-flex items-center space-x-2 px-4 py-1.5 rounded-full bg-zinc-900/90 border border-zinc-800 shadow-sm text-xs font-semibold text-zinc-300 backdrop-blur-md">
            <Cpu className="w-4 h-4 text-zinc-300 animate-pulse" />
            <span>Document Processing & OCR Search System</span>
          </div>
        </div>

        {/* Hero Section */}
        <div className="text-center max-w-3xl mx-auto space-y-6">
          <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight text-white leading-tight">
            Hakken <span className="bg-clip-text text-transparent bg-gradient-to-r from-zinc-100 via-zinc-300 to-zinc-500">Intelligence</span>
          </h1>

          <p className="text-lg sm:text-xl text-zinc-400 leading-relaxed font-normal max-w-2xl mx-auto">
            An intelligent document processing platform designed to extract, index, and search text from your PDF documents and image files (JPG, JPEG, PNG) with page-level accuracy and original file preview.
          </p>

          {/* Primary CTA */}
          <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-4">
            <LiquidGlassButton
              onClick={() => navigate('/upload')}
              className="w-full sm:w-auto"
            >
              <span>Try Now</span>
              <ArrowRight className="w-5 h-5" />
            </LiquidGlassButton>

            <button
              onClick={() => navigate('/search')}
              className="w-full sm:w-auto px-8 py-4 rounded-xl bg-zinc-900/90 hover:bg-zinc-800/90 text-zinc-200 border border-zinc-700 font-semibold text-base flex items-center justify-center space-x-3 transition-colors shadow-sm backdrop-blur-md"
            >
              <Search className="w-5 h-5 text-zinc-400" />
              <span>Search Database</span>
            </button>
          </div>
        </div>

        {/* Dynamic Live Stats Bar */}
        {stats && (
          <div className="mt-14 grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto">
            <div className="bg-zinc-900/80 backdrop-blur-md border border-zinc-800 rounded-xl p-4 text-center shadow-sm">
              <p className="text-2xl font-bold text-white">{stats.totalFiles}</p>
              <p className="text-xs text-zinc-400 uppercase font-medium tracking-wider mt-1">{user ? 'Your Files' : 'Processed Files'}</p>
            </div>
            <div className="bg-zinc-900/80 backdrop-blur-md border border-zinc-800 rounded-xl p-4 text-center shadow-sm">
              <p className="text-2xl font-bold text-zinc-200">{stats.pdfCount}</p>
              <p className="text-xs text-zinc-400 uppercase font-medium tracking-wider mt-1">PDF Documents</p>
            </div>
            <div className="bg-zinc-900/80 backdrop-blur-md border border-zinc-800 rounded-xl p-4 text-center shadow-sm">
              <p className="text-2xl font-bold text-zinc-200">{stats.imageCount}</p>
              <p className="text-xs text-zinc-400 uppercase font-medium tracking-wider mt-1">Image Files</p>
            </div>
            <div className="bg-zinc-900/80 backdrop-blur-md border border-zinc-800 rounded-xl p-4 text-center shadow-sm">
              <p className="text-2xl font-bold text-zinc-200">{stats.totalPages}</p>
              <p className="text-xs text-zinc-400 uppercase font-medium tracking-wider mt-1">Indexed Pages</p>
            </div>
          </div>
        )}

        {/* Feature Grid */}
        <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-zinc-900/80 backdrop-blur-md border border-zinc-800 rounded-2xl p-6 hover:border-zinc-700 transition-colors shadow-sm">
            <div className="w-12 h-12 rounded-xl bg-zinc-800/80 border border-zinc-700 text-zinc-200 flex items-center justify-center mb-4">
              <FileText className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-semibold text-white mb-2">PDF Text Extraction</h3>
            <p className="text-sm text-zinc-400 leading-relaxed">
              Extract structured text from multi-page PDF documents page by page, storing page positions for precise search indexing.
            </p>
          </div>

          <div className="bg-zinc-900/80 backdrop-blur-md border border-zinc-800 rounded-2xl p-6 hover:border-zinc-700 transition-colors shadow-sm">
            <div className="w-12 h-12 rounded-xl bg-zinc-800/80 border border-zinc-700 text-zinc-200 flex items-center justify-center mb-4">
              <ImageIcon className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-semibold text-white mb-2">Image OCR Processing</h3>
            <p className="text-sm text-zinc-400 leading-relaxed">
              Recognize printed text inside JPG, JPEG, and PNG images using Tesseract OCR, automatically tagging output as "Image File".
            </p>
          </div>

          <div className="bg-zinc-900/80 backdrop-blur-md border border-zinc-800 rounded-2xl p-6 hover:border-zinc-700 transition-colors shadow-sm">
            <div className="w-12 h-12 rounded-xl bg-zinc-800/80 border border-zinc-700 text-zinc-200 flex items-center justify-center mb-4">
              <FileSearch className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-semibold text-white mb-2">Keyword Search & Viewer</h3>
            <p className="text-sm text-zinc-400 leading-relaxed">
              Search keywords across extracted texts with paragraph highlighting and view or download files in their original format.
            </p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-zinc-800/80 py-6 text-center text-xs text-zinc-400 relative z-10 bg-zinc-950/90 backdrop-blur-md transition-colors duration-200">
        <p>Hakken Intelligence • PDF & Tesseract OCR Text Search Engine</p>
      </footer>
    </div>
  );
};

