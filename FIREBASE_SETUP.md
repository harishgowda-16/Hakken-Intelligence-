Firebase setup (local)

1. Create a `.env` file in the project root with these Vite variables (replace values from your Firebase console):

VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
VITE_FIREBASE_APP_ID=your_app_id
VITE_FIREBASE_MEASUREMENT_ID=G-XXXXXXX

2. Restart the dev server if it's running so Vite picks up env changes.

3. You can now visit `/login` to sign in with email/password or Google.

4. Enable Firestore Database in Firebase Console and publish rules like this so users can only access their own document index:

```
rules_version = '2';

service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId}/files/{fileId} {
      allow read, create, update, delete: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

The app stores document records at `users/{uid}/files/{fileId}` after the OCR server finishes processing the upload.
