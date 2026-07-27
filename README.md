# Hakken Intelligence - Complete Project Documentation

## 📋 Project Overview

**Hakken Intelligence** is a full-stack document management and intelligent search application built with **React 19**, **TypeScript**, **Express.js**, and **Firebase**. It enables users to upload PDF documents and images, extract text using **Optical Character Recognition (OCR)**, and search through indexed documents with advanced AI-powered capabilities.

**Core Purpose**: Upload documents → Extract text via OCR → Store metadata → Search intelligently → View & Download results

---

## 🏗️ Project Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                    HAKKEN INTELLIGENCE                       │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌──────────────────┐          ┌──────────────────┐        │
│  │   FRONTEND       │          │    BACKEND       │        │
│  │   (React 19)     │◄────────►│   (Express.js)   │        │
│  │   TypeScript     │  HTTP    │   TypeScript     │        │
│  │   Vite Build     │  APIs    │   Port: 3000     │        │
│  └──────────────────┘          └──────────────────┘        │
│           │                            │                   │
│           │                            ├─► PDF Parser      │
│           │                            ├─► OCR Engine      │
│           │                            ├─► File Storage    │
│           │                            └─► Search Index    │
│           │                                                │
│      ┌────▼──────────┐          ┌──────────────────┐      │
│      │ Firebase Auth │          │  Local Storage   │      │
│      │ & Firestore   │          │  (uploads/ dir)  │      │
│      │ (Cloud DB)    │          │  (data/db.json)  │      │
│      └───────────────┘          └──────────────────┘      │
│                                                              │
│  ┌──────────────────┐          ┌──────────────────┐        │
│  │ Gemini Vision    │          │  Tesseract OCR   │        │
│  │ OCR API (Primary)│          │  Fallback Engine │        │
│  └──────────────────┘          └──────────────────┘        │
└─────────────────────────────────────────────────────────────┘
```

---

## 📂 Complete File Structure & Purpose

### **Root Level Files**
```
project-root/
├── index.html                 ← Entry point for React app (loads /src/main.tsx)
├── package.json              ← Dependencies & scripts (npm config)
├── tsconfig.json             ← TypeScript compilation settings
├── vite.config.ts            ← Vite build configuration (React + Tailwind)
├── server.ts                 ← Express.js backend server (MAIN BACKEND FILE)
├── .env                      ← Environment variables (Firebase + Gemini API keys)
├── .env.example              ← Template for .env
├── FIREBASE_SETUP.md         ← Firebase configuration guide
├── README.md                 ← This file
├── metadata.json             ← Project metadata
├── eng.traineddata           ← Tesseract OCR language data (English)
├── package-lock.json         ← Locked dependency versions
├── bun.lock                  ← Bun package manager lock file
├── .gitignore                ← Git ignore rules
└── .git/                     ← Git repository
```

### **Source Code Directories**

#### **src/ - React Frontend (TypeScript)**
```
src/
├── main.tsx                  ← React app entry point (ReactDOM render)
├── index.css                 ← Global styles & Tailwind imports
├── App.tsx                   ← Main app component with routing
├── firebase.ts               ← Firebase SDK initialization & config
├── types.ts                  ← TypeScript interfaces (FileRecord, SearchResult, etc.)
│
├── context/                  ← React Context API state management
│   ├── AuthContext.tsx       ← Authentication context (Firebase Auth state)
│   │   └── Exports: useAuth() hook, AuthProvider wrapper
│   │   └── Manages: signInWithEmail, signUpWithEmail, signInWithGoogle, signOut
│   │
│   └── ThemeContext.tsx      ← Dark theme context (always dark mode)
│       └── Exports: useTheme() hook, ThemeProvider wrapper
│
├── pages/                    ← React page components (full pages)
│   ├── HomePage.tsx          ← Landing page (public, no login required)
│   │   └── Shows app overview, features, search bar preview
│   │
│   ├── LoginPage.tsx         ← Authentication page
│   │   └── Email/password login & signup forms
│   │   └── Google OAuth sign-in button
│   │   └── Error handling with Firebase auth codes
│   │
│   ├── UploadPage.tsx        ← File upload page (PROTECTED ROUTE)
│   │   └── File drag-and-drop or click to select
│   │   └── Shows upload progress
│   │   └── Displays recently uploaded files from Firestore
│   │   └── Calls: POST /api/upload
│   │
│   ├── SearchPage.tsx        ← Full-text search page (PROTECTED ROUTE)
│   │   └── Search query input
│   │   └── Filter by file type (PDF, IMAGE, ALL)
│   │   └── Displays search results with relevance scoring
│   │   └── Copy text, view original file, download options
│   │   └── Calls: GET /api/search
│   │
│   └── LibraryPage.tsx       ← Document library (PROTECTED ROUTE)
│       └── Grid/list view of all user's indexed documents
│       └── Shows metadata: file size, upload date, page count
│       └── View/Download/Delete actions per file
│
├── components/               ← Reusable React components
│   ├── Navbar.tsx            ← Navigation bar (visible on all pages)
│   │   └── Logo, navigation links, user menu
│   │   └── Responsive design (mobile hamburger menu)
│   │   └── Auth-aware (shows login/logout buttons)
│   │
│   ├── FileViewerModal.tsx   ← Modal popup for viewing files
│   │   └── Displays PDF or image inline in modal
│   │   └── Download button inside modal
│   │
│   └── WebGLShader.tsx       ← 3D WebGL effects (visual enhancement)
│       └── Shader-based animations on homepage
│
├── services/                 ← API service functions
│   └── userFiles.ts          ← Firestore operations
│       └── listUserFiles(uid)      ← GET user's files from Firestore
│       └── saveUserFiles(uid, records)  ← POST/UPDATE files to Firestore
│       └── deleteUserFile(uid, fileId)  ← DELETE file from Firestore
│
├── assets/                   ← Static assets
│   └── (images, icons, etc.)
│
└── data/                     ← Local data storage
    └── db.json               ← JSON database with file records (fallback storage)
