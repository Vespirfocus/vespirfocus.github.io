/* Vespır service worker.
   Uygulama kapalıyken tarayıcının verdiği nadir arka plan pencerelerinde
   (periodic sync) iki tür bildirim gönderir:
     1) "hello"    : özlem / davet / hava durumu cümleleri (en çok 3 saatte bir)
     2) "umbrella" : hava olaylarına göre "montunu / şemsiyeni / gözlüğünü al" hatırlatması
                     (günde en fazla bir kez, sessiz saatler dışında herhangi bir saatte)
   Her iki bildirim de yalnızca 23:00–05:00 arasında susar.

   Hava uyarısı için worker, uyandığı anda Open-Meteo'dan güncel havayı kendisi alır;
   sayfanın en son açıldığı andaki eski veriye bağımlı değildir. Bunun için tercih kaydında
   yalnızca 0,1° (~10 km) yuvarlanmış yaklaşık koordinat tutulur. */

const APP_CACHE = 'vespir-app-v2';

self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (e) => e.waitUntil((async () => {
  await self.clients.claim();
  /* Eski sürümün uygulama kabuğu kalmasın; mesaj tercihleri (vespir-prefs) korunur. */
  const keys = await caches.keys();
  await Promise.all(keys
    .filter((k) => k.indexOf('vespir-app-') === 0 && k !== APP_CACHE)
    .map((k) => caches.delete(k)));
})()));

/* "/" ve "/index.html" aynı sayfadır; ikisi de önbelleğe yazılır ki
   hangisiyle açılırsa açılsın çevrimdışı çalışsın. */
function shellKeys(url) {
  const base = url.origin + url.pathname;
  const keys = [new Request(base, { method: 'GET' })];
  if (base.endsWith('/')) keys.push(new Request(base + 'index.html', { method: 'GET' }));
  else if (base.endsWith('/index.html')) keys.push(new Request(base.slice(0, -'index.html'.length), { method: 'GET' }));
  return keys;
}

async function putShell(url, res) {
  const cache = await caches.open(APP_CACHE);
  await Promise.all(shellKeys(url).map((k) => cache.put(k, res.clone())));
}

