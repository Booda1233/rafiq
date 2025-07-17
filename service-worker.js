
let intervalId;

self.addEventListener('message', (event) => {
  if (event.data.action === 'start') {
    if (intervalId) clearInterval(intervalId);
    intervalId = setInterval(() => {
      showNotification(event.data.userName, event.data.aiName);
    }, event.data.interval || 2 * 60 * 60 * 1000); // Default to 2 hours
  } else if (event.data.action === 'stop') {
    if (intervalId) clearInterval(intervalId);
    intervalId = null;
  }
});

function showNotification(userName, aiName) {
  const greetings = [
    `مرحباً ${userName}، كيف حالك اليوم؟`,
    `أهلاً ${userName}، أردت فقط الاطمئنان عليك.`,
    `كيف تسير أمورك يا ${userName}؟`,
    `أتمنى أن يكون يومك رائعاً، ${userName}!`
  ];
  const greeting = greetings[Math.floor(Math.random() * greetings.length)];

  self.registration.showNotification(aiName, {
    body: greeting,
    icon: '/favicon.ico', // You might need to add a favicon to your project root
  });
}