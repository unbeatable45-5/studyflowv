// Persist the last uploaded PDF in IndexedDB so users can resume without re-uploading.
const DB_NAME = "studyflow-pdf";
const STORE = "files";
const KEY = "last";

interface StoredPdf {
  name: string;
  size: number;
  type: string;
  savedAt: number;
  data: ArrayBuffer;
}

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE)) db.createObjectStore(STORE);
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

export async function saveLastPdf(file: File): Promise<void> {
  try {
    if (file.size > 25 * 1024 * 1024) return; // skip huge files
    const data = await file.arrayBuffer();
    const db = await openDb();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE, "readwrite");
      tx.objectStore(STORE).put(
        { name: file.name, size: file.size, type: file.type, savedAt: Date.now(), data } satisfies StoredPdf,
        KEY,
      );
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
    db.close();
    localStorage.setItem("studyflow:lastPdfMeta", JSON.stringify({ name: file.name, savedAt: Date.now() }));
  } catch {
    // ignore – persistence is best-effort
  }
}

export async function loadLastPdf(): Promise<File | null> {
  try {
    const db = await openDb();
    const stored = await new Promise<StoredPdf | undefined>((resolve, reject) => {
      const tx = db.transaction(STORE, "readonly");
      const req = tx.objectStore(STORE).get(KEY);
      req.onsuccess = () => resolve(req.result as StoredPdf | undefined);
      req.onerror = () => reject(req.error);
    });
    db.close();
    if (!stored) return null;
    return new File([stored.data], stored.name, { type: stored.type || "application/pdf" });
  } catch {
    return null;
  }
}

export async function clearLastPdf(): Promise<void> {
  try {
    const db = await openDb();
    await new Promise<void>((resolve) => {
      const tx = db.transaction(STORE, "readwrite");
      tx.objectStore(STORE).delete(KEY);
      tx.oncomplete = () => resolve();
      tx.onerror = () => resolve();
    });
    db.close();
    localStorage.removeItem("studyflow:lastPdfMeta");
  } catch {
    // ignore
  }
}

export function getLastPdfMeta(): { name: string; savedAt: number } | null {
  try {
    const raw = localStorage.getItem("studyflow:lastPdfMeta");
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}
