export type FileType = 'PDF' | 'IMAGE';

export interface FileRecord {
  id: string;
  originalName: string;
  mimeType: string;
  fileType: FileType;
  fileSize: number;
  uploadDate: string;
  storedFilename: string;
  status: 'processing' | 'completed' | 'failed';
  errorMessage?: string;
  pageCount?: number;
  extractedTextLength?: number;
  pages?: {
    pageNumber: number | string; // 1, 2, 3... or "Image File"
    text: string;
  }[];
}

export interface SearchResult {
  id: string;
  fileId: string;
  fileName: string;
  mimeType: string;
  fileType: FileType;
  pageNumber: number | string; // e.g. 1 or "Image File"
  matchingText: string;
  fullPageText?: string;
  matchCount: number;
  uploadDate: string;
  fileSize: number;
  viewUrl: string;
  downloadUrl: string;
}

export interface StatsOverview {
  totalFiles: number;
  pdfCount: number;
  imageCount: number;
  totalPages: number;
  totalWords: number;
}
