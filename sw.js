/* Vespır service worker.
   Uygulama kapalıyken tarayıcının verdiği nadir arka plan pencerelerinde
   (periodic sync) iki tür bildirim gönderir:
     1) "hello"    : özlem / davet / hava durumu cümleleri (en çok 3 saatte bir)
     2) "umbrella" : Hava olaylarına göre "montunu / şemsiyeni / gözlüğünü al" hatırlatması
                     (günde en fazla bir kez, sabah saatlerinde)
   Tercihler sayfanın yazdığı küçük Cache Storage kaydından okunur;
   konum bilgisi içermez. */

const APP_CACHE = 'vespir-app-v1';

self.addEventListener('install', (e) => self.skipWaiting());
self.addEventListener('activate', (e) => e.waitUntil((async () => {
  await self.clients.claim();
  /* Eski sürümün uygulama kabuğu kalmasın; mesaj tercihleri korunur. */
  const keys = await caches.keys();
  await Promise.all(keys
    .filter((k) => k.indexOf('vespir-app-') === 0 && k !== APP_CACHE)
    .map((k) => caches.delete(k)));
})()));

function shellKey(url) {
  return new Request(url.origin + url.pathname, { method: 'GET' });
}

/* Sayfa ilk açılışta kendi HTML'ini buraya bırakır: çevrimdışıyken de açılabilsin. */
async function cacheShell(rawUrl) {
  try {
    const url = new URL(rawUrl, self.registration.scope);
    if (url.origin !== self.location.origin) return;
    if (!url.pathname.startsWith(new URL(self.registration.scope).pathname)) return;
    const res = await fetch(url.href, { cache: 'reload', credentials: 'same-origin' });
    if (!res || !res.ok) return;
    const cache = await caches.open(APP_CACHE);
    await cache.put(shellKey(url), res.clone());
  } catch (e) {}
}

/* Sayfa, bekleyen güncel worker'ı hemen devreye almak için SKIP_WAITING yollar. */
self.addEventListener('message', (e) => {
  const data = e.data || {};
  if (data.type === 'SKIP_WAITING') self.skipWaiting();
  if (data.type === 'CACHE_SHELL' && typeof data.url === 'string') {
    e.waitUntil(cacheShell(data.url));
  }
});

/* Gezinmelerde önce ağ, erişilemezse önbellekteki uygulama kabuğu.
   Tek dosyalık uygulamanın tamamı bu HTML'de olduğu için çevrimdışı çalışır. */
self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET' || req.mode !== 'navigate') return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;
  e.respondWith((async () => {
    try {
      const res = await fetch(req);
      if (res && res.ok) {
        const cache = await caches.open(APP_CACHE);
        await cache.put(shellKey(url), res.clone());
      }
      return res;
    } catch (err) {
      const cache = await caches.open(APP_CACHE);
      const cached = await cache.match(req, { ignoreSearch: true, ignoreVary: true });
      if (cached) return cached;
      return new Response('<!doctype html><html lang="tr"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Vespır çevrimdışı</title><body style="margin:0;min-height:100vh;display:grid;place-items:center;background:#fdf3f7;color:#5b4652;font:16px/1.6 system-ui,sans-serif;text-align:center;padding:24px"><div><h1 style="margin:0 0 8px">Vespır şu an çevrimdışı</h1><p style="margin:0">Bağlantı gelince sayfayı yenile; patiler seni bekliyor.</p></div></body></html>', {
        status: 503,
        headers: { 'Content-Type': 'text/html; charset=utf-8' }
      });
    }
  })());
});

const PREFS_CACHE = 'vespir-prefs';
const PREFS_PATH = './__vespir-message-prefs';
const MSG_GAP = 3 * 3600 * 1000;
const WEATHER_FRESH = 3 * 3600 * 1000;
/* Hava durumu hatırlatması yalnızca bu saat aralığında gider (yerel saat). */
const UMBRELLA_FROM = 7;
const UMBRELLA_TO = 12;

