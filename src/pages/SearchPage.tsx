import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Search, FileText, Image as ImageIcon, Eye, Loader2, Sparkles, Filter, Tag, Copy, Check, FileSearch, Trash2 } from 'lucide-react';
import axios from 'axios';
import { FileRecord, SearchResult } from '../types';
import { FileViewerModal } from '../components/FileViewerModal';
import { useAuth } from '../context/AuthContext';
import { deleteUserFile, listUserFiles } from '../services/userFiles';

export const SearchPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const initialQuery = searchParams.get('q') || '';
  const [query, setQuery] = useState<string>(initialQuery);
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState<boolean>(false);
  const [hasSearched, setHasSearched] = useState<boolean>(false);
  const [userFiles, setUserFiles] = useState<FileRecord[]>([]);
  const [hasLoadedUserFiles, setHasLoadedUserFiles] = useState(false);

  // Filter type state
  const [fileTypeFilter, setFileTypeFilter] = useState<'ALL' | 'PDF' | 'IMAGE'>('ALL');

  // Modal State for Original File Viewer
  const [selectedResultForModal, setSelectedResultForModal] = useState<SearchResult | null>(null);

  // Copied text feedback state
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  const handleCopyText = (id: string, textToCopy: string) => {
    navigator.clipboard.writeText(textToCopy);
    setCopiedId(id);
    setTimeout(() => {
      setCopiedId(null);
    }, 2000);
  };

  const handleDeleteFile = async (fileId: string, _fileName: string) => {
    if (!user) return;
    try {
      await deleteUserFile(user.uid, fileId);
      await axios.delete(`/api/files/${fileId}`);
      setUserFiles((prev) => prev.filter((file) => file.id !== fileId));
      setResults((prev) =>
        prev.filter((r) => r.fileId !== fileId && r.id !== fileId && !r.id.includes(fileId))
      );
    } catch (err) {
      console.error('Delete error:', err);
    }
  };

  useEffect(() => {
    if (!user) return;

    let isMounted = true;
    setHasLoadedUserFiles(false);
    listUserFiles(user.uid)
      .then((files) => {
        if (!isMounted) return;
        setUserFiles(files);
      })
      .catch((err) => {
        console.error('Failed to load Firestore files for search:', err);
        if (isMounted) setUserFiles([]);
      })
      .finally(() => {
        if (isMounted) setHasLoadedUserFiles(true);
      });

    return () => {
      isMounted = false;
    };
  }, [user]);

  const performSearch = async (searchKeyword: string, explicitFileIds?: string[]) => {
    const trimmed = searchKeyword.trim();
    const fileIds = explicitFileIds || userFiles.map((file) => file.id);

    if (hasLoadedUserFiles && fileIds.length === 0) {
      setResults([]);
      setHasSearched(true);
      setIsSearching(false);
      return;
    }

    if (!trimmed) {
      setResults([]);
      setHasSearched(false);
      setIsSearching(false);
      return;
    }

    setIsSearching(true);
    setHasSearched(true);

    try {
      const res = await axios.get<SearchResult[]>('/api/search', {
        params: {
          q: trimmed,
          ids: fileIds.join(','),
        },
      });
      setResults(res.data);
    } catch (err) {
      console.error('Search request failed:', err);
      setResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  // Perform search whenever searchParams change
  useEffect(() => {
    if (!hasLoadedUserFiles) return;

    const qParam = searchParams.get('q');
    const fileIdParam = searchParams.get('fileId');
    if (qParam && qParam.trim()) {
      setQuery(qParam);
      performSearch(qParam, fileIdParam ? [fileIdParam] : undefined);
    } else if (fileIdParam) {
      setQuery('*');
      performSearch('*', [fileIdParam]);
    } else {
      setQuery('');
      setResults([]);
      setHasSearched(false);
      setIsSearching(false);
    }
  }, [searchParams, hasLoadedUserFiles, userFiles]);

  // Handle typing input with live debounced search
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setQuery(value);

    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    if (!value.trim()) {
      setSearchParams({});
      setResults([]);
      setHasSearched(false);
      setIsSearching(false);
      return;
    }

    debounceTimerRef.current = setTimeout(() => {
      setSearchParams({ q: value.trim() });
    }, 300);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    if (query.trim()) {
      setSearchParams({ q: query.trim() });
      performSearch(query.trim());
    }
  };

  const handleQuickPillClick = (pillText: string) => {
    setQuery(pillText);
    setSearchParams({ q: pillText });
    performSearch(pillText);
  };

  // Keyword highlighting function
  const renderHighlightedSnippet = (text: string, keyword: string) => {
    if (!keyword || !keyword.trim()) return text;

    const queryTerms = keyword.trim().toLowerCase().split(/\s+/).filter(Boolean);
    if (queryTerms.length === 0) return text;

    const pattern = new RegExp(`(${queryTerms.map(t => t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|')})`, 'gi');
    const parts = text.split(pattern);

    let matchCounter = 0;

    return (
      <span>
        {parts.map((part, index) => {
          const isMatch = queryTerms.some((term) => part.toLowerCase() === term);
          if (isMatch) {
            const isFirst = matchCounter === 0;
            matchCounter++;

            if (isFirst) {
              // Very strong, prominent highlight for the first occurrence in the section
              return (
                <mark
                  key={index}
                  className="bg-amber-300 text-slate-950 font-black px-2 py-0.5 rounded-md shadow-xs ring-2 ring-amber-400 border border-amber-500 inline-block my-0.5"
                >
                  {part}
                </mark>
              );
            } else {
              // Soft warm yellow badge with a gold bottom underline for subsequent keyword occurrences
              return (
                <mark
                  key={index}
                  className="bg-amber-100/90 text-amber-950 font-bold underline decoration-2 decoration-amber-500 underline-offset-2 px-1.5 py-0.5 rounded-xs"
                >
                  {part}
                </mark>
              );
            }
          }
          return part;
        })}
      </span>
    );
  };

  const filteredResults = results.filter((r) => {
    if (fileTypeFilter === 'ALL') return true;
    return r.fileType === fileTypeFilter;
  });

  const sampleKeywords = ['Invoice', 'Services', 'Deep Learning', 'Accuracy', 'Agreement', 'Security', 'PDF', 'Report'];

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-zinc-950 text-zinc-100 py-10 px-4 sm:px-6 lg:px-8 transition-colors duration-200">
      <div className="max-w-5xl mx-auto space-y-8">
        {/* Header */}
        <div className="space-y-2">
          <h1 className="text-3xl font-bold tracking-tight text-white flex items-center gap-3">
            <Search className="w-8 h-8 text-zinc-300" />
            Extracted Text Keyword Search
          </h1>
          <p className="text-zinc-400 text-sm">
            Instant search across indexed PDF pages and image OCR text. Keyword matches are highlighted directly in context with page numbers and document previews.
          </p>
        </div>

        {/* Search Bar & Controls */}
        <div className="bg-zinc-900/90 border border-zinc-800 rounded-2xl p-6 shadow-xl backdrop-blur-md space-y-4">
          <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <Search className="w-5 h-5 text-zinc-500" />
              </div>
              <input
                type="text"
                value={query}
                onChange={handleInputChange}
                placeholder="Type keyword or phrase to search (e.g. invoice, services, deep learning, agreement)..."
                className="w-full pl-11 pr-16 py-3.5 bg-zinc-950/80 border border-zinc-700/80 rounded-xl text-white placeholder-zinc-500 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-600 focus:border-zinc-500 transition-all shadow-inner"
              />
              {query && (
                <button
                  type="button"
                  onClick={() => {
                    setQuery('');
                    setSearchParams({});
                  }}
                  className="absolute inset-y-0 right-0 pr-4 flex items-center text-xs text-zinc-500 hover:text-zinc-300"
                >
                  Clear
                </button>
              )}
            </div>

            <button
              type="submit"
              disabled={isSearching}
              className="px-8 py-3.5 rounded-xl bg-zinc-100 hover:bg-zinc-200 disabled:opacity-50 text-zinc-950 font-bold text-sm flex items-center justify-center space-x-2 shadow-md transition-all shrink-0"
            >
              {isSearching ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-zinc-900" />
                  <span>Searching...</span>
                </>
              ) : (
                <>
                  <Search className="w-4 h-4 text-zinc-900" />
                  <span>Search</span>
                </>
              )}
            </button>
          </form>

          {/* Quick Suggestions / Sample Keywords */}
          <div className="flex items-center gap-2 flex-wrap text-xs text-zinc-400">
            <span className="font-semibold text-zinc-400 flex items-center gap-1">
              <Tag className="w-3.5 h-3.5 text-zinc-300" /> Try Searching:
            </span>
            {sampleKeywords.map((kw) => (
              <button
                key={kw}
                onClick={() => handleQuickPillClick(kw)}
                className="px-2.5 py-1 rounded-lg bg-zinc-800/80 hover:bg-zinc-700/80 border border-zinc-700 hover:border-zinc-500 text-zinc-300 hover:text-white text-xs font-medium transition-all"
              >
                {kw}
              </button>
            ))}
          </div>

          {/* Filters & Results Counter */}
          <div className="pt-3 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs text-zinc-400 border-t border-zinc-800">
            <div className="flex items-center space-x-2">
              <Filter className="w-3.5 h-3.5 text-zinc-500" />
              <span className="font-semibold text-zinc-300">Filter By File Type:</span>
              <div className="flex items-center space-x-1 bg-zinc-950/80 p-1 rounded-lg border border-zinc-800">
                {(['ALL', 'PDF', 'IMAGE'] as const).map((type) => (
                  <button
                    key={type}
                    onClick={() => setFileTypeFilter(type)}
                    className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${
                      fileTypeFilter === type
                        ? 'bg-zinc-800 text-white border border-zinc-700 shadow-xs'
                        : 'text-zinc-400 hover:text-white'
                    }`}
                  >
                    {type === 'ALL' ? 'All Types' : type}
                  </button>
                ))}
              </div>
            </div>

            {hasSearched && (
              <div className="text-zinc-400">
                Found <strong className="text-white font-bold">{filteredResults.length}</strong> matching result(s)
              </div>
            )}
          </div>
        </div>

        {/* Results Section */}
        {isSearching ? (
          <div className="bg-zinc-900/90 border border-zinc-800 rounded-2xl p-12 text-center text-zinc-400 flex flex-col items-center justify-center space-y-3 shadow-xl">
            <Loader2 className="w-8 h-8 animate-spin text-zinc-300" />
            <p className="text-sm font-medium">Scanning extracted document text...</p>
          </div>
        ) : !hasSearched ? (
          <div className="bg-zinc-900/80 border border-zinc-800/80 rounded-2xl p-12 text-center text-zinc-400 space-y-4 shadow-xl backdrop-blur-md">
            <Sparkles className="w-10 h-10 text-zinc-300 mx-auto" />
            <h3 className="text-lg font-semibold text-white">Start Searching Document Text</h3>
            <p className="text-xs text-zinc-400 max-w-md mx-auto leading-relaxed">
              Type a word above or click any sample keyword (e.g. <button onClick={() => handleQuickPillClick('Invoice')} className="text-zinc-200 underline font-medium hover:text-white">Invoice</button>, <button onClick={() => handleQuickPillClick('Deep Learning')} className="text-zinc-200 underline font-medium hover:text-white">Deep Learning</button>, <button onClick={() => handleQuickPillClick('Agreement')} className="text-zinc-200 underline font-medium hover:text-white">Agreement</button>) to search across all indexed PDF documents and image OCR files.
            </p>
          </div>
        ) : filteredResults.length === 0 ? (
          <div className="bg-zinc-900/80 border border-zinc-800 rounded-2xl p-12 text-center text-zinc-400 space-y-4 shadow-xl">
            <p className="text-lg font-semibold text-white">No matching text found</p>
            <p className="text-xs text-zinc-400">
              No occurrences of "<span className="text-amber-400 font-bold">{query}</span>" were found in indexed document pages. Try searching a different keyword or upload new documents.
            </p>
            <div className="pt-2 flex items-center justify-center gap-3">
              <button
                onClick={() => handleQuickPillClick('Invoice')}
                className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700 rounded-xl text-xs font-semibold"
              >
                Try 'Invoice'
              </button>
              <button
                onClick={() => navigate('/upload')}
                className="px-4 py-2 bg-zinc-100 hover:bg-zinc-200 text-zinc-950 rounded-xl text-xs font-bold shadow-sm"
              >
                Upload New File
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {filteredResults.map((result) => {
              const isPdf = result.fileType === 'PDF';
              const isSearchActive = Boolean(query && query.trim());
              const textContent = isSearchActive
                ? (result.matchingText || result.fullPageText)
                : (result.fullPageText || result.matchingText);

              return (
                <div
                  key={result.id}
                  className="bg-zinc-900/90 border border-zinc-800 rounded-2xl p-6 shadow-xl hover:border-zinc-700 transition-all space-y-4"
                >
                  {/* 1. ORIGINAL DOCUMENT HEADER SECTION */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 bg-zinc-950/80 border border-zinc-800 rounded-xl">
                    <div className="flex items-center space-x-3 min-w-0">
                      <div
                        className={`p-3 rounded-xl shrink-0 shadow-sm ${
                          isPdf
                            ? 'bg-red-950/50 text-red-400 border border-red-900/60'
                            : 'bg-emerald-950/50 text-emerald-400 border border-emerald-900/60'
                        }`}
                      >
                        {isPdf ? <FileText className="w-6 h-6" /> : <ImageIcon className="w-6 h-6" />}
                      </div>

                      <div className="min-w-0 space-y-1.5">
                        <div className="flex items-center space-x-2 flex-wrap gap-1.5">
                          {/* Document Type Badge */}
                          <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-300 bg-zinc-800/80 px-2.5 py-0.5 rounded-md border border-zinc-700">
                            {isPdf ? 'PDF Document' : 'OCR Image'}
                          </span>

                          {/* HIGHLIGHTED PAGE NUMBER IN ROUNDED EDGE RECTANGLE BOX */}
                          <span className="inline-flex items-center space-x-1 px-3 py-1 rounded-lg bg-zinc-800 border border-zinc-600 text-zinc-100 font-extrabold text-xs shadow-xs">
                            <Tag className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
                            <span>{isPdf ? `Page ${result.pageNumber}` : 'Image File'}</span>
                          </span>

                          {/* Match Count Badge */}
                          <span className="text-xs text-amber-200 font-bold bg-amber-950/60 px-2.5 py-0.5 rounded-md border border-amber-800/80">
                            Matches: {result.matchCount}
                          </span>
                        </div>

                        <h3 className="font-bold text-white text-base sm:text-lg truncate">
                          {result.fileName}
                        </h3>
                      </div>
                    </div>

                    {/* ACTION BUTTONS: OPEN ORIGINAL FILE & DELETE */}
                    <div className="shrink-0 flex items-center space-x-2">
                      <button
                        onClick={() => setSelectedResultForModal(result)}
                        className="px-4 py-2.5 rounded-xl bg-zinc-100 hover:bg-zinc-200 text-zinc-950 font-bold text-xs sm:text-sm flex items-center justify-center space-x-2 shadow-md hover:scale-105 active:scale-95 transition-all"
                      >
                        <Eye className="w-4 h-4 text-zinc-900" />
                        <span>Open Original File</span>
                      </button>

                      <button
                        onClick={() => handleDeleteFile(result.fileId || result.id, result.fileName)}
                        className="px-3 py-2.5 rounded-xl bg-red-950/40 hover:bg-red-900/60 text-red-400 hover:text-red-300 font-semibold text-xs transition-colors border border-red-900/60 flex items-center space-x-1.5"
                        title="Delete file"
                      >
                        <Trash2 className="w-4 h-4" />
                        <span className="hidden sm:inline">Delete</span>
                      </button>
                    </div>
                  </div>

                  {/* 2. SEPARATE BOX: COPYABLE EXTRACTED TEXT */}
                  {isSearchActive && (
                    <div className="bg-zinc-950/90 border border-zinc-800 rounded-xl overflow-hidden shadow-xs">
                      <div className="px-4 py-2.5 bg-zinc-900/90 border-b border-zinc-800 flex items-center justify-between text-xs text-zinc-300 font-medium">
                        <span className="flex items-center space-x-2 font-bold text-white">
                          <FileSearch className="w-4 h-4 text-zinc-400 shrink-0" />
                          <span>
                            Extracted Paragraph Details for "{query}" ({isPdf ? `Page ${result.pageNumber}` : 'Full File'})
                          </span>
                        </span>

                        {/* COPY TEXT BUTTON */}
                        <button
                          type="button"
                          onClick={() => handleCopyText(result.id, textContent)}
                          className="px-3 py-1.5 rounded-lg bg-zinc-800 border border-zinc-700 hover:bg-zinc-700 text-zinc-300 hover:text-white text-xs font-semibold flex items-center space-x-1.5 transition-all shadow-xs"
                          title="Copy extracted details to clipboard"
                        >
                          {copiedId === result.id ? (
                            <>
                              <Check className="w-3.5 h-3.5 text-emerald-400" />
                              <span className="text-emerald-400 font-bold">Copied!</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-3.5 h-3.5 text-zinc-400" />
                              <span>Copy Text</span>
                            </>
                          )}
                        </button>
                      </div>

                      {/* Copyable Extracted Text Content Box */}
                      <div className="p-4 bg-zinc-950 text-sm sm:text-base leading-relaxed text-zinc-200 font-sans tracking-normal whitespace-pre-wrap max-h-96 overflow-y-auto selection:bg-amber-300 selection:text-zinc-950 select-text">
                        {renderHighlightedSnippet(textContent, query)}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* File Viewer Modal for viewing original format */}
      <FileViewerModal
        result={selectedResultForModal}
        highlightKeyword={query}
        onClose={() => setSelectedResultForModal(null)}
      />
    </div>
  );
};
