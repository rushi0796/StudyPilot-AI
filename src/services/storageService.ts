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
 * - Preloaded academic curriculum demo documents ONLY visible in unauthenticated guest/demo mode
 * - Authenticated students start with a 100% clean, empty document workspace
 * - Never returns documents belonging to another student
 */
export function filterDocumentsForUser(docs: UploadedDocument[], userId?: string): UploadedDocument[] {
  const targetUser = userId || 'guest';
  return docs.filter(doc => {
    // System preloaded demo documents are strictly isolated to guest mode
    if (doc.id === 'doc_dbms_handout' || doc.id.startsWith('preloaded_')) {
      return targetUser === 'guest';
    }
    // Explicit student ownership check for authenticated users
    if (doc.userId) {
      return doc.userId === targetUser;
    }
    // Legacy unassigned documents only visible to guest mode
    return targetUser === 'guest';
  });
}

/**
 * Load all documents from persistent storage (Server API synced with IndexedDB) with strict per-user isolation
 */
export async function loadPersistentDocuments(userId?: string): Promise<UploadedDocument[]> {
  // 1. If student is authenticated, attempt to sync with server-side PostgreSQL
  if (userId && userId !== 'guest' && typeof fetch !== 'undefined') {
    try {
      const response = await fetch('/api/documents', {
        method: 'GET',
        headers: { 'Accept': 'application/json' },
        credentials: 'include'
      });

      if (response.ok) {
        const data = await response.json();
        const serverDocs: Array<{
          id: string;
          name: string;
          type: string;
          size: number;
          uploadStatus: string;
          processingStatus: string;
          chunkCount: number;
          wordCount: number;
          subjectId?: string;
          createdAt: string;
        }> = data.documents || [];

        // Try reading local IndexedDB to reuse extracted text & chunks if already cached
        let localMap = new Map<string, UploadedDocument>();
        try {
          const db = await openDatabase();
          const localTx = db.transaction(STORE_NAME, 'readonly');
          const store = localTx.objectStore(STORE_NAME);
          const localDocs: UploadedDocument[] = await new Promise((res) => {
            const req = store.getAll();
            req.onsuccess = () => res(req.result || []);
            req.onerror = () => res([]);
          });
          localDocs.forEach(d => localMap.set(d.id, d));
        } catch {}

        const mapped: UploadedDocument[] = [];
        for (const sDoc of serverDocs) {
          const cached = localMap.get(sDoc.id);
          if (cached && (cached.chunks?.length || 0) > 0) {
            mapped.push(cached);
          } else {
            // Need details (chunks & text)
            try {
              const detailRes = await fetch(`/api/documents?id=${encodeURIComponent(sDoc.id)}`, {
                credentials: 'include'
              });
              if (detailRes.ok) {
                const detailData = await detailRes.json();
                const d = detailData.document;
                const fullDoc: UploadedDocument = {
                  id: d.id,
                  userId,
                  name: d.name,
                  size: d.size,
                  type: (d.type as any) || 'pdf',
                  uploadedAt: d.createdAt || sDoc.createdAt || 'Just now',
                  text: d.extractedText || '',
                  wordCount: d.wordCount || 0,
                  chunks: d.chunks || [],
                  status: (d.processingStatus === 'indexed' || d.uploadStatus === 'completed') ? 'ready' : 'processing',
                  subjectId: d.subjectId
                };
                mapped.push(fullDoc);
                // Cache into IndexedDB
                openDatabase().then(db => {
                  const tx = db.transaction(STORE_NAME, 'readwrite');
                  tx.objectStore(STORE_NAME).put(fullDoc);
                }).catch(() => {});
              } else {
                mapped.push({
                  id: sDoc.id,
                  userId,
                  name: sDoc.name,
                  size: sDoc.size,
                  type: (sDoc.type as any) || 'pdf',
                  uploadedAt: sDoc.createdAt || 'Just now',
                  text: '',
                  wordCount: sDoc.wordCount || 0,
                  chunks: [],
                  status: 'ready',
                  subjectId: sDoc.subjectId
                });
              }
            } catch {
              mapped.push({
                id: sDoc.id,
                userId,
                name: sDoc.name,
                size: sDoc.size,
                type: (sDoc.type as any) || 'pdf',
                uploadedAt: sDoc.createdAt || 'Just now',
                text: '',
                wordCount: sDoc.wordCount || 0,
                chunks: [],
                status: 'ready',
                subjectId: sDoc.subjectId
              });
            }
          }
        }
        return mapped;
      }
    } catch {
      // Server unreachable; fall back to local IndexedDB
    }
  }

  // 2. Fallback to local IndexedDB
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
          // For authenticated students, strictly return their personal saved documents (empty if brand new)
          if (userId && userId !== 'guest') {
            resolve(userDocs);
          } else {
            resolve(userDocs.length > 0 ? userDocs : INITIAL_PRELOADED_DOCUMENTS);
          }
        } else {
          // If persistent store is empty:
          if (userId && userId !== 'guest') {
            // Real authenticated students start with an empty document list
            resolve([]);
          } else {
            // Unauthenticated guest/demo mode seeds initial sample documents
            seedInitialDocuments(db).then(docs => resolve(filterDocumentsForUser(docs, userId))).catch(() => resolve(INITIAL_PRELOADED_DOCUMENTS));
          }
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
 * Persist a document in IndexedDB and server-side PostgreSQL
 */
export async function savePersistentDocument(doc: UploadedDocument, userId?: string): Promise<void> {
  const docToSave: UploadedDocument = {
    ...doc,
    userId: doc.userId || userId || 'guest'
  };

  // Sync to server-side PostgreSQL if authenticated
  if (userId && userId !== 'guest' && typeof fetch !== 'undefined') {
    fetch('/api/documents', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({
        id: docToSave.id,
        name: docToSave.name,
        type: docToSave.type,
        size: docToSave.size,
        extractedText: docToSave.text,
        chunks: docToSave.chunks,
        chunkCount: docToSave.chunks?.length || 0,
        wordCount: docToSave.wordCount || 0,
        fileData: docToSave.fileData || '',
        subjectId: docToSave.subjectId
      })
    }).catch(err => console.warn('Background server document sync failed:', err));
  }

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
 * Permanently delete a document from IndexedDB and server-side PostgreSQL
 */
export async function deletePersistentDocument(docId: string, userId?: string): Promise<void> {
  // Sync deletion to server if authenticated
  if (userId && userId !== 'guest' && typeof fetch !== 'undefined') {
    fetch(`/api/documents?id=${encodeURIComponent(docId)}`, {
      method: 'DELETE',
      credentials: 'include'
    }).catch(err => console.warn('Background server document delete failed:', err));
  }

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
  if (userId && userId !== 'guest') {
    return [];
  }
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
