# Deployment Guide

This project is ready for a split deployment:

- Backend API: Render
- Frontend SPA: Vercel
- Auth and user document index: Firebase

## 1. Firebase

In Firebase Console:

1. Go to Authentication > Sign-in method.
2. Enable Google.
3. Add authorized domains:
   - `localhost`
   - `127.0.0.1`
   - your Vercel domain, for example `your-vercel-app.vercel.app`
   - your custom domain, if you add one later
4. Go to Firestore Database and create a database if you have not already.

Use these Firebase frontend env vars in Vercel:

```env
VITE_FIREBASE_API_KEY="AIzaSyDUDjjY-lyn3U3r6EkpPtAHIvWeuDrqdfs"
VITE_FIREBASE_AUTH_DOMAIN="hakken-intelligence.firebaseapp.com"
VITE_FIREBASE_PROJECT_ID="hakken-intelligence"
VITE_FIREBASE_STORAGE_BUCKET="hakken-intelligence.firebasestorage.app"
VITE_FIREBASE_MESSAGING_SENDER_ID="1060354820942"
VITE_FIREBASE_APP_ID="1:1060354820942:web:e3845d1123adc6dc7fec1f"
VITE_FIREBASE_MEASUREMENT_ID="G-G6MTH8G3ZX"
```

## 2. Deploy Backend To Render

Create a new Render Web Service from this repo.

Use:

```text
Build Command: npm install && npm run build:backend
Start Command: npm start
```

Add these Render environment variables:

```env
NODE_ENV="production"
APP_URL="https://your-render-service.onrender.com"
FRONTEND_URL="https://your-vercel-app.vercel.app"
CORS_ORIGIN="https://your-vercel-app.vercel.app"
GEMINI_API_KEY="your_gemini_api_key"
```

After deploy, test:

```text
https://your-render-service.onrender.com/api/health
```

You should see JSON with `"status": "ok"`.

## 3. Deploy Frontend To Vercel

Create a new Vercel project from the same repo.

Use:

```text
Framework Preset: Vite
Build Command: npm run build:frontend
Output Directory: dist
```

Add these Vercel environment variables:

```env
VITE_API_BASE_URL="https://your-render-service.onrender.com"
VITE_FIREBASE_API_KEY="AIzaSyDUDjjY-lyn3U3r6EkpPtAHIvWeuDrqdfs"
VITE_FIREBASE_AUTH_DOMAIN="hakken-intelligence.firebaseapp.com"
VITE_FIREBASE_PROJECT_ID="hakken-intelligence"
VITE_FIREBASE_STORAGE_BUCKET="hakken-intelligence.firebasestorage.app"
VITE_FIREBASE_MESSAGING_SENDER_ID="1060354820942"
VITE_FIREBASE_APP_ID="1:1060354820942:web:e3845d1123adc6dc7fec1f"
VITE_FIREBASE_MEASUREMENT_ID="G-G6MTH8G3ZX"
```

Deploy, then copy the Vercel URL back into Render:

```env
FRONTEND_URL="https://your-vercel-app.vercel.app"
CORS_ORIGIN="https://your-vercel-app.vercel.app"
```

Redeploy the Render backend after changing those values.

## 4. Important Storage Note

Render's default filesystem is temporary. Uploaded files in `uploads/` and local metadata in `data/db.json` can disappear after redeploys.

For real production use, either:

- add a Render persistent disk mounted to the project directory, or
- move uploaded files to Firebase Storage and keep metadata in Firestore.

The current code will deploy and run, but persistent storage should be handled before depending on it for important documents.