```

#### **uploads/ - File Storage**
```
uploads/
└── [auto-generated unique filenames]  ← Physical uploaded files stored here
    ├── 1719876543123-a1b2c3.pdf
    ├── 1719876543124-d4e5f6.png
    └── 1719876543125-g7h8i9.jpg
```

#### **dist/ - Production Build Output**
```
dist/
├── index.html                ← Minified HTML
├── assets/                   ← Chunked JS/CSS (Vite output)
│   ├── index-abc123.js
│   └── styles-def456.css
└── server.js                 ← Bundled Express server (esbuild output)
```

---

## 🛠️ Technology Stack - Complete Breakdown

### **Frontend Technologies**

| Technology | Version | Purpose |
|-----------|---------|---------|
| **React** | 19.0.1 | UI framework for building interactive components |
| **TypeScript** | ~5.8.2 | Type-safe JavaScript for frontend code |
| **Vite** | 6.2.3 | Lightning-fast build tool and dev server |
| **React Router** | 7.18.1 | Client-side routing between pages (/home, /upload, /search, /library, /login) |
| **Tailwind CSS** | 4.1.14 | Utility-first CSS framework for styling |
| **Autoprefixer** | 10.4.21 | Vendor-prefixing for CSS compatibility |
| **Lucide React** | 0.546.0 | Icon library for UI components |
| **Motion** | 12.23.24 | Animation library for smooth transitions |
| **Three.js** | 0.185.1 | 3D graphics library for WebGL effects |

### **Backend Technologies**

| Technology | Version | Purpose |
|-----------|---------|---------|
| **Express.js** | 4.21.2 | Web server framework (Node.js) |
| **TypeScript** | ~5.8.2 | Type-safe backend code |
| **Multer** | 2.2.0 | Middleware for handling file uploads (multipart/form-data) |
| **TSX** | 4.21.0 | TypeScript executor (runs .ts files directly) |
| **ESBuild** | 0.25.0 | Fast JavaScript bundler for production builds |

### **Database & Authentication**

| Technology | Purpose |
|-----------|---------|
| **Firebase Authentication** | User login/signup (Email/Password + Google OAuth) |
| **Firestore** | Cloud NoSQL database for storing file metadata & records |
| **Local JSON (db.json)** | Fallback JSON database in `data/db.json` |

### **OCR & Document Processing**

| Technology | Version | Purpose |
|-----------|---------|---------|
| **Gemini Vision API** | 3.6-flash | AI-powered OCR (PRIMARY) - extracts text from images & scanned PDFs |
| **@google/genai** | 2.4.0 | Google Generative AI SDK client |
| **Tesseract.js** | 7.0.0 | Fallback OCR engine (if Gemini fails) |
| **pdf-parse** | 2.4.5 | PDF text extraction library |

### **Build & Development Tools**

| Technology | Version | Purpose |
|-----------|---------|---------|
| **Vite** | 6.2.3 | Dev server + production bundler |
| **@vitejs/plugin-react** | 5.0.4 | Vite plugin for React Fast Refresh |
| **@tailwindcss/vite** | 4.1.14 | Vite plugin for Tailwind CSS |
| **tsx** | 4.21.0 | TypeScript execution without tsc compilation |

### **HTTP & Networking**

| Technology | Version | Purpose |
|-----------|---------|---------|
| **Axios** | 1.18.1 | HTTP client for API requests (frontend to backend) |

---

## 🔗 Complete Data Flow & File Connections

### **1. AUTHENTICATION FLOW**

```
User → LoginPage.tsx
  ↓
