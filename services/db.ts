
import { IDBPDatabase, openDB } from 'idb';
import { ChatSession, Memory } from '../types';

const DB_NAME = 'VirtualFriendDB';
const DB_VERSION = 1;
const SESSIONS_STORE = 'chatSessions';
const MEMORIES_STORE = 'memories';

let dbPromise: Promise<IDBPDatabase> | null = null;

const initDB = () => {
  if (dbPromise) return dbPromise;
  dbPromise = openDB(DB_NAME, DB_VERSION, {
    upgrade(db) {
      if (!db.objectStoreNames.contains(SESSIONS_STORE)) {
        db.createObjectStore(SESSIONS_STORE, { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains(MEMORIES_STORE)) {
        db.createObjectStore(MEMORIES_STORE, { keyPath: 'id' });
      }
    },
  });
  return dbPromise;
};

// Chat Session Operations
export const getChatSessions = async (): Promise<ChatSession[]> => {
  const db = await initDB();
  const sessions = await db.getAll(SESSIONS_STORE);
  return sessions.sort((a, b) => b.createdAt - a.createdAt);
};

export const getChatSession = async (id: string): Promise<ChatSession | undefined> => {
  const db = await initDB();
  return db.get(SESSIONS_STORE, id);
};

export const saveChatSession = async (session: ChatSession): Promise<void> => {
  const db = await initDB();
  await db.put(SESSIONS_STORE, session);
};

export const deleteChatSession = async (id: string): Promise<void> => {
  const db = await initDB();
  await db.delete(SESSIONS_STORE, id);
};

// Memory Operations
export const getMemories = async (): Promise<Memory[]> => {
  const db = await initDB();
  return db.getAll(MEMORIES_STORE);
};

export const saveMemory = async (memory: Memory): Promise<void> => {
  const db = await initDB();
  await db.put(MEMORIES_STORE, memory);
};

export const deleteMemory = async (id: string): Promise<void> => {
  const db = await initDB();
  await db.delete(MEMORIES_STORE, id);
};
