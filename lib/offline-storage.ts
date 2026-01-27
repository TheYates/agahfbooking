"use client";

/**
 * Offline Storage Utilities
 * Uses IndexedDB for storing appointment data offline
 */

const DB_NAME = "agahf-offline-db";
const DB_VERSION = 1;

// Store names
const STORES = {
  APPOINTMENTS: "appointments",
  USER_DATA: "userData",
  SYNC_QUEUE: "syncQueue",
} as const;

interface AppointmentCache {
  id: string;
  data: any;
  cachedAt: number;
  expiresAt: number;
}

interface SyncQueueItem {
  id: string;
  action: "create" | "update" | "delete";
  endpoint: string;
  data: any;
  createdAt: number;
  retries: number;
}

/**
 * Open IndexedDB database
 */
function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof window === "undefined" || !("indexedDB" in window)) {
      reject(new Error("IndexedDB not supported"));
      return;
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;

      // Appointments store
      if (!db.objectStoreNames.contains(STORES.APPOINTMENTS)) {
        const appointmentStore = db.createObjectStore(STORES.APPOINTMENTS, {
          keyPath: "id",
        });
        appointmentStore.createIndex("cachedAt", "cachedAt", { unique: false });
      }

      // User data store
      if (!db.objectStoreNames.contains(STORES.USER_DATA)) {
        db.createObjectStore(STORES.USER_DATA, { keyPath: "key" });
      }

      // Sync queue for offline mutations
      if (!db.objectStoreNames.contains(STORES.SYNC_QUEUE)) {
        const syncStore = db.createObjectStore(STORES.SYNC_QUEUE, {
          keyPath: "id",
        });
        syncStore.createIndex("createdAt", "createdAt", { unique: false });
      }
    };
  });
}

/**
 * Store appointments in IndexedDB
 */
export async function cacheAppointments(
  appointments: any[],
  ttlMinutes: number = 60
): Promise<void> {
  try {
    const db = await openDB();
    const transaction = db.transaction(STORES.APPOINTMENTS, "readwrite");
    const store = transaction.objectStore(STORES.APPOINTMENTS);

    const now = Date.now();
    const expiresAt = now + ttlMinutes * 60 * 1000;

    for (const appointment of appointments) {
      const cacheItem: AppointmentCache = {
        id: appointment.id || appointment._id,
        data: appointment,
        cachedAt: now,
        expiresAt,
      };
      store.put(cacheItem);
    }

    await new Promise<void>((resolve, reject) => {
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error);
    });

    db.close();
  } catch (error) {
    console.error("Failed to cache appointments:", error);
  }
}

/**
 * Get cached appointments from IndexedDB
 */
export async function getCachedAppointments(): Promise<any[]> {
  try {
    const db = await openDB();
    const transaction = db.transaction(STORES.APPOINTMENTS, "readonly");
    const store = transaction.objectStore(STORES.APPOINTMENTS);

    const appointments = await new Promise<AppointmentCache[]>(
      (resolve, reject) => {
        const request = store.getAll();
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
      }
    );

    db.close();

    const now = Date.now();
    // Filter out expired items and return data
    return appointments
      .filter((item) => item.expiresAt > now)
      .map((item) => item.data);
  } catch (error) {
    console.error("Failed to get cached appointments:", error);
    return [];
  }
}

/**
 * Clear expired cache entries
 */
export async function clearExpiredCache(): Promise<void> {
  try {
    const db = await openDB();
    const transaction = db.transaction(STORES.APPOINTMENTS, "readwrite");
    const store = transaction.objectStore(STORES.APPOINTMENTS);

    const items = await new Promise<AppointmentCache[]>((resolve, reject) => {
      const request = store.getAll();
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });

    const now = Date.now();
    for (const item of items) {
      if (item.expiresAt <= now) {
        store.delete(item.id);
      }
    }

    await new Promise<void>((resolve, reject) => {
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error);
    });

    db.close();
  } catch (error) {
    console.error("Failed to clear expired cache:", error);
  }
}

/**
 * Clear all cached data
 */