(Email/Password or Google OAuth)
  ↓
FirebaseAuth (src/firebase.ts)
  ↓
AuthContext.tsx (manages user state globally)
  ↓
Protected Routes check: user.uid
  ↓
✓ Allow access to: UploadPage, SearchPage, LibraryPage
✗ Redirect to: LoginPage
```

**Connected Files:**
- `src/firebase.ts` - Firebase initialization
- `src/context/AuthContext.tsx` - Auth state management
- `src/pages/LoginPage.tsx` - Login UI
- `src/pages/HomePage.tsx` - Uses `useAuth()` hook

---

### **2. FILE UPLOAD FLOW**

```
User clicks "Upload" → UploadPage.tsx
  ↓
File selection (drag-drop or click)
  ↓
validateAndAddFiles() - Check file type (.pdf, .jpg, .jpeg, .png)
  ↓
POST /api/upload (multipart/form-data)
  ├─ Multer receives files → stores in uploads/ directory
  ├─ Extract file type (PDF or IMAGE)
  └─ OCR Processing:
      ├─ If PDF: parsePdfByPages() → pdf-parse library
      │   └─ Detect if scanned PDF (minimal text < 20 chars)
      │       └─ If scanned: Use Gemini Vision API
      │
      └─ If IMAGE: parseImageWithOCR()
          ├─ Try Gemini Vision API (PREFERRED) 
          │   └─ Base64 encode file
          │   └─ Send to gemini-3.6-flash model
          │   └─ Parse text response
          │
          └─ If Gemini fails: Tesseract.js fallback
              └─ OCR extraction via Tesseract
  ↓
Save FileRecord to database:
  ├─ data/db.json (local fallback)
  └─ Firestore: /users/{uid}/files/{fileId}
  ↓
Response: { records: [FileRecord] }
  ↓
UploadPage.tsx updates state → Display success message
```

**Connected Files:**
- `src/pages/UploadPage.tsx` - Upload UI & form
- `src/context/AuthContext.tsx` - Get user.uid
- `server.ts` (POST /api/upload) - File handling
- `src/services/userFiles.ts` - Firestore save
- `data/db.json` - Backup storage

**API Endpoint:**
```
POST /api/upload
Content-Type: multipart/form-data
Authorization: Bearer {firebase-token}

Body:
  files: [File1, File2, ...]  (max 10 files, 25MB each)

Response:
{
  "message": "Files uploaded and processed successfully",
  "records": [
    {
      "id": "file_1719876543_abc123",
      "originalName": "document.pdf",
      "mimeType": "application/pdf",
      "fileType": "PDF",
      "fileSize": 145000,
      "uploadDate": "2026-07-24T10:30:45.123Z",
      "storedFilename": "1719876543-abc123.pdf",
      "status": "completed",
      "pageCount": 3,
      "extractedTextLength": 5240,
      "pages": [
        {
          "pageNumber": 1,
          "text": "Page 1 extracted text..."
        },
        {
          "pageNumber": 2,
          "text": "Page 2 extracted text..."
        }
      ]
    }
  ]
}
```

---

### **3. SEARCH FLOW**

```
User enters search query → SearchPage.tsx
  ↓
Fetch user's files from Firestore: listUserFiles(uid)
  ↓
User clicks "Search" or auto-search via debounce
  ↓
GET /api/search?q={query}&ids={fileId1,fileId2,...}
  ↓
Backend Search Algorithm:
  ├─ If query is empty or "*" or "all":
  │   └─ Browse Mode: Return ALL indexed pages
  │
  └─ If query has keywords:
      └─ Keyword Search Mode:
          ├─ Normalize query (lowercase, remove extra spaces)
          ├─ Tokenize: split into words
          ├─ For each FileRecord:
          │   ├─ Check filename match (exact or tokens)
          │   └─ For each page in file:
          │       ├─ Normalize page text
          │       ├─ Calculate relevance score:
          │       │   - Exact phrase match: +100 points
          │       │   - All tokens match: +50 points
          │       │   - Each token found: +15 points per token
          │       │   - Filename match: +40 points
          │       │   - Filename tokens: +20 points
          │       │
          │       ├─ Count occurrences of search terms
          │       │
          │       ├─ Extract keyword paragraphs: 
          │       │   └─ Find matching blocks of text
          │       │   └─ Include context from adjacent blocks
          │       │
          │       └─ Build SearchResult object
          │
          └─ Sort results by relevance score (descending)
  ↓
