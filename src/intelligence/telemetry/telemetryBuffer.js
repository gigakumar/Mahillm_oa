import { openDB } from 'idb';

const DB_NAME = 'MahiLLM_Telemetry';
const DB_VERSION = 1;
const STORE_NAME = 'events';
export const TELEMETRY_SCHEMA_VERSION = 1;

let dbPromise = null;

export function getDB() {
  if (typeof window === 'undefined' && typeof indexedDB === 'undefined') return null; // Avoid SSR issues, but allow fake-indexeddb
  if (!dbPromise) {
    dbPromise = openDB(DB_NAME, DB_VERSION, {
      upgrade(db) {
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          const store = db.createObjectStore(STORE_NAME, { keyPath: 'eventId' });
          store.createIndex('status', 'bufferMeta.status');
          store.createIndex('attemptId', 'event.attemptId');
        }
      },
    });
  }
  return dbPromise;
}

// Generate unique IDs for events
export function generateEventId() {
  return crypto.randomUUID();
}

let currentSequence = Date.now() * 1000; // start with timestamp-based seq to avoid resets, then increment

export function getNextSequence() {
  return ++currentSequence;
}

export async function recordEvent({ type, attemptId, payload = {} }) {
  const db = await getDB();
  if (!db) return null;

  const eventId = generateEventId();
  const sequence = getNextSequence();
  const timestamp = new Date().toISOString();

  const record = {
    eventId, // the key
    event: {
      eventId,
      attemptId,
      sequence,
      type,
      timestamp,
      payload,
      schemaVersion: TELEMETRY_SCHEMA_VERSION
    },
    bufferMeta: {
      status: "PENDING",
      retryCount: 0,
      lastAttemptAt: null
    }
  };

  await db.add(STORE_NAME, record);
  return record.event;
}

export async function getPendingEvents() {
  const db = await getDB();
  if (!db) return [];
  
  const tx = db.transaction(STORE_NAME, 'readonly');
  const index = tx.store.index('status');
  const pending = await index.getAll("PENDING");
  
  return pending;
}

export async function markEventsSynced(eventIds) {
  const db = await getDB();
  if (!db || eventIds.length === 0) return;

  const tx = db.transaction(STORE_NAME, 'readwrite');
  for (const id of eventIds) {
    const record = await tx.store.get(id);
    if (record) {
      record.bufferMeta.status = "SYNCED";
      record.bufferMeta.lastAttemptAt = new Date().toISOString();
      await tx.store.put(record);
    }
  }
  await tx.done;
}

export async function incrementRetryCount(eventIds) {
  const db = await getDB();
  if (!db || eventIds.length === 0) return;

  const tx = db.transaction(STORE_NAME, 'readwrite');
  for (const id of eventIds) {
    const record = await tx.store.get(id);
    if (record) {
      record.bufferMeta.retryCount += 1;
      record.bufferMeta.lastAttemptAt = new Date().toISOString();
      await tx.store.put(record);
    }
  }
  await tx.done;
}

// Clear store for tests
export async function clearTelemetryBuffer() {
  const db = await getDB();
  if (!db) return;
  const tx = db.transaction(STORE_NAME, 'readwrite');
  await tx.store.clear();
  await tx.done;
}

// Ensure db promise can be reset for tests
export function resetDBPromiseForTests() {
  dbPromise = null;
}