const HELLO_TAG = 'vespir-hello';
const UMBRELLA_TAG = 'vespir-umbrella';

// Tüm hava durumlarını kapsayan yeni zengin metin havuzu
const WEATHER_ALERTS = {
  rain: [
    'Dışarıda yağmur var; çıkmadan önce şemsiyeni almayı unutma.',
    'Hava yağmurlu. Montunu ya da şemsiyeni yanına almayı unutma.',
    'Yağmur yağıyor, bugün yanında bir şemsiye olsun.'
  ],
  drizzle: [
    'İnce bir çisenti var; ceketini ya da şemsiyeni almayı unutma.',
    'Çisentili bir sabah. Çıkmadan önce şemsiyeni kontrol et.'
  ],
  storm: [
    'Fırtına bekleniyor; dışarı çıkacaksan şemsiyeni ve montunu al.',
    'Hava sert görünüyor. Bugün önlemini alıp öyle çık patidaş.'
  ],
  snow: [
    'Dışarıda lapa lapa kar var! Kalın montunu ve botlarını giymeyi unutma. ❄️',
    'Bugün hava karlı ve buzlu olabilir. Yürürken dikkatli ol.',
    'Kar yağıyor! Çıkmadan önce atkı ve bereni yanına al.'
  ],
  clear_hot: [
    'Bugün gökyüzü tertemiz ve hava oldukça sıcak. Güneş gözlüğünü alabilirsin! ☀️',
    'Güneşli ve sıcak bir gün. Dışarı çıkacaksan yanına su almayı unutma.',
    'Güneş göz kırpıyor. Bugün harika bir hava var.'
  ],
  fog: [
    'Dışarıda yoğun bir sis var, görüş mesafesi düşük. Dikkatli olmalısın. 🌫️',
    'Sisli bir gün. Yola çıkacaksan ekstra dikkatli ol.'
  ],
  windy: [
    'Rüzgar oldukça sert esiyor. Üzerine kalın bir şeyler almayı unutma. 💨',
    'Hava epey rüzgarlı. Dışarı çıkarken sıkı giyin.'
  ]
};

const HELLO_LINES_FALLBACK = ['Seni özledim. Gel, birlikte çalışalım.'];
const TIME_LINES = {
  morning: ['Sabahın tazeliğiyle kısa bir tura ne dersin?', 'Güne küçük bir zaferle başlamak için harika bir saat.'],
  noon: ['Öğleden sonra toparlanmak için kısa bir tur yeter.', 'Kahven hazırsa kitabım da hazır. Bekliyorum.'],
  evening: ['Akşam sakinliğinde günü güzel bir odakla taçlandıralım mı?', 'Televizyon biraz bekleyebilir; önce senin hedefin.']
};

function pickLine(list) {
  return list[Math.floor(Math.random() * list.length)];
}

function prefsUrl() {
  return new URL(PREFS_PATH, self.registration.scope).href;
}

async function readPrefs() {
  try {
    const cache = await caches.open(PREFS_CACHE);
    const res = await cache.match(prefsUrl());
    return res ? await res.json() : null;
  } catch (e) {
    return null;
  }
}

async function savePrefs(prefs) {
  try {
    const cache = await caches.open(PREFS_CACHE);
    await cache.put(prefsUrl(),
      new Response(JSON.stringify(prefs), { headers: { 'Content-Type': 'application/json' } }));
  } catch (e) {}
}

function timeBucket(hour) {
  if (hour >= 5 && hour < 12) return TIME_LINES.morning;
  if (hour >= 12 && hour < 18) return TIME_LINES.noon;
  if (hour >= 18 && hour < 23) return TIME_LINES.evening;
  return [];
}

function localDay(now) {
  const d = new Date(now);
  return d.getFullYear() + '-' + (d.getMonth() + 1) + '-' + d.getDate();
}

/* Selam 23:00–08:00 arasında susar. Hava durumu hatırlatmasının kendi penceresi
   07:00’de açılır; o saat sessiz saatin içinde kalsa da uyarı gider. */
