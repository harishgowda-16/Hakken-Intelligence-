import {
  collection,
  deleteDoc,
  doc,
  getDocs,
  orderBy,
  query,
  setDoc,
} from 'firebase/firestore';
import { db } from '../firebase';
import { FileRecord } from '../types';

const userFilesCollection = (uid: string) => collection(db, 'users', uid, 'files');

const toFirestoreRecord = (record: FileRecord): FileRecord => ({
  ...record,
  pages: record.pages || [],
});

export async function listUserFiles(uid: string): Promise<FileRecord[]> {
  const snapshot = await getDocs(query(userFilesCollection(uid), orderBy('uploadDate', 'desc')));
  return snapshot.docs.map((fileDoc) => ({
    id: fileDoc.id,
    ...(fileDoc.data() as Omit<FileRecord, 'id'>),
  }));
}

export async function saveUserFiles(uid: string, records: FileRecord[]) {
  await Promise.all(
    records.map((record) =>
      setDoc(doc(userFilesCollection(uid), record.id), toFirestoreRecord(record)),
    ),
  );
}

export async function deleteUserFile(uid: string, fileId: string) {
  await deleteDoc(doc(userFilesCollection(uid), fileId));
}
