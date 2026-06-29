// QHSE CHECKLIST MODULE
// Purpose: IndexedDB persistence wrapper for offline draft management.
// Stores checklist metadata, answers, and image attachments as Blobs/Files.

const DB_NAME = "QHSE_Drafts_DB";
const STORE_NAME = "drafts";
const QUEUE_STORE_NAME = "sync_queue";
const DB_VERSION = 1;

let isMigrated = false;

function openDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = (event) => {
      console.error("IndexedDB error:", event.target.error);
      reject(event.target.error);
    };

    request.onsuccess = (event) => {
      const db = event.target.result;
      if (!isMigrated) {
        isMigrated = true;
        migrateOldDatabase().catch(err => console.error("Auto migration failed:", err));
      }
      resolve(db);
    };

    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: "id" });
      }
      if (!db.objectStoreNames.contains(QUEUE_STORE_NAME)) {
        db.createObjectStore(QUEUE_STORE_NAME, { keyPath: "id", autoIncrement: true });
      }
    };
  });
}

/**
 * Migration helper to copy drafts from old KonstructDraftsDB to QHSE_Drafts_DB
 */
async function migrateOldDatabase() {
  try {
    const oldDb = await new Promise((resolve) => {
      const req = indexedDB.open("KonstructDraftsDB", 1);
      req.onerror = () => resolve(null);
      req.onsuccess = () => resolve(req.result);
      req.onupgradeneeded = () => resolve(null);
    });
    if (!oldDb) return;
    if (!oldDb.objectStoreNames.contains("qhse_drafts")) {
      oldDb.close();
      return;
    }
    
    const oldDrafts = await new Promise((resolve) => {
      const tx = oldDb.transaction(["qhse_drafts"], "readonly");
      const store = tx.objectStore("qhse_drafts");
      const req = store.getAll();
      req.onsuccess = () => resolve(req.result || []);
      req.onerror = () => resolve([]);
    });

    if (oldDrafts.length > 0) {
      console.log(`Migrating ${oldDrafts.length} drafts from KonstructDraftsDB to QHSE_Drafts_DB`);
      for (const draft of oldDrafts) {
        await saveLocalDraft(draft);
      }
    }
    oldDb.close();
  } catch (err) {
    console.error("Old database migration failed:", err);
  }
}

/**
 * Save or update a draft in IndexedDB.
 */
export async function saveLocalDraft(draft) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], "readwrite");
    const store = transaction.objectStore(STORE_NAME);
    const request = store.put(draft);

    request.onsuccess = () => resolve(true);
    request.onerror = (event) => reject(event.target.error);
  });
}

/**
 * Get a single draft by userId and draftId.
 */
export async function getLocalDraft(userId, draftId) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const key = `${userId}_${draftId}`;
    const transaction = db.transaction([STORE_NAME], "readonly");
    const store = transaction.objectStore(STORE_NAME);
    const request = store.get(key);

    request.onsuccess = () => resolve(request.result || null);
    request.onerror = (event) => reject(event.target.error);
  });
}

/**
 * Get a draft by its serverId (to match synced instances).
 */
export async function getLocalDraftByServerId(userId, serverId) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], "readonly");
    const store = transaction.objectStore(STORE_NAME);
    const request = store.openCursor();
    let found = null;

    request.onsuccess = (event) => {
      const cursor = event.target.result;
      if (cursor) {
        const val = cursor.value;
        if (val.userId === userId && val.serverId === serverId) {
          found = val;
          resolve(found);
          return;
        }
        cursor.continue();
      } else {
        resolve(null);
      }
    };
    request.onerror = (event) => reject(event.target.error);
  });
}

/**
 * Fetch all local drafts for a user.
 */
export async function getAllLocalDrafts(userId) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], "readonly");
    const store = transaction.objectStore(STORE_NAME);
    const request = store.openCursor();
    const drafts = [];

    request.onsuccess = (event) => {
      const cursor = event.target.result;
      if (cursor) {
        if (cursor.value.userId === userId) {
          drafts.push(cursor.value);
        }
        cursor.continue();
      } else {
        resolve(drafts);
      }
    };
    request.onerror = (event) => reject(event.target.error);
  });
}

/**
 * Delete a local draft by userId and draftId.
 */
export async function deleteLocalDraft(userId, draftId) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const key = `${userId}_${draftId}`;
    const transaction = db.transaction([STORE_NAME], "readwrite");
    const store = transaction.objectStore(STORE_NAME);
    const request = store.delete(key);

    request.onsuccess = () => resolve(true);
    request.onerror = (event) => reject(event.target.error);
  });
}

/**
 * Delete local draft by serverId.
 */
export async function deleteLocalDraftByServerId(userId, serverId) {
  const draft = await getLocalDraftByServerId(userId, serverId);
  if (draft) {
    await deleteLocalDraft(userId, draft.draftId);
  }
}

/**
 * Enqueue a sync task into sync_queue
 */
export async function enqueueSyncTask(userId, draftId) {
  if (!userId || !draftId) return;
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([QUEUE_STORE_NAME], "readwrite");
    const store = transaction.objectStore(QUEUE_STORE_NAME);
    
    // Check if a task for this draft already exists in the queue
    const request = store.openCursor();
    request.onsuccess = (event) => {
      const cursor = event.target.result;
      if (cursor) {
        if (cursor.value.userId === userId && cursor.value.draftId === draftId) {
          resolve(true);
          return;
        }
        cursor.continue();
      } else {
        const addRequest = store.add({
          type: "SYNC_DRAFT",
          userId,
          draftId,
          updatedAt: Date.now()
        });
        addRequest.onsuccess = () => resolve(true);
        addRequest.onerror = (e) => reject(e.target.error);
      }
    };
    request.onerror = (e) => reject(e.target.error);
  });
}

/**
 * Fetch all pending sync tasks
 */
export async function getPendingSyncTasks() {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([QUEUE_STORE_NAME], "readonly");
    const store = transaction.objectStore(QUEUE_STORE_NAME);
    const request = store.getAll();

    request.onsuccess = () => resolve(request.result || []);
    request.onerror = (e) => reject(e.target.error);
  });
}

/**
 * Delete a sync task by task ID
 */
export async function deleteSyncTask(id) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([QUEUE_STORE_NAME], "readwrite");
    const store = transaction.objectStore(QUEUE_STORE_NAME);
    const request = store.delete(id);

    request.onsuccess = () => resolve(true);
    request.onerror = (e) => reject(e.target.error);
  });
}

/**
 * Fallback finder to get local draft by draftId, serverId, or id
 */
export async function getLocalDraftBySomeId(dId) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], "readonly");
    const store = transaction.objectStore(STORE_NAME);
    const request = store.openCursor();
    let found = null;

    request.onsuccess = (event) => {
      const cursor = event.target.result;
      if (cursor) {
        const val = cursor.value;
        if (val.draftId === dId || val.id === dId || String(val.serverId) === String(dId)) {
          found = val;
          resolve(found);
          return;
        }
        cursor.continue();
      } else {
        resolve(null);
      }
    };
    request.onerror = (e) => reject(e.target.error);
  });
}
