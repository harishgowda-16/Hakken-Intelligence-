import React, { useState } from 'react';
import { X, ExternalLink, FileText, Image as ImageIcon, Eye, FileSearch, Copy, Check } from 'lucide-react';
import { SearchResult } from '../types';

interface FileViewerModalProps {
  result: SearchResult | null;
  highlightKeyword?: string;
  onClose: () => void;
}

export const FileViewerModal: React.FC<FileViewerModalProps> = ({
  result,
  highlightKeyword,
  onClose,
}) => {
  if (!result) return null;

  const [activeTab, setActiveTab] = useState<'preview' | 'text'>('preview');
  const [copied, setCopied] = useState<boolean>(false);

  const handleCopy = () => {
    const text = result.fullPageText || result.matchingText;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const highlightText = (text: string, keyword?: string) => {
    if (!keyword || !keyword.trim()) return text;

    const queryTerms = keyword.trim().toLowerCase().split(/\s+/).filter(Boolean);
    if (queryTerms.length === 0) return text;

    const pattern = new RegExp(`(${queryTerms.map(t => t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|')})`, 'gi');
    const parts = text.split(pattern);

    let matchCounter = 0;

    return parts.map((part, i) => {
      const isMatch = queryTerms.some((term) => part.toLowerCase() === term);
      if (isMatch) {
        const isFirst = matchCounter === 0;
        matchCounter++;

        if (isFirst) {
          return (
            <mark
              key={i}
              className="bg-amber-300 text-slate-950 font-black px-2 py-0.5 rounded-md shadow-xs ring-2 ring-amber-400 border border-amber-500 inline-block my-0.5"
            >
              {part}
            </mark>
          );
        } else {
          return (
            <mark
              key={i}
              className="bg-amber-100/90 text-amber-950 font-bold underline decoration-2 decoration-amber-500 underline-offset-2 px-1.5 py-0.5 rounded-xs"
            >
              {part}
            </mark>
          );
        }
      }
      return part;
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 dark:bg-slate-950/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-5xl h-[85vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Modal Header */}
        <div className="px-6 py-4 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between gap-4">
          <div className="flex items-center space-x-3 overflow-hidden">
            <div className={`p-2 rounded-lg ${result.fileType === 'PDF' ? 'bg-red-50 dark:bg-red-950/50 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-900' : 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-900'}`}>
              {result.fileType === 'PDF' ? <FileText className="w-5 h-5" /> : <ImageIcon className="w-5 h-5" />}
            </div>
            <div className="truncate">
              <h3 className="font-semibold text-slate-900 dark:text-white text-base truncate" title={result.fileName}>
                {result.fileName}
              </h3>
              <div className="flex items-center space-x-2 text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                <span className="font-semibold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded border border-slate-200 dark:border-slate-700">{result.fileType}</span>
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-md bg-zinc-100 dark:bg-zinc-800 border border-zinc-600 text-zinc-800 dark:text-zinc-200 font-extrabold text-xs">
                  {typeof result.pageNumber === 'number' ? `Page ${result.pageNumber}` : result.pageNumber}
                </span>
                <span>•</span>
                <span>{(result.fileSize / 1024).toFixed(1)} KB</span>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center space-x-2 shrink-0">
            {/* View Mode Toggle Tabs */}
            <div className="bg-slate-100 dark:bg-slate-800 p-1 rounded-xl flex items-center space-x-1 border border-slate-200 dark:border-slate-700">
              <button
                onClick={() => setActiveTab('preview')}
                className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                  activeTab === 'preview'
                    ? 'bg-zinc-800 text-white shadow-sm'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <Eye className="w-3.5 h-3.5" />
                <span>Original File</span>
              </button>
              <button
                onClick={() => setActiveTab('text')}
                className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                  activeTab === 'text'
                    ? 'bg-zinc-800 text-white shadow-sm'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <FileSearch className="w-3.5 h-3.5" />
                <span>Extracted Text</span>
              </button>
            </div>

            <a
              href={result.viewUrl}
              target="_blank"
              rel="noreferrer"
              className="px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-700 dark:text-slate-300 hover:text-zinc-100 dark:hover:text-zinc-200 bg-slate-100 dark:bg-slate-800 hover:bg-zinc-50 dark:hover:bg-zinc-900 transition-colors border border-slate-200 dark:border-slate-700 flex items-center space-x-1"
              title="Open in new browser tab"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>New Tab</span>
            </a>

            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 dark:text-slate-500 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors border border-slate-200 dark:border-slate-700"
              title="Close modal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="flex-1 bg-slate-100 dark:bg-slate-950 p-4 overflow-hidden relative flex flex-col">
          {activeTab === 'preview' ? (
            <div className="w-full h-full rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 overflow-hidden flex items-center justify-center relative">
              {result.fileType === 'PDF' ? (
                <div className="w-full h-full p-8 flex flex-col items-center justify-center text-center bg-slate-50 dark:bg-slate-900 space-y-6">
                  <div className="p-5 bg-red-50 dark:bg-red-950/50 text-red-600 dark:text-red-400 rounded-3xl border border-red-200 dark:border-red-900 shadow-md">
                    <FileText className="w-12 h-12" />
                  </div>
                  <div className="space-y-2 max-w-lg">
                    <h4 className="font-extrabold text-slate-900 dark:text-white text-lg sm:text-xl">
                      {result.fileName}
                    </h4>
                    <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                      PDF documents can be opened in a new browser tab for full native viewing or inspected directly using the high-accuracy extracted document text view below.
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
                    <a
                      href={result.viewUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="px-5 py-3 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white font-bold text-xs sm:text-sm flex items-center space-x-2 shadow-lg shadow-zinc-900/30 hover:scale-105 transition-all"
                    >
                      <ExternalLink className="w-4 h-4" />
                      <span>Open PDF in New Browser Tab</span>
                    </a>
                    <button
                      onClick={() => setActiveTab('text')}
                      className="px-5 py-3 rounded-xl bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold text-xs sm:text-sm flex items-center space-x-2 border border-slate-300 dark:border-slate-700 shadow-xs"
                    >
                      <FileSearch className="w-4 h-4 text-zinc-300" />
                      <span>View Extracted Text</span>
                    </button>
                  </div>
                </div>
              ) : (
                <div className="w-full h-full p-4 flex items-center justify-center overflow-auto bg-slate-50 dark:bg-slate-950">
                  <img
                    src={result.viewUrl}
                    alt={result.fileName}
                    className="max-h-full max-w-full object-contain rounded-lg border border-slate-200 dark:border-slate-800 shadow-md"
                  />
                </div>
              )}
            </div>
          ) : (
            <div className="w-full h-full rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 overflow-y-auto font-sans text-sm sm:text-base leading-relaxed text-slate-800 dark:text-slate-200">
              <div className="mb-4 pb-3 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs text-slate-600 dark:text-slate-400">
                <span className="font-semibold text-zinc-200 dark:text-zinc-300 uppercase tracking-wider">
                  Text Extracted via {result.fileType === 'PDF' ? 'PDF Parser' : 'Tesseract OCR Engine'}
                </span>
                <div className="flex items-center space-x-3">
                  <span>
                    Location: {typeof result.pageNumber === 'number' ? `Page ${result.pageNumber}` : result.pageNumber}
                  </span>
                  <button
                    onClick={handleCopy}
                    className="px-2.5 py-1 rounded bg-slate-100 dark:bg-slate-800 hover:bg-zinc-50 dark:hover:bg-zinc-900 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:text-zinc-100 dark:hover:text-zinc-200 font-medium flex items-center space-x-1"
                  >
                    {copied ? (
                      <>
                        <Check className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                        <span className="text-emerald-600 dark:text-emerald-400 font-bold">Copied</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3 h-3" />
                        <span>Copy</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
              <div className="whitespace-pre-wrap bg-slate-50 dark:bg-slate-950 p-4 rounded-lg border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200 selection:bg-amber-200 selection:text-slate-950">
                {highlightText(result.fullPageText || result.matchingText, highlightKeyword)}
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer Info */}
        <div className="px-6 py-3 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
          <div className="flex items-center space-x-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>Hakken Document Engine • Original File Preview Ready</span>
          </div>
          <div>
            Uploaded: {new Date(result.uploadDate).toLocaleString()}
          </div>
        </div>
      </div>
    </div>
  );
};
