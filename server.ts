import express from 'express';
import path from 'path';
import fs from 'fs';
import multer from 'multer';
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const { PDFParse } = require('pdf-parse');
import { createWorker } from 'tesseract.js';
import { createServer as createViteServer } from 'vite';
import { FileRecord, SearchResult, StatsOverview } from './src/types.js';

const app = express();
const PORT = Number(process.env.PORT || 3000);
const isProductionServer =
  process.env.NODE_ENV === 'production' ||
  path.basename(path.dirname(process.argv[1] || '')) === 'dist';
const configuredOrigins = [
  process.env.FRONTEND_URL,
  process.env.CORS_ORIGIN,
]
  .flatMap((value) => (value || '').split(','))
  .map((value) => value.trim().replace(/\/+$/, ''))
  .filter(Boolean);
const defaultAllowedOrigins = [
  'http://localhost:3000',
  'http://127.0.0.1:3000',
  'http://localhost:5173',
  'http://127.0.0.1:5173',
];
const allowedOrigins = new Set([...defaultAllowedOrigins, ...configuredOrigins]);

// Directories setup
const UPLOADS_DIR = path.join(process.cwd(), 'uploads');
const DATA_DIR = path.join(process.cwd(), 'data');
const DB_FILE = path.join(DATA_DIR, 'db.json');

if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// Low-db style JSON persistence helper
function seedInitialData(): FileRecord[] {
  return [
    {
      id: 'file_demo_1',
      originalName: 'Invoice_2026_Hakken_Services.pdf',
      mimeType: 'application/pdf',
      fileType: 'PDF',
      fileSize: 48200,
      uploadDate: new Date(Date.now() - 86400000 * 2).toISOString(),
      storedFilename: 'Invoice_2026_Hakken_Services.pdf',
      status: 'completed',
      pageCount: 2,
      extractedTextLength: 620,
      pages: [
        {
          pageNumber: 1,
          text: 'Hakken Intelligence Technology Services Invoice #INV-2026-8841. Date: July 15, 2026. Client: Enterprise Solutions Corp. Total Amount: $4,850.00. Payment due within 30 days. Services rendered: AI OCR PDF parsing, custom text indexing, deep neural network feature extraction, automated search engine deployment.',
        },
        {
          pageNumber: 2,
          text: 'Itemized Breakdown: 1. Neural OCR Engine setup - $2,000.00. 2. PDF Page Parser integration - $1,500.00. 3. High-performance search API - $1,350.00. Total Paid: $4,850.00. Thank you for your business! Contact billing@hakken.ai for invoice support.',
        },
      ],
    },
    {
      id: 'file_demo_2',
      originalName: 'Deep_Learning_Document_Analysis_Report.pdf',
      mimeType: 'application/pdf',
      fileType: 'PDF',
      fileSize: 124000,
      uploadDate: new Date(Date.now() - 86400000 * 1).toISOString(),
      storedFilename: 'Deep_Learning_Document_Analysis_Report.pdf',
      status: 'completed',
      pageCount: 2,
      extractedTextLength: 750,
      pages: [
        {
          pageNumber: 1,
          text: 'Deep Learning Architectures for Document Image Analysis and Optical Character Recognition (OCR). Abstract: Modern document intelligence relies on convolutional and transformer networks for layout analysis, character detection, and structured information retrieval.',
        },
        {
          pageNumber: 2,
          text: 'Key Findings & Benchmark Results: The transformer-based OCR pipeline achieved a 99.4% word accuracy rate on scanned PDF forms, receipts, and multi-column technical papers. Image resolution and contrast optimization significantly reduced error rates.',
        },
      ],
    },
    {
      id: 'file_demo_3',
      originalName: 'Software_License_and_Security_Agreement.png',
      mimeType: 'image/png',
      fileType: 'IMAGE',
      fileSize: 89000,
      uploadDate: new Date().toISOString(),
      storedFilename: 'Software_License_and_Security_Agreement.png',
      status: 'completed',
      pageCount: 1,
      extractedTextLength: 320,
      pages: [
        {
          pageNumber: 'Image File',
          text: 'HAKKEN INTELLIGENCE SOFTWARE LICENSE AND SECURITY COMPLIANCE AGREEMENT. Section 1: Data Encryption and Privacy. All uploaded PDF documents and image files are encrypted at rest using AES-256 standards. User data remains strictly confidential and is parsed locally on containerized servers.',
        },
      ],
    },
  ];
}