/* Sayfa ilk açılışta kendi HTML'ini buraya bırakır: çevrimdışıyken de açılabilsin. */
async function cacheShell(rawUrl) {
  try {
    const url = new URL(rawUrl, self.registration.scope);
    if (url.origin !== self.location.origin) return;
    if (!url.pathname.startsWith(new URL(self.registration.scope).pathname)) return;
    const res = await fetch(url.href, { cache: 'reload', credentials: 'same-origin' });
    if (!res || !res.ok) return;
    await putShell(url, res);
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

/* Gezinmelerde önce ağ, erişilemezse önbellekteki uygulama kabuğu. */
self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET' || req.mode !== 'navigate') return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;
  e.respondWith((async () => {
    try {
      const res = await fetch(req);
      if (res && res.ok) e.waitUntil(putShell(url, res.clone()).catch(() => {}));
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
/* Sessiz saatler (yerel saat): 23:00–05:00. Hava uyarısı da bu kurala uyar. */
const QUIET_FROM = 23;
const QUIET_TO = 5;

const HELLO_TAG = 'vespir-hello';
const UMBRELLA_TAG = 'vespir-umbrella';

const WEATHER_ALERTS = {
  rain: [
    'Dışarıda yağmur var; çıkmadan önce şemsiyeni almayı unutma.',
    'Hava yağmurlu. Montunu ya da şemsiyeni yanına almayı unutma.',
    'Yağmur yağıyor, bugün yanında bir şemsiye olsun.'
  ],
  drizzle: [
    'İnce bir çisenti var; ceketini ya da şemsiyeni almayı unutma.',
    'Çisentili bir hava var. Çıkmadan önce şemsiyeni kontrol et.'
  ],
  storm: [
    'Fırtına var; dışarı çıkacaksan şemsiyeni ve montunu al.',
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

/* Kaydetmeden önce güncel kaydı yeniden okur: sayfa araya girip tercihleri
   değiştirdiyse onun alanlarını ezmeden yalnızca worker'ın alanlarını yazar. */
async function savePrefs(patch) {
  try {
    const cache = await caches.open(PREFS_CACHE);
    const res = await cache.match(prefsUrl());
    const current = res ? await res.json().catch(() => null) : null;
    if (!current) return; /* Kullanıcı mesajları kapatmış (kayıt silinmiş) olabilir. */
    await cache.put(prefsUrl(),
      new Response(JSON.stringify(Object.assign(current, patch)), { headers: { 'Content-Type': 'application/json' } }));
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

function isQuiet(hour) {
  return hour >= QUIET_FROM || hour < QUIET_TO;
}

async function anyVisibleWindow() {
  const wins = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
  return wins.some((c) => c.visibilityState === 'visible');
}

/* Sayfadaki weatherKind / weatherAlertKind ile aynı sınıflandırma (WMO kodları). */
function weatherKind(code, day) {
  if (code >= 95) return 'storm';
  if ((code >= 71 && code <= 77) || code === 85 || code === 86) return 'snow';
  if ((code >= 61 && code <= 67) || (code >= 80 && code <= 82)) return 'rain';
  if (code >= 51 && code <= 57) return 'drizzle';
  if (code === 45 || code === 48) return 'fog';
  if (code >= 1 && code <= 3) return 'cloud';
  return day ? 'sun' : 'night';
}

function alertKind(w) {
  const k = weatherKind(w.code, w.day);
  if (k === 'storm' || k === 'snow' || k === 'fog' || k === 'rain' || k === 'drizzle') return k;
  if (Number.isFinite(w.wind) && w.wind >= 30) return 'windy';
  if (k === 'sun' && Number.isFinite(w.temp) && w.temp >= 28) return 'clear_hot';
  return '';
}

/* Worker uyandığında güncel havayı kendisi alır. Başarısızsa null döner. */
async function fetchWeatherNow(geo) {
  if (!geo || !Number.isFinite(Number(geo.lat)) || !Number.isFinite(Number(geo.lon))) return null;
  const ctrl = new AbortController();
  const stop = setTimeout(() => ctrl.abort(), 8000);
  try {
    const lat = Number(geo.lat).toFixed(1);
    const lon = Number(geo.lon).toFixed(1);
    const res = await fetch('https://api.open-meteo.com/v1/forecast?latitude=' + lat + '&longitude=' + lon +
      '&current=temperature_2m,weather_code,is_day,wind_speed_10m&timezone=auto', { signal: ctrl.signal });
    if (!res.ok) return null;
    const data = await res.json();
    const c = data && data.current;
    if (!c || !Number.isFinite(Number(c.weather_code))) return null;
    return {
      code: Number(c.weather_code),
      temp: Number(c.temperature_2m),
      day: Number(c.is_day) !== 0,
      wind: Number(c.wind_speed_10m),
      at: Date.now()
    };
  } catch (e) {
    return null;
  } finally {
    clearTimeout(stop);
  }
}

/* Hava uyarısı: günde en fazla bir kez; saat sınırı yok, yalnızca sessiz saatler (23:00–05:00) dışında. */
async function maybeWeatherAlert(prefs, now, hour) {
  const today = localDay(now);
  if (prefs.umbrellaDay === today) return false;     /* bugün uyarı gitti */
  if (now - (Number(prefs.umbrellaCheckedAt) || 0) < MSG_GAP) return false; /* son 3 saatte baktık, uyarılacak bir şey yoktu */
  if (await anyVisibleWindow()) return false;

  let condition = '';
  const live = await fetchWeatherNow(prefs.geo);
  if (live) {
    condition = alertKind(live);
  } else if (prefs.weatherCondition || prefs.wet) {
    /* Ağ yoksa yalnızca taze (3 saatten yeni) sayfa verisine güven. */
    if (now - (Number(prefs.weatherAt) || 0) <= WEATHER_FRESH) condition = prefs.weatherCondition || prefs.wet;
    else return false; /* Güvenilir veri yok; yarın tekrar denemek için işaretleme yapma. */
  } else {
    return false;
  }

  if (!condition || !WEATHER_ALERTS[condition]) {
    await savePrefs({ umbrellaCheckedAt: now });
    return false;
  }

  await self.registration.showNotification(prefs.name || 'Vespır', {
    body: pickLine(WEATHER_ALERTS[condition]),
    icon: prefs.icon || undefined,
    badge: prefs.icon || undefined,
    tag: UMBRELLA_TAG,
    data: { url: prefs.url || self.registration.scope }
  });
  await savePrefs({ umbrellaDay: today, umbrellaCheckedAt: now });
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
  await savePrefs({ lastMsgAt: now });
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
      if (isQuiet(hour)) return;

      /* Önce hava uyarısı (günde bir kez), sonra genel mesaj. */
      const sentAlert = await maybeWeatherAlert(prefs, now, hour);
      if (!sentAlert) await maybeHello(prefs, now, hour);
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