function backgroundWake(hour) {
  return {
    hello: !(hour >= 23 || hour < 8),
    umbrella: hour >= UMBRELLA_FROM && hour < UMBRELLA_TO
  };
}

async function anyVisibleWindow() {
  const wins = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
  return wins.some((c) => c.visibilityState === 'visible');
}

/* Genel Hava Durumu Hatırlatması (Günde en fazla bir kez, sabahları) */
async function maybeWeatherAlert(prefs, now, hour) {
  // Hem yeni genişletilmiş alanı hem de eski wet alanını kontrol ederek geriye uyumluluk sağlar
  const condition = prefs.weatherCondition || prefs.wet;
  
  if (!condition || !WEATHER_ALERTS[condition]) return false;
  if (now - (Number(prefs.weatherAt) || 0) > WEATHER_FRESH) return false;
  if (hour < UMBRELLA_FROM || hour >= UMBRELLA_TO) return false;
  if (prefs.umbrellaDay === localDay(now)) return false;
  if (await anyVisibleWindow()) return false;

  await self.registration.showNotification(prefs.name || 'Vespır', {
    body: pickLine(WEATHER_ALERTS[condition]),
    icon: prefs.icon || undefined,
    badge: prefs.icon || undefined,
    tag: UMBRELLA_TAG,
    data: { url: prefs.url || self.registration.scope }
  });
  prefs.umbrellaDay = localDay(now);
  await savePrefs(prefs);
  return true;
}

/* Genel mesaj (özlem / davet / hava). En az MSG_GAP aralıkla. */
async function maybeHello(prefs, now, hour) {
  if (now - (Number(prefs.lastMsgAt) || 0) < MSG_GAP) return false;
  if (await anyVisibleWindow()) return false;

  let pool = Array.isArray(prefs.lines) && prefs.lines.length ? prefs.lines.slice() : HELLO_LINES_FALLBACK.slice();
  pool = pool.concat(timeBucket(hour));
  const weatherPool = Array.isArray(prefs.weatherLines) ? prefs.weatherLines : [];
  if (weatherPool.length && now - (Number(prefs.weatherAt) || 0) < WEATHER_FRESH && Math.random() < .4) {
    pool = weatherPool.slice();
  }

  await self.registration.showNotification(prefs.name || 'Vespır', {
    body: pickLine(pool),
    icon: prefs.icon || undefined,
    badge: prefs.icon || undefined,
    tag: HELLO_TAG,
    data: { url: prefs.url || self.registration.scope }
  });
  prefs.lastMsgAt = now;
  await savePrefs(prefs);
  return true;
}

self.addEventListener('periodicsync', (e) => {
  if (e.tag !== HELLO_TAG) return;
  e.waitUntil((async () => {
    try {
      const prefs = await readPrefs();
      if (!prefs || !prefs.enabled) return;
      if (self.Notification.permission !== 'granted') return;

      const now = Date.now();
      const hour = new Date(now).getHours();
      const wake = backgroundWake(hour);
      if (!wake.hello && !wake.umbrella) return;

      /* Önce hava uyarısı (günde bir kez), sonra genel mesaj. */
      const sentAlert = wake.umbrella && await maybeWeatherAlert(prefs, now, hour);
      if (!sentAlert && wake.hello) await maybeHello(prefs, now, hour);
    } catch (err) {}
  })());
});

self.addEventListener('notificationclick', (e) => {
  e.notification.close();
  const url = (e.notification.data && e.notification.data.url) || self.registration.scope;
  e.waitUntil((async () => {
    const wins = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
    let target;
    try { target = new URL(url, self.registration.scope); } catch (err) { target = null; }
    for (const c of wins) {
      /* Sorgu farkı (ör. ?src=pwa) aynı uygulama penceresi sayılsın. */
      try {
        const current = new URL(c.url);
        if (target && current.origin === target.origin && current.pathname === target.pathname && 'focus' in c) return c.focus();
      } catch (err) {}
    }
    if (self.clients.openWindow) return self.clients.openWindow(url);
  })());
});
