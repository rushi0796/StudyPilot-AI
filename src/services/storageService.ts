import { UploadedDocument } from '../types';
import { INITIAL_PRELOADED_DOCUMENTS } from './documentParser';

const DB_NAME = 'StudyPilot_Documents_DB';
const DB_VERSION = 1;
const STORE_NAME = 'documents';

function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !window.indexedDB) {
      reject(new Error('IndexedDB is not supported in this environment'));
      return;
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id' });
      }
    };

    request.onsuccess = () => {
      resolve(request.result);
    };

    request.onerror = () => {
      reject(request.error || new Error('Failed to open IndexedDB'));
    };
  });
}

/**
 * Load all documents from persistent IndexedDB
 */
export async function loadPersistentDocuments(): Promise<UploadedDocument[]> {
  try {
    const db = await openDatabase();
    return new Promise((resolve) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const request = store.getAll();

      request.onsuccess = () => {
        const results = request.result as UploadedDocument[];
        if (results && results.length > 0) {
          resolve(results);
        } else {
          // If empty, seed with initial academic documents
          seedInitialDocuments(db).then(resolve).catch(() => resolve(INITIAL_PRELOADED_DOCUMENTS));
        }
      };

      request.onerror = () => {
        resolve(loadFallbackDocuments());
      };
    });
  } catch {
    return loadFallbackDocuments();
  }
}

async function seedInitialDocuments(db: IDBDatabase): Promise<UploadedDocument[]> {
  return new Promise((resolve) => {
    try {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      for (const doc of INITIAL_PRELOADED_DOCUMENTS) {
        store.put(doc);
      }
      tx.oncomplete = () => resolve(INITIAL_PRELOADED_DOCUMENTS);
      tx.onerror = () => resolve(INITIAL_PRELOADED_DOCUMENTS);
    } catch {
      resolve(INITIAL_PRELOADED_DOCUMENTS);
    }
  });
}

/**
 * Persist a document in IndexedDB
 */
export async function savePersistentDocument(doc: UploadedDocument): Promise<void> {
  try {
    const db = await openDatabase();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const req = store.put(doc);

      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  } catch {
    saveFallbackDocument(doc);
  }
}

/**
 * Permanently delete a document from IndexedDB
 */
export async function deletePersistentDocument(docId: string): Promise<void> {
  try {
    const db = await openDatabase();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const req = store.delete(docId);

      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  } catch {
    deleteFallbackDocument(docId);
  }
}

// LocalStorage Fallbacks for non-IndexedDB environments
function loadFallbackDocuments(): UploadedDocument[] {
  try {
    const saved = localStorage.getItem('studypilot_documents');
    if (saved) return JSON.parse(saved);
  } catch {}
  return INITIAL_PRELOADED_DOCUMENTS;
}

function saveFallbackDocument(doc: UploadedDocument) {
  try {
    const docs = loadFallbackDocuments().filter(d => d.id !== doc.id);
    docs.unshift(doc);
    localStorage.setItem('studypilot_documents', JSON.stringify(docs));
  } catch {}
}

function deleteFallbackDocument(docId: string) {
  try {
    const docs = loadFallbackDocuments().filter(d => d.id !== docId);
    localStorage.setItem('studypilot_documents', JSON.stringify(docs));
  } catch {}
}
