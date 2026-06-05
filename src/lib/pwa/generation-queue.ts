const DB_NAME = "influexai-pwa";
const STORE = "generation-queue";

type QueueItem = {
  id: string;
  url: string;
  method: string;
  body: string;
  createdAt: number;
};

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1);
    req.onerror = () => reject(req.error);
    req.onsuccess = () => resolve(req.result);
    req.onupgradeneeded = () => {
      req.result.createObjectStore(STORE, { keyPath: "id" });
    };
  });
}

export async function enqueueGenerationRequest(
  url: string,
  method: string,
  body: Record<string, unknown>
): Promise<void> {
  const db = await openDb();
  const item: QueueItem = {
    id: crypto.randomUUID(),
    url,
    method,
    body: JSON.stringify(body),
    createdAt: Date.now(),
  };
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE, "readwrite");
    tx.objectStore(STORE).add(item);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
  db.close();

  if ("serviceWorker" in navigator) {
    try {
      const reg = await navigator.serviceWorker.ready;
      const sync = (reg as ServiceWorkerRegistration & {
        sync?: { register: (tag: string) => Promise<void> };
      }).sync;
      await sync?.register("sync-generations");
    } catch {
      /* Background Sync not supported */
    }
  }
}

export async function flushGenerationQueue(): Promise<number> {
  const db = await openDb();
  const items = await new Promise<QueueItem[]>((resolve, reject) => {
    const tx = db.transaction(STORE, "readonly");
    const req = tx.objectStore(STORE).getAll();
    req.onsuccess = () => resolve(req.result as QueueItem[]);
    req.onerror = () => reject(req.error);
  });

  let flushed = 0;
  for (const item of items) {
    try {
      const res = await fetch(item.url, {
        method: item.method,
        headers: { "Content-Type": "application/json" },
        body: item.body,
      });
      if (res.ok) {
        await new Promise<void>((resolve, reject) => {
          const tx = db.transaction(STORE, "readwrite");
          tx.objectStore(STORE).delete(item.id);
          tx.oncomplete = () => resolve();
          tx.onerror = () => reject(tx.error);
        });
        flushed += 1;
      }
    } catch {
      /* stay in queue */
    }
  }
  db.close();
  return flushed;
}
