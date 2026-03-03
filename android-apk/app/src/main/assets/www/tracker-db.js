'use strict';

(function attachActingHoursTrackerDb(global) {
  const DB_NAME = 'workCalendarTrackerDb';
  const DB_VERSION = 1;
  const STORE_NAME = 'acting_hours_entries';
  const DATE_INDEX = 'by_date';
  const FALLBACK_KEY = 'workCalendar.actingHoursEntries.v1';

  function hasIndexedDb() {
    return typeof global.indexedDB !== 'undefined';
  }

  function isoDatePattern(value) {
    return /^\d{4}-\d{2}-\d{2}$/.test(value);
  }

  function normalizeHours(rawValue) {
    const value = Number(rawValue);
    if (!Number.isFinite(value) || value <= 0) return null;
    return Math.round(value * 100) / 100;
  }

  function normalizeText(rawValue, maxLen) {
    return String(rawValue || '').trim().slice(0, maxLen);
  }

  function createEntryId() {
    if (global.crypto && typeof global.crypto.randomUUID === 'function') {
      return global.crypto.randomUUID();
    }
    return `ah-${Date.now()}-${Math.random().toString(16).slice(2, 10)}`;
  }

  function normalizeTimestamp(rawValue, fallback) {
    if (typeof rawValue !== 'string') return fallback;
    const parsed = new Date(rawValue);
    if (Number.isNaN(parsed.getTime())) return fallback;
    return parsed.toISOString();
  }

  function sanitizeEntry(input, nowIso) {
    if (!input || typeof input !== 'object') return null;
    const date = String(input.date || '').trim();
    if (!isoDatePattern(date)) return null;
    const hours = normalizeHours(input.hours);
    if (hours === null) return null;

    const id = normalizeText(input.id, 80) || createEntryId();
    const note = normalizeText(input.note, 120);
    const createdAt = normalizeTimestamp(input.createdAt, nowIso);
    const updatedAt = normalizeTimestamp(input.updatedAt, nowIso);

    return {
      id,
      date,
      hours,
      note,
      source: 'manual',
      createdAt,
      updatedAt,
    };
  }

  function sortEntries(entries) {
    return entries.sort((a, b) => {
      if (a.date === b.date) {
        const aCreated = a.createdAt || '';
        const bCreated = b.createdAt || '';
        if (aCreated === bCreated) {
          return a.id.localeCompare(b.id);
        }
        return bCreated.localeCompare(aCreated);
      }
      return b.date.localeCompare(a.date);
    });
  }

  function requestToPromise(request) {
    return new Promise((resolve, reject) => {
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error || new Error('IndexedDB request failed.'));
    });
  }

  function openDatabase() {
    return new Promise((resolve, reject) => {
      const request = global.indexedDB.open(DB_NAME, DB_VERSION);
      request.onupgradeneeded = () => {
        const db = request.result;
        let store;
        if (db.objectStoreNames.contains(STORE_NAME)) {
          store = request.transaction.objectStore(STORE_NAME);
        } else {
          store = db.createObjectStore(STORE_NAME, { keyPath: 'id' });
        }
        if (!store.indexNames.contains(DATE_INDEX)) {
          store.createIndex(DATE_INDEX, 'date', { unique: false });
        }
      };
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error || new Error('IndexedDB failed to open.'));
    });
  }

  function localReadAll() {
    try {
      const raw = global.localStorage.getItem(FALLBACK_KEY);
      if (!raw) return [];
      const parsed = JSON.parse(raw);
      if (!Array.isArray(parsed)) return [];
      const nowIso = new Date().toISOString();
      const safe = parsed
        .map((item) => sanitizeEntry(item, nowIso))
        .filter(Boolean);
      return sortEntries(safe);
    } catch (err) {
      return [];
    }
  }

  function localWriteAll(entries) {
    try {
      global.localStorage.setItem(FALLBACK_KEY, JSON.stringify(entries));
    } catch (err) {
      // Ignore write failures in fallback storage.
    }
  }

  function createLocalStore() {
    return {
      mode: 'localStorage',
      async init() {
        return undefined;
      },
      async getAll() {
        return localReadAll();
      },
      async upsert(input) {
        const nowIso = new Date().toISOString();
        const entry = sanitizeEntry(input, nowIso);
        if (!entry) {
          throw new Error('Invalid acting hours entry.');
        }
        entry.updatedAt = nowIso;

        const existing = localReadAll();
        const index = existing.findIndex((item) => item.id === entry.id);
        if (index >= 0) {
          entry.createdAt = existing[index].createdAt || entry.createdAt;
          existing[index] = entry;
        } else {
          existing.push(entry);
        }
        localWriteAll(sortEntries(existing));
        return entry;
      },
      async remove(id) {
        const key = normalizeText(id, 80);
        if (!key) return false;
        const existing = localReadAll();
        const next = existing.filter((item) => item.id !== key);
        localWriteAll(sortEntries(next));
        return next.length !== existing.length;
      },
      async clear() {
        localWriteAll([]);
      },
    };
  }

  function createIndexedDbStore() {
    let db = null;

    async function withStore(mode, operation) {
      if (!db) {
        db = await openDatabase();
      }
      return new Promise((resolve, reject) => {
        const tx = db.transaction(STORE_NAME, mode);
        const store = tx.objectStore(STORE_NAME);
        let result;
        tx.oncomplete = () => resolve(result);
        tx.onerror = () => reject(tx.error || new Error('IndexedDB transaction failed.'));
        tx.onabort = () => reject(tx.error || new Error('IndexedDB transaction aborted.'));
        operation(store, (value) => {
          result = value;
        }, reject);
      });
    }

    return {
      mode: 'indexedDB',
      async init() {
        if (!db) {
          db = await openDatabase();
        }
      },
      async getAll() {
        return withStore('readonly', (store, setResult, reject) => {
          const request = store.getAll();
          request.onsuccess = () => {
            const nowIso = new Date().toISOString();
            const safe = (Array.isArray(request.result) ? request.result : [])
              .map((item) => sanitizeEntry(item, nowIso))
              .filter(Boolean);
            setResult(sortEntries(safe));
          };
          request.onerror = () => reject(request.error || new Error('Failed reading tracker entries.'));
        });
      },
      async upsert(input) {
        const nowIso = new Date().toISOString();
        const entry = sanitizeEntry(input, nowIso);
        if (!entry) {
          throw new Error('Invalid acting hours entry.');
        }

        const previous = await withStore('readonly', (store, setResult, reject) => {
          const request = store.get(entry.id);
          request.onsuccess = () => setResult(request.result || null);
          request.onerror = () => reject(request.error || new Error('Failed reading entry.'));
        });
        if (previous && previous.createdAt) {
          entry.createdAt = normalizeTimestamp(previous.createdAt, nowIso);
        }
        entry.updatedAt = nowIso;

        await withStore('readwrite', (store, setResult, reject) => {
          const request = store.put(entry);
          request.onsuccess = () => setResult(entry);
          request.onerror = () => reject(request.error || new Error('Failed saving entry.'));
        });
        return entry;
      },
      async remove(id) {
        const key = normalizeText(id, 80);
        if (!key) return false;
        await withStore('readwrite', (store, setResult, reject) => {
          const request = store.delete(key);
          request.onsuccess = () => setResult(true);
          request.onerror = () => reject(request.error || new Error('Failed deleting entry.'));
        });
        return true;
      },
      async clear() {
        await withStore('readwrite', (store, setResult, reject) => {
          const request = store.clear();
          request.onsuccess = () => setResult(true);
          request.onerror = () => reject(request.error || new Error('Failed clearing entries.'));
        });
      },
    };
  }

  function createStore() {
    if (!hasIndexedDb()) {
      return createLocalStore();
    }
    const idbStore = createIndexedDbStore();
    const localStore = createLocalStore();
    return {
      mode: 'indexedDB',
      async init() {
        try {
          await idbStore.init();
        } catch (err) {
          this.mode = 'localStorage';
          await localStore.init();
        }
      },
      async getAll() {
        if (this.mode === 'localStorage') {
          return localStore.getAll();
        }
        try {
          return await idbStore.getAll();
        } catch (err) {
          this.mode = 'localStorage';
          return localStore.getAll();
        }
      },
      async upsert(entry) {
        if (this.mode === 'localStorage') {
          return localStore.upsert(entry);
        }
        try {
          return await idbStore.upsert(entry);
        } catch (err) {
          this.mode = 'localStorage';
          return localStore.upsert(entry);
        }
      },
      async remove(id) {
        if (this.mode === 'localStorage') {
          return localStore.remove(id);
        }
        try {
          return await idbStore.remove(id);
        } catch (err) {
          this.mode = 'localStorage';
          return localStore.remove(id);
        }
      },
      async clear() {
        if (this.mode === 'localStorage') {
          return localStore.clear();
        }
        try {
          return await idbStore.clear();
        } catch (err) {
          this.mode = 'localStorage';
          return localStore.clear();
        }
      },
    };
  }

  global.ActingHoursTrackerDb = {
    createStore,
  };
})(window);
