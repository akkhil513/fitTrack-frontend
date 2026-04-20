const CACHE_NAME = 'fittrack-v1';
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png'
];

// ── INSTALL ──
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(STATIC_ASSETS))
  );
  self.skipWaiting();
});

// ── ACTIVATE ──
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// ── FETCH — Network first, fallback to cache ──
self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);

  // Always network for API calls
  if (url.hostname.includes('execute-api') || url.hostname.includes('amazonaws')) {
    return;
  }

  // Network first for HTML
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request).catch(() =>
        caches.match('/index.html')
      )
    );
    return;
  }

  // Cache first for static assets
  event.respondWith(
    caches.match(event.request).then(cached => {
      if (cached) return cached;
      return fetch(event.request).then(response => {
        if (response.ok) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
        }
        return response;
      });
    })
  );
});

// ── PUSH NOTIFICATIONS ──
self.addEventListener('push', event => {
  const data = event.data?.json() || {};
  const title = data.title || 'FitTrack Reminder';
  const options = {
    body: data.body || 'Time to check your daily tasks!',
    icon: '/icons/icon-192x192.png',
    badge: '/icons/icon-72x72.png',
    vibrate: [200, 100, 200],
    data: { url: data.url || '/dashboard/today' },
    actions: [
      { action: 'open', title: 'Open App' },
      { action: 'dismiss', title: 'Dismiss' }
    ]
  };
  event.waitUntil(self.registration.showNotification(title, options));
});

// ── NOTIFICATION CLICK ──
self.addEventListener('notificationclick', event => {
  event.notification.close();
  if (event.action === 'dismiss') return;
  const url = event.notification.data?.url || '/dashboard/today';
  event.waitUntil(
    clients.matchAll({ type: 'window' }).then(clientList => {
      for (const client of clientList) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          client.navigate(url);
          return client.focus();
        }
      }
      return clients.openWindow(url);
    })
  );
});

// ── SCHEDULED REMINDER ALARMS ──
// These fire when app is open — background handled via push from backend
const REMINDERS = [
  { hour: 7,  min: 0,  title: '🍳 Meal 1 — Breakfast',      body: '5 eggs + oats + banana. Hit that protein.' },
  { hour: 10, min: 30, title: '🥛 Meal 2 — Snack',          body: 'Greek yogurt + nuts + fruit.' },
  { hour: 13, min: 0,  title: '🍗 Meal 3 — Lunch',          body: 'Chicken + rice + dal. Big protein meal.' },
  { hour: 15, min: 0,  title: '💊 Supplements',             body: 'Whey + creatine + banana before gym.' },
  { hour: 16, min: 0,  title: '🏋️ GYM TIME',               body: "No excuses. You're stronger than yesterday." },
  { hour: 19, min: 0,  title: '🥤 Post Workout',            body: 'Whey shake now. Eat Meal 5.' },
  { hour: 19, min: 30, title: '🧘 Stretch',                 body: '8-10 minutes. Mandatory.' },
  { hour: 21, min: 0,  title: '🍽️ Meal 6 — Dinner',        body: 'Last meal of the day. Hit protein target.' },
  { hour: 22, min: 30, title: '😴 SLEEP NOW',               body: '7.5 hours. Phone down. Growth happens now.' }
];

function scheduleLocalReminders() {
  REMINDERS.forEach(r => {
    const now = new Date();
    const target = new Date();
    target.setHours(r.hour, r.min, 0, 0);
    if (target <= now) return; // Already passed today
    const delay = target - now;
    setTimeout(() => {
      self.registration.showNotification(r.title, {
        body: r.body,
        icon: '/icons/icon-192x192.png',
        badge: '/icons/icon-72x72.png',
        vibrate: [200, 100, 200],
        data: { url: '/dashboard/today' }
      });
    }, delay);
  });
}

self.addEventListener('activate', () => scheduleLocalReminders());
