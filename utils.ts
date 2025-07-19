
/**
 * Converts a File object to a Base64 encoded string.
 * @param file The file to convert.
 * @returns A promise that resolves with the Base64 string.
 */
export const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      // Result includes the data URL prefix (e.g., "data:image/png;base64,"), so we split it off.
      const base64String = (reader.result as string).split(',')[1];
      if (base64String) {
        resolve(base64String);
      } else {
        reject(new Error("Failed to read file as Base64."));
      }
    };
    reader.onerror = error => reject(error);
  });
};

const DB_NAME = 'FriendAppData';
const DB_VERSION = 1;
const STORE_NAME = 'userData';

function openDB(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, DB_VERSION);
        request.onerror = (event) => reject("IndexedDB error: " + (event.target as any).errorCode);
        request.onsuccess = (event) => resolve((event.target as any).result);
        request.onupgradeneeded = (event) => {
            const db = (event.target as any).result;
            if (!db.objectStoreNames.contains(STORE_NAME)) {
                db.createObjectStore(STORE_NAME, { keyPath: 'id' });
            }
        };
    });
}

export const saveUserDataToDB = async (userData: any): Promise<void> => {
    try {
        const db = await openDB();
        const transaction = db.transaction([STORE_NAME], 'readwrite');
        const store = transaction.objectStore(STORE_NAME);
        // Use a fixed ID to always overwrite the same user record
        store.put({ ...userData, id: 'currentUser' }); 
    } catch (error) {
        console.error("Failed to save user data to IndexedDB:", error);
    }
};

/**
 * Returns today's date as a string in YYYY-MM-DD format.
 */
export const getTodayDateString = (): string => {
  return new Date().toISOString().split('T')[0];
};

/**
 * Checks if a given date string (YYYY-MM-DD) was yesterday.
 * @param dateString The date string to check.
 * @returns True if the date was yesterday, false otherwise.
 */
export const isYesterday = (dateString?: string): boolean => {
  if (!dateString) return false;
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  return dateString === yesterday.toISOString().split('T')[0];
};
