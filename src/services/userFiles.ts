import {
  collection,
  deleteDoc,
  doc,
  getDocs,
  orderBy,
  query,
  setDoc,
} from 'firebase/firestore';
import { db, isFirebaseConfigured } from '../firebase';
import { FileRecord } from '../types';
import { api } from './api';

const userFilesCollection = (uid: string) => {
  if (!db) throw new Error('Firebase is not configured.');
  return collection(db, 'users', uid, 'files');
};

const toFirestoreRecord = (record: FileRecord): FileRecord => ({
  ...record,
  pages: record.pages || [],
});

export async function listUserFiles(uid: string): Promise<FileRecord[]> {
  if (!isFirebaseConfigured || !db) {
    const response = await api.get<FileRecord[]>('/api/files');
    return response.data;
  }

  const snapshot = await getDocs(query(userFilesCollection(uid), orderBy('uploadDate', 'desc')));
  return snapshot.docs.map((fileDoc) => ({
    id: fileDoc.id,
    ...(fileDoc.data() as Omit<FileRecord, 'id'>),
  }));
}

export async function saveUserFiles(uid: string, records: FileRecord[]) {
  if (!isFirebaseConfigured || !db) {
    return;
  }

  await Promise.all(
    records.map((record) =>
      setDoc(doc(userFilesCollection(uid), record.id), toFirestoreRecord(record)),
    ),
  );
}

export async function deleteUserFile(uid: string, fileId: string) {
  if (!isFirebaseConfigured || !db) {
    return;
  }

  await deleteDoc(doc(userFilesCollection(uid), fileId));
}
