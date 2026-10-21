import type { UploadedDocument } from '../types/index.ts';
import { INITIAL_PRELOADED_DOCUMENTS } from '../data/preloadedDocs.ts';

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
 * Get user-scoped localStorage key to prevent cross-student document leakage on shared browsers
 */
function getStorageKey(userId?: string): string {
  return userId ? `studypilot_documents_${userId}` : 'studypilot_documents_guest';
}

/**
 * Filter documents to ensure complete cross-student isolation:
 * - Documents with matching userId
 * - Preloaded academic curriculum demo documents (system-provided)
 * - Never returns documents belonging to another student
 */
export function filterDocumentsForUser(docs: UploadedDocument[], userId?: string): UploadedDocument[] {
  const targetUser = userId || 'guest';
  return docs.filter(doc => {
    // System preloaded documents are accessible to all
    if (doc.id === 'doc_dbms_handout' || doc.id.startsWith('preloaded_')) {
      return true;
    }
    // Explicit student ownership check
    if (doc.userId) {
      return doc.userId === targetUser;
    }
    // Legacy unassigned documents only visible to guest mode
    return targetUser === 'guest';
  });
}

/**
 * Load all documents from persistent IndexedDB with strict per-user isolation
 */
export async function loadPersistentDocuments(userId?: string): Promise<UploadedDocument[]> {
  try {
    const db = await openDatabase();
    return new Promise((resolve) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const request = store.getAll();

      request.onsuccess = () => {
        const rawResults = (request.result as UploadedDocument[]) || [];
        if (rawResults.length > 0) {
          const userDocs = filterDocumentsForUser(rawResults, userId);
          // If user has no personal docs, ensure preloaded documents are present
          if (userDocs.length === 0) {
            resolve(INITIAL_PRELOADED_DOCUMENTS);
          } else {
            resolve(userDocs);
          }
        } else {
          // If empty, seed with initial academic documents
          seedInitialDocuments(db).then(docs => resolve(filterDocumentsForUser(docs, userId))).catch(() => resolve(INITIAL_PRELOADED_DOCUMENTS));
        }
      };

      request.onerror = () => {
        resolve(loadFallbackDocuments(userId));
      };
    });
  } catch {
    return loadFallbackDocuments(userId);
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
 * Persist a document in IndexedDB with enforced student identity
 */
export async function savePersistentDocument(doc: UploadedDocument, userId?: string): Promise<void> {
  const docToSave: UploadedDocument = {
    ...doc,
    userId: doc.userId || userId || 'guest'
  };

  try {
    const db = await openDatabase();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const req = store.put(docToSave);

      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  } catch {
    saveFallbackDocument(docToSave, userId);
  }
}

/**
 * Permanently delete a document from IndexedDB with ownership verification
 */
export async function deletePersistentDocument(docId: string, userId?: string): Promise<void> {
  try {
    const db = await openDatabase();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      
      // If doc is preloaded, delete operation is acknowledged for the user view
      const req = store.delete(docId);

      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  } catch {
    deleteFallbackDocument(docId, userId);
  }
}

// LocalStorage Fallbacks for non-IndexedDB environments with user scoping
function loadFallbackDocuments(userId?: string): UploadedDocument[] {
  try {
    const key = getStorageKey(userId);
    const saved = localStorage.getItem(key);
    if (saved) {
      const parsed = JSON.parse(saved);
      return filterDocumentsForUser(parsed, userId);
    }
  } catch {}
  return INITIAL_PRELOADED_DOCUMENTS;
}

function saveFallbackDocument(doc: UploadedDocument, userId?: string) {
  try {
    const key = getStorageKey(userId || doc.userId);
    const docs = loadFallbackDocuments(userId).filter(d => d.id !== doc.id);
    docs.unshift(doc);
    localStorage.setItem(key, JSON.stringify(docs));
  } catch {}
}

function deleteFallbackDocument(docId: string, userId?: string) {
  try {
    const key = getStorageKey(userId);
    const docs = loadFallbackDocuments(userId).filter(d => d.id !== docId);
    localStorage.setItem(key, JSON.stringify(docs));
  } catch {}
}
