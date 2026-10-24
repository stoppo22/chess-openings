import { openDB, type DBSchema, type IDBPDatabase } from 'idb';
import type { BackupPayload, ReviewLogEntry, StoredFSRSCard } from '../types/repertoire';

interface ChessTrainerDB extends DBSchema {
  cards: {
    key: string;
    value: StoredFSRSCard;
    indexes: { 'by-opening': string; 'by-type': string };
  };
  logs: {
    key: string;
    value: ReviewLogEntry;
    indexes: { 'by-opening': string };
  };
}

const DB_NAME = 'chess-openings-trainer-db';
const DB_VERSION = 1;

let dbPromise: Promise<IDBPDatabase<ChessTrainerDB>> | null = null;

function getDb(): Promise<IDBPDatabase<ChessTrainerDB>> {
  if (!dbPromise) {
    dbPromise = openDB<ChessTrainerDB>(DB_NAME, DB_VERSION, {
      upgrade(db) {
        if (!db.objectStoreNames.contains('cards')) {
          const cardStore = db.createObjectStore('cards', { keyPath: 'id' });
          cardStore.createIndex('by-opening', 'openingId');
          cardStore.createIndex('by-type', 'cardType');
        }
        if (!db.objectStoreNames.contains('logs')) {
          const logStore = db.createObjectStore('logs', { keyPath: 'id' });
          logStore.createIndex('by-opening', 'openingId');
        }
      },
    });
  }
  return dbPromise;
}

/**
 * Richiede al browser la persistenza dello storage IndexedDB per evitare
 * l'eviction automatica su Safari iOS / Chrome Android.
 */
export async function requestPersistentStorage(): Promise<boolean> {
  if (typeof navigator !== 'undefined' && navigator.storage && navigator.storage.persist) {
    try {
      const alreadyPersisted = await navigator.storage.persisted();
      if (alreadyPersisted) return true;
      return await navigator.storage.persist();
    } catch {
      return false;
    }
  }
  return false;
}

export async function getAllCards(): Promise<StoredFSRSCard[]> {
  const db = await getDb();
  return db.getAll('cards');
}

export async function saveCards(cards: StoredFSRSCard[]): Promise<void> {
  const db = await getDb();
  const tx = db.transaction('cards', 'readwrite');
  for (const c of cards) {
    await tx.store.put(c);
  }
  await tx.done;
}

export async function saveCardAndLog(card: StoredFSRSCard, log: ReviewLogEntry): Promise<void> {
  const db = await getDb();
  const tx = db.transaction(['cards', 'logs'], 'readwrite');
  await tx.objectStore('cards').put(card);
  await tx.objectStore('logs').put(log);
  await tx.done;
}

export async function getAllLogs(): Promise<ReviewLogEntry[]> {
  const db = await getDb();
  return db.getAll('logs');
}

export async function exportBackupJson(): Promise<string> {
  const [cards, logs] = await Promise.all([getAllCards(), getAllLogs()]);
  const payload: BackupPayload = {
    version: 1,
    exportedAt: new Date().toISOString(),
    cards,
    logs,
  };
  return JSON.stringify(payload, null, 2);
}

export async function importBackupJson(jsonText: string): Promise<{ cardsCount: number; logsCount: number }> {
  const parsed = JSON.parse(jsonText) as BackupPayload;
  if (!parsed || parsed.version !== 1 || !Array.isArray(parsed.cards) || !Array.isArray(parsed.logs)) {
    throw new Error('Formato file di backup non valido (richiesto BackupPayload v1).');
  }

  const db = await getDb();
  const tx = db.transaction(['cards', 'logs'], 'readwrite');
  await tx.objectStore('cards').clear();
  await tx.objectStore('logs').clear();

  for (const c of parsed.cards) {
    await tx.objectStore('cards').put(c);
  }
  for (const l of parsed.logs) {
    await tx.objectStore('logs').put(l);
  }
  await tx.done;

  return {
    cardsCount: parsed.cards.length,
    logsCount: parsed.logs.length,
  };
}
