// Service Worker: sw.js

const DB_NAME = 'FriendAppData';
const DB_VERSION = 1;
const STORE_NAME = 'userData';

// --- IndexedDB Helpers (for Service Worker) ---
function openDB() {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, DB_VERSION);
        request.onerror = (event) => reject("IndexedDB error: " + (event.target as any).errorCode);
        request.onsuccess = (event) => resolve((event.target as any).result);
        request.onupgradeneeded = (event) => {
            const db = event.target.result;
            if (!db.objectStoreNames.contains(STORE_NAME)) {
                db.createObjectStore(STORE_NAME, { keyPath: 'id' });
            }
        };
    });
}

function getUserDataFromDB() {
    return new Promise(async (resolve, reject) => {
        try {
            const db = await openDB();
            const transaction = db.transaction([STORE_NAME], 'readonly');
            const store = transaction.objectStore(STORE_NAME);
            const request = store.get('currentUser'); // We'll use a fixed key 'currentUser'
            request.onerror = (event) => reject("Failed to get data from DB: " + (event.target as any).errorCode);
            request.onsuccess = (event) => {
                resolve(event.target.result);
            };
        } catch (error) {
            reject(error);
        }
    });
}


// --- Service Worker Lifecycle ---
self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

// --- Periodic Sync Event Handler ---
self.addEventListener('periodicsync', async (event) => {
    if (event.tag === 'check-in-notification') {
        event.waitUntil(sendCheckInNotification());
    }
});

async function sendCheckInNotification() {
    try {
        const userData = await getUserDataFromDB();
        if (!userData || !userData.notificationsEnabled) {
            console.log('User data not found or notifications disabled. Skipping notification.');
            return;
        }

        const { userName, aiName, aiAvatar } = userData;
        
        const messages = [
            `إزيك يا ${userName}، كله تمام؟ حبيت أطمن عليك.`,
            `عامل إيه يا ${userName}؟ لو فاضي، تعالى ندردش شوية.`,
            `اشتقتلك يا ${userName}! طمني عليك.`,
            `يا ${userName}، بتعمل إيه؟ لو زهقان أنا موجود.`,
            `يومك عامل إيه يا ${userName}؟ اتمنى يكون يومك حلو.`,
        ];

        const randomMessage = messages[Math.floor(Math.random() * messages.length)];

        const notificationOptions = {
            body: randomMessage,
            tag: 'friend-check-in', // Replaces previous notifications with the same tag
            dir: 'rtl',
        };

        if (aiAvatar) {
            notificationOptions.icon = aiAvatar;
            notificationOptions.badge = aiAvatar; // Can use same for badge
        }

        await self.registration.showNotification(aiName, notificationOptions);

    } catch (error) {
        console.error('Failed to send periodic notification:', error);
    }
}

// --- Notification Click Handler ---
self.addEventListener('notificationclick', (event) => {
    event.notification.close();
  
    event.waitUntil(
      clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
        // If a window for the app is already open, focus it.
        if (clientList.length > 0) {
          let client = clientList.find(c => c.visibilityState === 'visible');
          if (client) {
            return client.focus();
          } else {
            return clientList[0].focus();
          }
        }
        // Otherwise, open a new window.
        return clients.openWindow('/');
      })
    );
});