function loadDB(): FileRecord[] {
  try {
    if (fs.existsSync(DB_FILE)) {
      const content = fs.readFileSync(DB_FILE, 'utf-8');
      const records = JSON.parse(content);
      if (Array.isArray(records) && records.length > 0) {
        return records;
      }
    }
  } catch (err) {
    console.error('Error reading db.json:', err);
  }
  const initial = seedInitialData();
  saveDB(initial);
  return initial;
}

function saveDB(records: FileRecord[]) {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(records, null, 2), 'utf-8');
  } catch (err) {
    console.error('Error saving db.json:', err);
  }
}

let dbRecords: FileRecord[] = loadDB();

function getRequestedFileIds(req: express.Request): Set<string> | null {
  const rawIds = req.query.ids;
  const values = Array.isArray(rawIds) ? rawIds : rawIds ? [rawIds] : [];
  const ids = values
    .flatMap((value) => String(value).split(','))
    .map((value) => value.trim())
    .filter(Boolean);

  return ids.length > 0 ? new Set(ids) : null;
}

function filterRecordsForRequest(req: express.Request) {
  const requestedIds = getRequestedFileIds(req);
  if (!requestedIds) return dbRecords;
  return dbRecords.filter((record) => requestedIds.has(record.id));
}

// Configure Multer storage
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, UPLOADS_DIR);
  },
  filename: (_req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    cb(null, `${uniqueSuffix}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 25 * 1024 * 1024 }, // 25MB limit
  fileFilter: (_req, file, cb) => {
    const allowedMimeTypes = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png'];
    const ext = path.extname(file.originalname).toLowerCase();
    const allowedExts = ['.pdf', '.jpg', '.jpeg', '.png'];

    if (allowedMimeTypes.includes(file.mimetype) || allowedExts.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only PDF, JPG, JPEG, and PNG are allowed.'));
    }
  },
});

// Middleware
app.use((req, res, next) => {
  const origin = req.headers.origin?.replace(/\/+$/, '');

  if (!origin || allowedOrigins.has(origin)) {
    if (origin) {
      res.setHeader('Access-Control-Allow-Origin', origin);
      res.setHeader('Vary', 'Origin');
    }
    res.setHeader('Access-Control-Allow-Methods', 'GET,POST,DELETE,OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization');
  }

  if (req.method === 'OPTIONS') {
    res.sendStatus(204);
    return;
  }

  next();
});
app.use(express.json());

// Helper: PDF Page-by-page text extraction
async function parsePdfByPages(filePath: string): Promise<{ pageNumber: number; text: string }[]> {
  const pages: { pageNumber: number; text: string }[] = [];

  try {
    const dataBuffer = fs.readFileSync(filePath);
    const uint8 = new Uint8Array(dataBuffer);
    const parser = new PDFParse(uint8);
    await parser.load();
    const textResult = await parser.getText();

    if (textResult && Array.isArray(textResult.pages) && textResult.pages.length > 0) {
      for (const pageObj of textResult.pages) {
        const pageTxt = (pageObj.text || '').trim();
        pages.push({
          pageNumber: pageObj.num || (pages.length + 1),
          text: pageTxt,
        });
      }
    } else if (textResult && textResult.text && textResult.text.trim()) {
      pages.push({
        pageNumber: 1,
        text: textResult.text.trim(),
      });
    }
  } catch (err) {
    console.error('PDF parsing error:', err);
  }

  const totalExtractedLen = pages.reduce((acc, p) => acc + (p.text || '').length, 0);

  // If text extraction is minimal (<20 chars, e.g. scanned PDF), run Gemini Vision OCR
  if (totalExtractedLen < 20 && process.env.GEMINI_API_KEY) {
    try {
      console.log('PDF contains minimal digital text (likely a scanned PDF). Running Gemini Vision OCR on PDF...');
      const ocrPdfText = await parseImageWithOCR(filePath, 'application/pdf');
      if (ocrPdfText && ocrPdfText.length > 10) {
        return [{ pageNumber: 1, text: ocrPdfText }];
      }
    } catch (e) {
      console.error('Gemini OCR on scanned PDF failed:', e);
    }
  }

  // Fallback label if still empty
  for (let i = 0; i < pages.length; i++) {
    if (!pages[i].text || !pages[i].text.trim()) {
      pages[i].text = 'No extractable text found on this page.';
    }
  }

  if (pages.length === 0) {
    pages.push({ pageNumber: 1, text: 'No text content found in document.' });
  }

  return pages;
}

// Function to re-index files that need OCR improvement
async function reindexAllFiles() {
  let changed = false;
  for (const record of dbRecords) {
    const filePath = path.join(UPLOADS_DIR, record.storedFilename);
    if (!fs.existsSync(filePath)) continue;

    const needsReindex =
      !record.pages ||
      record.pages.length === 0 ||
      record.extractedTextLength < 10 ||
      record.pages[0]?.text?.includes('No extractable text') ||
      record.pages[0]?.text?.includes('Error extracting');

    if (needsReindex) {
      console.log(`Re-indexing file for high-accuracy OCR: ${record.originalName}...`);
      try {
        if (record.fileType === 'PDF') {
          const parsedPages = await parsePdfByPages(filePath);
          record.pages = parsedPages;
          record.pageCount = parsedPages.length;
          record.extractedTextLength = parsedPages.reduce((acc, p) => acc + p.text.length, 0);
          record.status = 'completed';
        } else {
          const ocrText = await parseImageWithOCR(filePath, record.mimeType);
          record.pages = [{ pageNumber: 'Image File', text: ocrText.trim() }];
          record.pageCount = 1;
          record.extractedTextLength = ocrText.trim().length;
          record.status = 'completed';
        }
        changed = true;
      } catch (err) {
        console.error(`Re-indexing failed for ${record.originalName}:`, err);
      }
    }
  }
  if (changed) {
    saveDB(dbRecords);
  }
}

// Run re-index on startup
reindexAllFiles().catch(err => console.error('Error during initial file reindex:', err));

// Helper: Image/Document OCR text extraction with Gemini Vision (preferred) or Tesseract fallback
async function parseImageWithOCR(filePath: string, mimeType?: string): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY;

  if (apiKey) {
    try {
      const { GoogleGenAI } = await import('@google/genai');
      const ai = new GoogleGenAI({
        apiKey,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          },
        },
      });
      const imageBytes = fs.readFileSync(filePath);
      const base64Data = imageBytes.toString('base64');
      const resolvedMime = mimeType || 'image/png';

      const response = await ai.models.generateContent({
        model: 'gemini-3.6-flash',
        contents: [
          {
            inlineData: {
              data: base64Data,
              mimeType: resolvedMime,
            },
          },
          {
            text: 'Perform ultra-high-precision optical character recognition (OCR) on this document image. Extract ALL printed and handwritten text verbatim with 100% precision. Preserve headings, paragraphs, lists, invoice details, dates, currency amounts, totals, and tables exactly as written. Return strictly the raw extracted text without summarizing or adding conversational commentary.',
          },
        ],
      });

      const extractedText = response.text ? response.text.trim() : '';
      if (extractedText) {
        console.log(`Gemini Vision OCR successfully extracted ${extractedText.length} characters.`);
        return extractedText;
      }
    } catch (geminiErr) {
      console.error('Gemini Vision OCR error, falling back to Tesseract:', geminiErr);
    }
  }

  // Tesseract OCR Fallback
  let worker;
  try {
    worker = await createWorker('eng');
    const { data } = await worker.recognize(filePath);
    await worker.terminate();
    return data.text ? data.text.trim() : '';
  } catch (err) {
    console.error('Tesseract OCR error:', err);
    if (worker) {
      await worker.terminate().catch(() => {});
    }
    return '';
  }
}

// API Routes

// 1. Upload API
app.post('/api/upload', upload.array('files', 10), async (req: express.Request, res: express.Response) => {
  try {
    const files = req.files as Express.Multer.File[];
    if (!files || files.length === 0) {
      res.status(400).json({ error: 'No files uploaded.' });
      return;
    }

    const processedRecords: FileRecord[] = [];

    for (const file of files) {
      const isPdf = file.mimetype === 'application/pdf' || file.originalname.toLowerCase().endsWith('.pdf');
      const fileType: 'PDF' | 'IMAGE' = isPdf ? 'PDF' : 'IMAGE';
      
      const record: FileRecord = {
        id: `file_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`,
        originalName: file.originalname,
        mimeType: file.mimetype,
        fileType,
        fileSize: file.size,
        uploadDate: new Date().toISOString(),
        storedFilename: file.filename,
        status: 'processing',
        pages: [],
      };

      try {
        if (isPdf) {
          const parsedPages = await parsePdfByPages(file.path);
          record.pages = parsedPages;
          record.pageCount = parsedPages.length;
          record.extractedTextLength = parsedPages.reduce((acc, p) => acc + p.text.length, 0);
          record.status = 'completed';
        } else {
          // Image file OCR
          const ocrText = await parseImageWithOCR(file.path, file.mimetype);
          record.pages = [{ pageNumber: 'Image File', text: ocrText.trim() }];
          record.pageCount = 1;
          record.extractedTextLength = ocrText.trim().length;
          record.status = 'completed';
        }
      } catch (extractError: any) {
        console.error(`Failed to process ${file.originalname}:`, extractError);
        record.status = 'failed';
        record.errorMessage = extractError.message || 'Text extraction failed';
      }

      dbRecords.unshift(record);
      processedRecords.push(record);
    }

    saveDB(dbRecords);
    res.json({ message: 'Files uploaded and processed successfully', records: processedRecords });
  } catch (err: any) {
    console.error('Upload route error:', err);
    res.status(500).json({ error: err.message || 'Server upload processing error' });
  }
});

// 2. Get all files list
app.get('/api/files', (req: express.Request, res: express.Response) => {
  const summaryList = filterRecordsForRequest(req).map(r => ({
    id: r.id,
    originalName: r.originalName,
    mimeType: r.mimeType,
    fileType: r.fileType,
    fileSize: r.fileSize,
    uploadDate: r.uploadDate,
    status: r.status,
    pageCount: r.pageCount || 1,
    extractedTextLength: r.extractedTextLength || 0,
    viewUrl: `/api/files/${r.id}/view`,
    downloadUrl: `/api/files/${r.id}/download`,
  }));
  res.json(summaryList);
});

// Re-index API
app.post('/api/reindex', async (_req: express.Request, res: express.Response) => {
  try {
    await reindexAllFiles();
    res.json({ message: 'Re-indexing completed', fileCount: dbRecords.length });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Re-indexing error' });
  }
});

// 3. Get file by ID
app.get('/api/files/:id', (req: express.Request, res: express.Response) => {
  const record = dbRecords.find(r => r.id === req.params.id);
  if (!record) {
    res.status(404).json({ error: 'File not found' });
    return;
  }
  res.json({
    ...record,
    viewUrl: `/api/files/${record.id}/view`,
    downloadUrl: `/api/files/${record.id}/download`,
  });
});

// 4. Delete file
app.delete('/api/files/:id', (req: express.Request, res: express.Response) => {
  const target = req.params.id;
  const index = dbRecords.findIndex(
    r => r.id === target || target.includes(r.id) || r.id.includes(target)
  );
  if (index === -1) {
    res.status(404).json({ error: 'File not found' });
    return;
  }

  const [removed] = dbRecords.splice(index, 1);
  const filePath = path.join(UPLOADS_DIR, removed.storedFilename);
  if (fs.existsSync(filePath)) {
    try {
      fs.unlinkSync(filePath);
    } catch (e) {
      console.error('Failed to delete physical file:', e);
    }
  }

  saveDB(dbRecords);
  res.json({ message: 'File deleted successfully', deletedId: removed.id });
});

// 5. View file in original format (inline)
app.get('/api/files/:id/view', (req: express.Request, res: express.Response) => {
  const record = dbRecords.find(r => r.id === req.params.id);
  if (!record) {
    res.status(404).send('File not found');
    return;
  }

  const filePath = path.join(UPLOADS_DIR, record.storedFilename);
  if (!fs.existsSync(filePath)) {
    res.status(404).send('Physical file missing from storage');
    return;
  }

  res.setHeader('Content-Type', record.mimeType || (record.fileType === 'PDF' ? 'application/pdf' : 'image/png'));
  res.setHeader('Content-Disposition', `inline; filename="${encodeURIComponent(record.originalName)}"`);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
  res.removeHeader('X-Frame-Options');

  fs.createReadStream(filePath).pipe(res);
});

// 6. Download file
app.get('/api/files/:id/download', (req: express.Request, res: express.Response) => {
  const record = dbRecords.find(r => r.id === req.params.id);
  if (!record) {
    res.status(404).send('File not found');
    return;
  }

  const filePath = path.join(UPLOADS_DIR, record.storedFilename);
  if (!fs.existsSync(filePath)) {
    res.status(404).send('Physical file missing');
    return;
  }

  res.download(filePath, record.originalName);
});

// Extract full paragraphs / section descriptions matching the search keywords
function extractKeywordParagraphs(pageText: string, searchTokens: string[]): string {
  if (!pageText) return 'No text content on this page.';
  if (!searchTokens || searchTokens.length === 0) return pageText;

  // Split text into paragraphs or logical line blocks
  const doubleBreakBlocks = pageText.split(/(?:\r?\n){2,}/).map(b => b.trim()).filter(Boolean);
  const blocks = doubleBreakBlocks.length > 1 ? doubleBreakBlocks : pageText.split(/\r?\n/).map(b => b.trim()).filter(Boolean);

  const matchedParagraphs: string[] = [];
  const usedIndices = new Set<number>();

  for (let i = 0; i < blocks.length; i++) {
    const blockText = blocks[i];
    const blockLower = blockText.toLowerCase();

    // Check if block contains any of the search tokens
    const isMatching = searchTokens.some(tok => blockLower.includes(tok));

    if (isMatching && !usedIndices.has(i)) {
      usedIndices.add(i);
      let fullDesc = blockText;

      // If the matched block is short (like a heading e.g., "Collections Framework:"), append the subsequent paragraph too
      if (blockText.length < 120 && i + 1 < blocks.length && !usedIndices.has(i + 1)) {
        usedIndices.add(i + 1);
        fullDesc += '\n' + blocks[i + 1];
      }

      matchedParagraphs.push(fullDesc);
    }
  }

  if (matchedParagraphs.length > 0) {
    return matchedParagraphs.join('\n\n---\n\n');
  }

  return pageText;
}

// 7. Search API
app.get('/api/search', (req: express.Request, res: express.Response) => {
  const rawQuery = (req.query.q as string || '').trim();
  const queryLower = rawQuery.toLowerCase();
  const normalizedQuery = queryLower.replace(/[\r\n\t]+/g, ' ').replace(/\s+/g, ' ');
  const queryTokens = normalizedQuery.split(/\s+/).filter(Boolean);
  const searchableRecords = filterRecordsForRequest(req);

  const results: (SearchResult & { _score?: number })[] = [];

  // Mode A: Browse All (empty query or '*')
  if (!rawQuery || rawQuery === '*' || rawQuery.toLowerCase() === 'all') {
    for (const record of searchableRecords) {
      if (record.pages && record.pages.length > 0) {
        for (const page of record.pages) {
          const pageText = page.text || '';
          const snippet = pageText.length > 250 ? pageText.substring(0, 250) + ' ...' : pageText;
          results.push({
            id: `res_${record.id}_p${page.pageNumber}_${Math.random().toString(36).substring(2, 7)}`,
            fileId: record.id,
            fileName: record.originalName,
            mimeType: record.mimeType,
            fileType: record.fileType,
            pageNumber: record.fileType === 'IMAGE' ? 'Image File' : page.pageNumber,
            matchingText: snippet || 'Page text available.',
            fullPageText: pageText,
            matchCount: 1,
            uploadDate: record.uploadDate,
            fileSize: record.fileSize,
            viewUrl: `/api/files/${record.id}/view`,
            downloadUrl: `/api/files/${record.id}/download`,
            _score: 1,
          });
        }
      } else {
        results.push({
          id: `res_${record.id}_fn_${Math.random().toString(36).substring(2, 7)}`,
          fileId: record.id,
          fileName: record.originalName,
          mimeType: record.mimeType,
          fileType: record.fileType,
          pageNumber: record.fileType === 'IMAGE' ? 'Image File' : 1,
          matchingText: `Indexed Document: "${record.originalName}"`,
          fullPageText: `Indexed Document: "${record.originalName}"`,
          matchCount: 1,
          uploadDate: record.uploadDate,
          fileSize: record.fileSize,
          viewUrl: `/api/files/${record.id}/view`,
          downloadUrl: `/api/files/${record.id}/download`,
          _score: 1,
        });
      }
    }

    res.json(results);
    return;
  }

  // Mode B: Keyword / Phrase Search
  for (const record of searchableRecords) {
    const fileNameLower = record.originalName.toLowerCase();
    const fileNameNormalized = fileNameLower.replace(/[\r\n\t]+/g, ' ').replace(/\s+/g, ' ');
    const fileNameExactMatch = fileNameNormalized.includes(normalizedQuery);
    const fileNameTokensMatch = queryTokens.length > 0 && queryTokens.every((tok) => fileNameNormalized.includes(tok));

    if (!record.pages || record.pages.length === 0) {
      if (fileNameExactMatch || fileNameTokensMatch) {
        results.push({
          id: `res_${record.id}_fn_${Math.random().toString(36).substring(2, 7)}`,
          fileId: record.id,
          fileName: record.originalName,
          mimeType: record.mimeType,
          fileType: record.fileType,
          pageNumber: record.fileType === 'IMAGE' ? 'Image File' : 1,
          matchingText: `Matching File Name: "${record.originalName}"`,
          fullPageText: `Matching File Name: "${record.originalName}"`,
          matchCount: 1,
          uploadDate: record.uploadDate,
          fileSize: record.fileSize,
          viewUrl: `/api/files/${record.id}/view`,
          downloadUrl: `/api/files/${record.id}/download`,
          _score: fileNameExactMatch ? 100 : 50,
        });
      }
      continue;
    }

    let pageMatchedInRecord = false;

    for (const page of record.pages) {
      const pageText = page.text || '';
      const pageTextLower = pageText.toLowerCase();
      const pageTextNormalized = pageTextLower.replace(/[\r\n\t]+/g, ' ').replace(/\s+/g, ' ');

      // Check match conditions
      const isExactPhrase = pageTextNormalized.includes(normalizedQuery);
      const matchedTokens = queryTokens.filter((tok) => pageTextNormalized.includes(tok));
      const allTokensMatch = queryTokens.length > 0 && matchedTokens.length === queryTokens.length;
      const anyTokenMatch = matchedTokens.length > 0;

      if (isExactPhrase || allTokensMatch || anyTokenMatch || fileNameExactMatch || fileNameTokensMatch) {
        pageMatchedInRecord = true;

        // Calculate relevance score
        let score = 0;
        if (isExactPhrase) score += 100;
        if (allTokensMatch) score += 50;
        score += matchedTokens.length * 15;
        if (fileNameExactMatch) score += 40;
        if (fileNameTokensMatch) score += 20;

        // Calculate occurrence count
        let totalOccurrences = 0;
        const searchTerms = queryTokens.length > 0 ? queryTokens : [normalizedQuery];
        for (const tok of searchTerms) {
          let pos = 0;
          while ((pos = pageTextNormalized.indexOf(tok, pos)) !== -1) {
            totalOccurrences++;
            pos += tok.length;
          }
        }
        if (totalOccurrences === 0) totalOccurrences = 1;

        // Extract full paragraphs / description details for the searched keyword
        const extractedParagraphs = extractKeywordParagraphs(pageText, queryTokens);

        results.push({
          id: `res_${record.id}_p${page.pageNumber}_${Math.random().toString(36).substring(2, 7)}`,
          fileId: record.id,
          fileName: record.originalName,
          mimeType: record.mimeType,
          fileType: record.fileType,
          pageNumber: record.fileType === 'IMAGE' ? 'Image File' : page.pageNumber,
          matchingText: extractedParagraphs,
          fullPageText: pageText,
          matchCount: totalOccurrences,
          uploadDate: record.uploadDate,
          fileSize: record.fileSize,
          viewUrl: `/api/files/${record.id}/view`,
          downloadUrl: `/api/files/${record.id}/download`,
          _score: score,
        });
      }
    }

    // Fallback if filename matched but pages didn't trigger
    if ((fileNameExactMatch || fileNameTokensMatch) && !pageMatchedInRecord) {
      results.push({
        id: `res_${record.id}_fn_${Math.random().toString(36).substring(2, 7)}`,
        fileId: record.id,
        fileName: record.originalName,
        mimeType: record.mimeType,
        fileType: record.fileType,
        pageNumber: record.fileType === 'IMAGE' ? 'Image File' : 1,
        matchingText: `Matching File Name: "${record.originalName}"`,
        fullPageText: record.pages[0]?.text || `Matching File Name: "${record.originalName}"`,
        matchCount: 1,
        uploadDate: record.uploadDate,
        fileSize: record.fileSize,
        viewUrl: `/api/files/${record.id}/view`,
        downloadUrl: `/api/files/${record.id}/download`,
        _score: 30,
      });
    }
  }

  // Sort by score descending
  results.sort((a, b) => (b._score || 0) - (a._score || 0));

  res.json(results);
});

// 8. Stats API
app.get('/api/stats', (_req: express.Request, res: express.Response) => {
  const totalFiles = dbRecords.length;
  const pdfCount = dbRecords.filter(r => r.fileType === 'PDF').length;
  const imageCount = dbRecords.filter(r => r.fileType === 'IMAGE').length;
  
  let totalPages = 0;
  let totalWords = 0;

  for (const record of dbRecords) {
    totalPages += record.pageCount || 1;
    if (record.pages) {
      for (const p of record.pages) {
        totalWords += (p.text || '').trim().split(/\s+/).filter(Boolean).length;
      }
    }
  }

  const stats: StatsOverview = {
    totalFiles,
    pdfCount,
    imageCount,
    totalPages,
    totalWords,
  };

  res.json(stats);
});

// Health API
app.get('/api/health', (_req: express.Request, res: express.Response) => {
  res.json({ status: 'ok', service: 'Hakken Intelligence Backend', timestamp: new Date().toISOString() });
});

// Vite Integration
async function startServer() {
  if (!isProductionServer) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*all', (_req: express.Request, res: express.Response) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Hakken Intelligence Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