export async function clearAllCache(): Promise<void> {
  try {
    const db = await openDB();
    const transaction = db.transaction(
      [STORES.APPOINTMENTS, STORES.USER_DATA],
      "readwrite"
    );

    transaction.objectStore(STORES.APPOINTMENTS).clear();
    transaction.objectStore(STORES.USER_DATA).clear();

    await new Promise<void>((resolve, reject) => {
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error);
    });

    db.close();
  } catch (error) {
    console.error("Failed to clear cache:", error);
  }
}

/**
 * Add item to sync queue for offline mutations
 */
export async function addToSyncQueue(
  action: SyncQueueItem["action"],
  endpoint: string,
  data: any
): Promise<string> {
  try {
    const db = await openDB();
    const transaction = db.transaction(STORES.SYNC_QUEUE, "readwrite");
    const store = transaction.objectStore(STORES.SYNC_QUEUE);

    const item: SyncQueueItem = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
      action,
      endpoint,
      data,
      createdAt: Date.now(),
      retries: 0,
    };

    store.add(item);

    await new Promise<void>((resolve, reject) => {
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error);
    });

    db.close();
    return item.id;
  } catch (error) {
    console.error("Failed to add to sync queue:", error);
    throw error;
  }
}

/**
 * Get all items in sync queue
 */
export async function getSyncQueue(): Promise<SyncQueueItem[]> {
  try {
    const db = await openDB();
    const transaction = db.transaction(STORES.SYNC_QUEUE, "readonly");
    const store = transaction.objectStore(STORES.SYNC_QUEUE);

    const items = await new Promise<SyncQueueItem[]>((resolve, reject) => {
      const request = store.getAll();
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });

    db.close();
    return items.sort((a, b) => a.createdAt - b.createdAt);
  } catch (error) {
    console.error("Failed to get sync queue:", error);
    return [];
  }
}

/**
 * Remove item from sync queue
 */
export async function removeFromSyncQueue(id: string): Promise<void> {
  try {
    const db = await openDB();
    const transaction = db.transaction(STORES.SYNC_QUEUE, "readwrite");
    const store = transaction.objectStore(STORES.SYNC_QUEUE);

    store.delete(id);

    await new Promise<void>((resolve, reject) => {
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error);
    });

    db.close();
  } catch (error) {
    console.error("Failed to remove from sync queue:", error);
  }
}

/**
 * Process sync queue when back online
 */
export async function processSyncQueue(): Promise<{
  success: number;
  failed: number;
}> {
  const queue = await getSyncQueue();
  let success = 0;
  let failed = 0;

  for (const item of queue) {
    try {
      const response = await fetch(item.endpoint, {
        method:
          item.action === "delete"
            ? "DELETE"
            : item.action === "create"
              ? "POST"
              : "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(item.data),
      });

      if (response.ok) {
        await removeFromSyncQueue(item.id);
        success++;
      } else {
        failed++;
      }
    } catch (error) {
      failed++;
    }
  }

  return { success, failed };
}

/**
 * Store user data for offline access
 */
export async function cacheUserData(key: string, data: any): Promise<void> {
  try {
    const db = await openDB();
    const transaction = db.transaction(STORES.USER_DATA, "readwrite");
    const store = transaction.objectStore(STORES.USER_DATA);

    store.put({ key, data, cachedAt: Date.now() });

    await new Promise<void>((resolve, reject) => {
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error);
    });

    db.close();
  } catch (error) {
    console.error("Failed to cache user data:", error);
  }
}

/**
 * Get cached user data
 */
export async function getCachedUserData<T>(key: string): Promise<T | null> {
  try {
    const db = await openDB();
    const transaction = db.transaction(STORES.USER_DATA, "readonly");
    const store = transaction.objectStore(STORES.USER_DATA);

    const result = await new Promise<{ key: string; data: T } | undefined>(
      (resolve, reject) => {
        const request = store.get(key);
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
      }
    );

    db.close();
    return result?.data ?? null;
  } catch (error) {
    console.error("Failed to get cached user data:", error);
    return null;
  }
}