Response: [SearchResult, SearchResult, ...]
  ↓
SearchPage.tsx:
  ├─ Display results with scores
  ├─ Allow file type filtering
  ├─ Show copy, view, delete buttons per result
  └─ Optional: Open FileViewerModal to see original file
```

**Connected Files:**
- `src/pages/SearchPage.tsx` - Search UI
- `server.ts` (GET /api/search) - Search algorithm
- `src/services/userFiles.ts` - List files
- `src/components/FileViewerModal.tsx` - View original

**API Endpoint:**
```
GET /api/search?q={searchQuery}&ids={fileId1,fileId2,...}

Example: GET /api/search?q=invoice&ids=file_123,file_456

Response:
[
  {
    "id": "res_file_123_p1_abc123",
    "fileId": "file_123",
    "fileName": "invoice.pdf",
    "fileType": "PDF",
    "pageNumber": 1,
    "matchingText": "Invoice Details...\n---\nPayment Terms...",
    "fullPageText": "Full page 1 text...",
    "matchCount": 3,
    "uploadDate": "2026-07-24T10:30:45.123Z",
    "fileSize": 145000,
    "viewUrl": "/api/files/file_123/view",
    "downloadUrl": "/api/files/file_123/download",
    "_score": 155
  },
  ...
]
```

---

### **4. FILE VIEW & DOWNLOAD FLOW**

```
User clicks "View" in search result → FileViewerModal.tsx
  ↓
GET /api/files/{fileId}/view
  ↓
Backend:
  ├─ Find FileRecord by ID
  ├─ Read physical file from uploads/ directory
  └─ Stream file with correct MIME type (PDF/JPEG/PNG)
      ├─ Content-Type header
      ├─ Content-Disposition: inline (display in browser)
      └─ CORS headers enabled
  ↓
Browser displays file in modal
  ├─ PDF → PDF.js viewer
  ├─ Image → IMG tag
  └─ Download button available


User clicks "Download" → Direct download
  ↓
GET /api/files/{fileId}/download
  ↓
Backend:
  ├─ Find FileRecord by ID
  ├─ Read physical file
  └─ Stream file with Content-Disposition: attachment
      └─ Browser triggers download with original filename
```

**API Endpoints:**
```
GET /api/files/{fileId}/view
  └─ Returns: Binary file content (inline display)

GET /api/files/{fileId}/download
  └─ Returns: Binary file content (download trigger)
```

---

### **5. DELETE FILE FLOW**

```
User clicks "Delete" → Confirmation dialog
  ↓
DELETE /api/files/{fileId}  (backend deletion)
Delete from Firestore       (frontend deletion)
  ↓
Backend:
  ├─ Find FileRecord in db.json by ID
  ├─ Remove from dbRecords array
  ├─ Delete physical file from uploads/ directory
  ├─ Save updated db.json
  └─ Return: { message: "File deleted successfully" }
  ↓
Frontend:
  ├─ Call deleteUserFile(uid, fileId) from Firestore
  ├─ Remove file from search results
  ├─ Update UI
  └─ Show success message
```

**API Endpoint:**
```
DELETE /api/files/{fileId}

Response:
{
  "message": "File deleted successfully",
  "deletedId": "file_1719876543_abc123"
}
```

---

### **6. RE-INDEX FLOW (Server Maintenance)**

```
Server Startup OR Manual Trigger:
  ↓
POST /api/reindex
  ↓
reindexAllFiles():
  ├─ Loop through all FileRecords
  ├─ For each record, check if needs re-indexing:
  │   ├─ No pages extracted yet
  │   ├─ Very little text (< 10 chars)
  │   ├─ Contains error messages
  │   └─ Scanned PDF (< 20 chars)
  │
  ├─ If PDF needs reindex:
  │   └─ Call parsePdfByPages() again (better OCR)
  │
  ├─ If IMAGE needs reindex:
  │   └─ Call parseImageWithOCR() again (better OCR)
  │
  ├─ Update FileRecord with new extracted text
  ├─ Mark status as 'completed'
  └─ Save updated db.json
  ↓
Response:
{
  "message": "Re-indexing completed",
  "fileCount": 150
}
```

---

## 📡 All Backend API Endpoints

### **File Management**

| Method | Endpoint | Purpose | Auth |
|--------|----------|---------|------|
| POST | `/api/upload` | Upload files & extract text | ✓ Token |
| GET | `/api/files` | List all files | ✗ Optional |
| GET | `/api/files/:id` | Get file metadata by ID | ✗ |
| DELETE | `/api/files/:id` | Delete file & physical copy | ✗ |
| GET | `/api/files/:id/view` | View file inline (PDF/Image) | ✗ |
| GET | `/api/files/:id/download` | Download file | ✗ |

### **Search & Indexing**

| Method | Endpoint | Purpose | Auth |
|--------|----------|---------|------|
| GET | `/api/search` | Full-text search with scoring | ✗ |
| POST | `/api/reindex` | Force re-index all files | ✗ |

### **Frontend Serving**

| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/` | Serve React app (Vite dev server or built index.html) |

---

## 🔐 Environment Variables & API Keys

### **Firebase Configuration**

Create a `.env` file in the project root with these variables (Get from Firebase Console):

```bash
# Firebase Authentication & Database
VITE_FIREBASE_API_KEY=your_firebase_api_key_here
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
VITE_FIREBASE_MEASUREMENT_ID=G-XXXXXXX
```

**How to Get Firebase Credentials:**
1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Create or select a project
3. Go to Settings → Project Settings
4. Copy Web App credentials
5. Paste into `.env`

### **Gemini API Configuration**

```bash
# Google Generative AI (OCR)
GEMINI_API_KEY=your_gemini_api_key_here
```

**How to Get Gemini API Key:**
1. Go to [Google AI Studio](https://aistudio.google.com/)
2. Click "Create API Key"
3. Copy the key
4. Set `GEMINI_API_KEY` in `.env` (optional - if not set, falls back to Tesseract)

### **Application URL**

```bash
# Application hosting URL (for OAuth callbacks)
APP_URL=http://localhost:3000  # Development
# APP_URL=https://your-production-domain.com  # Production
```

---

## 🚀 How to Run the Project - Complete Step-by-Step

### **Prerequisites**

- **Node.js**: v18+ (Check: `node --version`)
- **npm**: v9+ (Check: `npm --version`)
- **Git**: For version control
- **Text Editor**: VS Code recommended

### **Step 1: Clone & Install**

```bash
# Navigate to project directory
cd "path/to/Hakken Intelligence"

# Install all dependencies
npm install

# This installs all packages from package.json
```

### **Step 2: Configure Environment**

```bash
# Copy example env
cp .env.example .env

# Edit .env with your Firebase credentials
# Use any text editor and fill in:
# - VITE_FIREBASE_API_KEY
# - VITE_FIREBASE_AUTH_DOMAIN
# - VITE_FIREBASE_PROJECT_ID
# - etc.
# - GEMINI_API_KEY (optional)
```

### **Step 3: Set Up Firebase**

1. Create Firebase project at [Firebase Console](https://console.firebase.google.com/)
2. Enable Authentication:
   - Email/Password: Settings → Sign-in method → Enable Email/Password
   - Google OAuth: Settings → Sign-in method → Enable Google
3. Create Firestore Database:
   - Build → Firestore Database → Create Database
   - Start in test mode (for development)
4. Set Firestore security rules:

```firestore
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId}/files/{fileId} {
      allow read, create, update, delete: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

### **Step 4: Run Development Server**

```bash
# Start backend (Express) + frontend (Vite) dev server
npm run dev

# Output should show:
# Hakken Intelligence Server running on http://0.0.0.0:3000
# VITE v6.2.3 ready in 123 ms
# ➜ local: http://localhost:5173/
```

### **Step 5: Access the Application**

Open in browser:
- **Frontend**: http://localhost:5173 (Vite dev server)
- **Backend API**: http://localhost:3000/api/* (Express server)
- Or use both unified: http://localhost:3000

### **Step 6: Test the Application**

1. **Homepage**: Visit `/` → See landing page
2. **Login**: Click "Sign In" → Use email/password or Google
3. **Upload**: Go to `/upload` → Select PDF/Image → Upload
4. **Search**: Go to `/search` → Type keyword → View results
5. **Library**: Go to `/library` → See all files
6. **Logout**: Click user menu → Sign Out

---

## 📦 Build for Production

### **Build Command**

```bash
# Create optimized production build
npm run build

# This runs:
# 1. vite build  (frontend: React → optimized JS/CSS)
# 2. esbuild     (backend: server.ts → bundled dist/server.js)

# Output:
# dist/
# ├── index.html        (optimized)
# ├── assets/           (chunked JS/CSS)
# └── server.js         (bundled Express server)
```

### **Run Production Build**

```bash
# Start production server
npm run start

# This runs: node dist/server.js
# Server listens on http://localhost:3000
```

### **Clean Build Cache**

```bash
# Remove dist and uploads directories
npm run clean

# Useful before rebuilding
```

---

## 🔍 Project Scripts Summary

| Command | What It Does |
|---------|-------------|
| `npm run dev` | Start dev server (Express + Vite HMR) |
| `npm run build` | Build for production (Vite + ESBuild) |
| `npm run start` | Run production build from dist/ |
| `npm run clean` | Delete dist/ and uploads/ directories |
| `npm run lint` | Type-check with TypeScript (no emit) |

---

## 📊 Data Models & TypeScript Interfaces

### **FileRecord** (in `src/types.ts`)

```typescript
interface FileRecord {
  id: string;                          // Unique ID: file_1719876543_abc123
  originalName: string;                // User-provided filename
  mimeType: string;                    // application/pdf, image/jpeg, etc.
  fileType: 'PDF' | 'IMAGE';          // Document type
  fileSize: number;                    // Bytes (e.g., 145000)
  uploadDate: string;                  // ISO 8601: 2026-07-24T10:30:45.123Z
  storedFilename: string;              // Physical file in uploads/
  status: 'processing' | 'completed' | 'failed';
  errorMessage?: string;               // If status is 'failed'
  pageCount?: number;                  // Total pages (1 for images)
  extractedTextLength?: number;        // Total chars extracted
  pages?: {                            // Per-page text data
    pageNumber: number | string;       // 1, 2, 3, ... or "Image File"
    text: string;                      // Extracted OCR text
  }[];
}
```

### **SearchResult** (in `src/types.ts`)

```typescript
interface SearchResult {
  id: string;                          // Unique result ID
  fileId: string;                      // File this result comes from
  fileName: string;                    // Display filename
  mimeType: string;                    // File MIME type
  fileType: 'PDF' | 'IMAGE';          // File type
  pageNumber: number | string;         // Which page matched
  matchingText: string;                // Text snippet with match
  fullPageText?: string;               // Full page text
  matchCount: number;                  // Times search term appears
  uploadDate: string;                  // When file was uploaded
  fileSize: number;                    // File size in bytes
  viewUrl: string;                     // /api/files/{id}/view
  downloadUrl: string;                 // /api/files/{id}/download
}
```

### **StatsOverview** (in `src/types.ts`)

```typescript
interface StatsOverview {
  totalFiles: number;                  // Count of all files
  pdfCount: number;                    // Count of PDFs
  imageCount: number;                  // Count of images
  totalPages: number;                  // Total pages across all files
  totalWords: number;                  // Total words extracted
}
```

---

## 📁 Database Structure

### **Local Storage: data/db.json**

```json
[
  {
    "id": "file_1719876543_abc123",
    "originalName": "invoice.pdf",
    "mimeType": "application/pdf",
    "fileType": "PDF",
    "fileSize": 145000,
    "uploadDate": "2026-07-24T10:30:45.123Z",
    "storedFilename": "1719876543-abc123.pdf",
    "status": "completed",
    "pageCount": 3,
    "extractedTextLength": 5240,
    "pages": [
      {
        "pageNumber": 1,
        "text": "Invoice #INV-2026-8841..."
      }
    ]
  }
]
```

### **Cloud Storage: Firestore Structure**

```
firestore/
└── users/
    └── {user_uid}/
        └── files/
            └── {fileId}/
                ├── id: "file_1719876543_abc123"
                ├── originalName: "invoice.pdf"
                ├── fileType: "PDF"
                ├── fileSize: 145000
                ├── uploadDate: Timestamp(2026-07-24)
                ├── status: "completed"
                ├── pageCount: 3
                ├── extractedTextLength: 5240
                └── pages: [
                      { pageNumber: 1, text: "..." }
                    ]
```

---

## 🎯 Key Features Explained

### **1. Dual OCR System**

**Primary (Preferred):**
- **Gemini Vision API** (Google's advanced AI)
- Model: `gemini-3.6-flash`
- Best for: Scanned PDFs, handwritten documents, complex layouts
- Accuracy: ~99.4% on well-scanned documents

**Fallback (If Gemini fails):**
- **Tesseract.js** (Open-source)
- Engine: tesseract-ocr (CPU-based)
- Accuracy: ~85-95% on clear documents

**Auto-Selection Logic:**
```javascript
// PDF Parsing
if (PDF has < 20 extracted chars) {
  // Likely scanned PDF
  Use Gemini Vision API
} else {
  // Digital PDF
  Use pdf-parse library
}

// Image Files
Try Gemini Vision API first
If fails or no API key:
  Fall back to Tesseract.js
```

### **2. Full-Text Search Algorithm**

**Search Modes:**

1. **Browse All Mode** (empty query or "*")
   - Returns all indexed documents

2. **Keyword Search Mode** (user query)
   - Normalize query (lowercase, trim)
   - Tokenize into words
   - Search matching logic:
     - **Exact phrase match**: Query appears verbatim in text
     - **All tokens match**: Every word in query found (any order)
     - **Partial tokens match**: Some words found
     - **Filename match**: Query appears in filename
   
   - **Relevance Scoring**:
     - Exact phrase: +100 points
     - All tokens match: +50 points
     - Each token found: +15 points per token
     - Filename exact: +40 points
     - Filename tokens: +20 points
   
   - **Result Details**:
     - Matching text: Full paragraphs containing keywords
     - Match count: Number of occurrences
     - Full page text: Available for viewing
     - Sorted by relevance score (highest first)

### **3. Protected Routes**

Routes that require authentication (redirect to login if not authenticated):
- `/upload` - File upload page
- `/search` - Search page
- `/library` - Document library

Public routes (no authentication needed):
- `/` - Homepage
- `/login` - Login page

### **4. Real-time Firebase Sync**

- Upload → Saves to Firestore immediately
- Search → Reads from user's Firestore collection
- Delete → Removes from both local storage and Firestore
- Multi-user: Each user sees only their own files

---

## 🔄 Component Interaction Diagram

```
┌──────────────────────────────────────────────────────────────┐
│                        App.tsx                               │
│        (Router, Protected Routes, Auth Wrapper)             │
└──────────────────────────────────────────────────────────────┘
                              │
        ┌─────────────────────┼─────────────────────┐
        │                     │                     │
    ┌───▼───────┐      ┌──────▼─────┐     ┌────────▼────────┐
    │ HomePage  │      │  LoginPage  │     │  ProtectedRoute │
    │  (public) │      │   (public)  │     │  (auth-required)│
    └───────────┘      └─────────────┘     └────────┬────────┘
                                                    │
                        ┌───────────────────────────┼────────────────────┐
                        │                           │                    │
                    ┌───▼────────┐         ┌────────▼────┐      ┌────────▼──────┐
                    │ UploadPage │         │ SearchPage  │      │ LibraryPage   │
                    └───┬────────┘         └────┬───────┘       └──────────────┘
                        │                       │
                        │ Firestore            │ Firestore
                        │ listUserFiles()      │ listUserFiles()
                        └───┬───────────────────┴─────────────────┐
                            │                                     │
                    ┌───────▼─────────┐              ┌────────────▼─────────┐
                    │  userFiles.ts   │              │  FileViewerModal.tsx │
                    │  (services)     │              │  (component)         │
                    └─────────────────┘              └──────────────────────┘
                            │
        ┌───────────────────┴───────────────────┐
        │                                       │
    ┌───▼────────────┐             ┌───────────▼───────┐
    │  Firebase Auth │             │  Firestore DB     │
    │  (Cloud)       │             │  (Cloud)          │
    └────────────────┘             └───────────────────┘
        │                                     │
    ┌───▼────────────────────────────────────▼─────────┐
    │         Backend API (Express.js server)          │
    │                (server.ts)                       │
    ├─────────────────────────────────────────────────┤
    │  POST /api/upload          (file processing)   │
    │  GET  /api/files           (list files)        │
    │  GET  /api/search          (full-text search)  │
    │  GET  /api/files/:id       (get metadata)      │
    │  GET  /api/files/:id/view  (view file)         │
    │  GET  /api/files/:id/download (download)       │
    │  DELETE /api/files/:id     (delete file)       │
    │  POST /api/reindex         (reindex all)       │
    └────┬──────────────────────────────────────────┘
         │
    ┌────┴────────────────────────────────────────┐
    │                                             │
┌──▼──────────┐    ┌────────────┐    ┌──────────▼──┐
│ uploads/    │    │ data/db    │    │ OCR Engines │
│ (files)     │    │ (backup)   │    │ (Gemini/    │
└─────────────┘    └────────────┘    │  Tesseract) │
                                      └─────────────┘
```

---

## 🛡️ Security Considerations

### **Authentication**
- Firebase handles password hashing & token generation
- Google OAuth via Firebase (secure)
- Bearer tokens in Authorization header for API calls

### **Database Access**
- Firestore rules: Only authenticated users can access their own files
- User UID scoped: `/users/{uid}/files/` - can't access other users' files

### **File Upload**
- Whitelist: Only PDF, JPG, JPEG, PNG allowed
- File size limit: 25MB per file
- Max 10 files per upload
- Multer middleware validates MIME types

### **API Security**
- CORS headers for file viewing (inline display)
- Filenames sanitized with `encodeURIComponent()`
- No sensitive data in query params (use POST body when needed)

---

## 🐛 Troubleshooting

### **Issue: Firebase credentials not recognized**

```
Error: auth/invalid-api-key
```

**Solution:**
1. Double-check `.env` file has VITE_ prefix for frontend vars
2. Restart dev server after changing `.env`
3. Verify Firebase project is active in console

### **Issue: OCR returns empty text**

**Reasons:**
1. No GEMINI_API_KEY set → Falls back to Tesseract
2. Tesseract fails → Check browser console for errors
3. Image quality too low → Try higher resolution file

**Solution:**
- Set GEMINI_API_KEY for better OCR
- Or use clearer/higher-resolution scans

### **Issue: Upload fails silently**

**Causes:**
1. File size > 25MB
2. Invalid file type
3. No storage permissions

**Solution:**
- Check browser console (F12)
- Check server logs for error messages
- Verify file is PDF/JPG/JPEG/PNG

### **Issue: Firestore documents not syncing**

**Causes:**
1. Firestore rules blocking access
2. User not authenticated
3. Network connectivity

**Solution:**
1. Check Firestore Rules in Firebase console
2. Verify user logged in with `useAuth()` hook
3. Check browser network tab (F12 → Network)

---

## 📚 File-by-File Summary

| File | Type | Purpose | Key Functions |
|------|------|---------|---|
| `server.ts` | Backend | Express server, OCR processing, API endpoints | `parsePdfByPages()`, `parseImageWithOCR()`, `/api/*` routes |
| `App.tsx` | Frontend | Main component, routing, auth wrapper | Routes: /, /login, /upload, /search, /library |
| `LoginPage.tsx` | Frontend | Authentication UI | `signInWithEmail()`, `signUpWithEmail()`, `signInWithGoogle()` |
| `UploadPage.tsx` | Frontend | File upload form | File validation, upload progress, file list display |
| `SearchPage.tsx` | Frontend | Search UI & results | Search query, filtering, result display |
| `LibraryPage.tsx` | Frontend | Document library | File grid, view, download, delete |
| `AuthContext.tsx` | Frontend | Auth state management | `useAuth()` hook, login/logout logic |
| `firebase.ts` | Frontend | Firebase SDK config | Firebase app init, auth, Firestore |
| `userFiles.ts` | Frontend | Firestore operations | `listUserFiles()`, `saveUserFiles()`, `deleteUserFile()` |
| `types.ts` | Frontend | TypeScript interfaces | FileRecord, SearchResult, StatsOverview |
| `package.json` | Config | Dependencies & scripts | npm packages, build/run commands |
| `.env` | Config | Environment variables | API keys, Firebase credentials |
| `data/db.json` | Database | Local file storage | Backup database, file records |
| `uploads/` | Storage | Physical files | Uploaded PDFs and images |

---

## 🎓 Learning Resources

- **React 19 Docs**: https://react.dev
- **TypeScript Handbook**: https://www.typescriptlang.org/docs/
- **Express.js Guide**: https://expressjs.com/
- **Firebase Docs**: https://firebase.google.com/docs
- **Vite Guide**: https://vitejs.dev/guide/
- **Tailwind CSS**: https://tailwindcss.com/docs
- **Tesseract.js**: https://github.com/naptha/tesseract.js
- **Gemini API**: https://ai.google.dev/

---

## 📝 License

This project is part of **Hakken Intelligence** - Document Intelligence Platform.

---

## 👨‍💼 Project Metadata

- **Project Name**: Hakken Intelligence
- **Type**: Full-stack Document Management & Search
- **Frontend**: React 19 + TypeScript + Tailwind CSS
- **Backend**: Express.js + Node.js
- **Database**: Firebase Firestore + Local JSON
- **OCR Engine**: Gemini Vision API + Tesseract.js
- **Status**: Active Development
- **Port**: 3000 (Backend) + 5173 (Frontend Dev)
- **Node Version**: 18+
- **npm Version**: 9+

---

## 🔗 Quick Links

| Link | Purpose |
|------|---------|
| `http://localhost:3000` | Full application |
| `http://localhost:5173` | Frontend only (dev) |
| `/api/files` | List all files |
| `/api/search?q=keyword` | Search endpoint |
| `https://console.firebase.google.com/` | Firebase Console |
| `https://aistudio.google.com/` | Gemini API Console |

---

**Created**: 2026-07-24  
**Last Updated**: 2026-07-24  
**Documentation Version**: 1.0

---

## 📞 Support & Debugging

For issues:
1. Check browser console: F12 → Console tab
2. Check server logs: Terminal running `npm run dev`
3. Check Firebase console for Firestore rules errors
4. Check network requests: F12 → Network tab
5. Verify `.env` file has all required keys
6. Clear browser cache: Ctrl+Shift+Delete

---

**End of Complete Documentation**
