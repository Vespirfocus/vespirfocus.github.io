/* Vespır v22 yaması: halka yerleşimi, Apple alt barı + özel ikonlar,
   güncelleme ekranı (Yenilikler), hakkımızda kış görseli, oturum sertleştirme. */
const fs = require('fs');
const path = require('path');
const root = 'C:/Users/Asus/Desktop/Vespır';
const read = (p) => fs.readFileSync(path.join(root, p), 'utf8');
const write = (p, s) => fs.writeFileSync(path.join(root, p), s);

let html = read('index.html');
const norm = (s) => s.replace(/\r\n/g, '\n').replace(/\n/g, '\r\n');
let count = 0;
function rep(label, a, b) {
  const A = norm(a), B = norm(b);
  if (!html.includes(A)) throw new Error('MISSING: ' + label);
  const n = html.split(A).length - 1;
  if (n !== 1) throw new Error('AMBIGUOUS(' + n + '): ' + label);
  html = html.split(A).join(B);
  count++;
  console.log('ok  ' + label);
}

/* ---------- 1. Sürüm ---------- */
rep('version const', `const APP_VERSION = 'v21';`, `const APP_VERSION = 'v22';`);
rep('version chip', `id="appVersion">v21<`, `id="appVersion">v22<`);

/* ---------- 2. Halka: günlük odak etiketi halkanın dışına ---------- */
rep('ring-foot sadeleşti',
`          <div class="ring-foot">
          <div class="ring-sub" id="ringSub">25 dakika odak      </div>
          <div class="cat-note" id="catNote"><span class="today-min" id="todayFocusChip">Bugün 0 dk odak</span>      </div>
          </div>`,
`          <div class="ring-foot">
          <div class="ring-sub" id="ringSub">25 dakika odak      </div>
          </div>`);

rep('ring-today eklendi',
`      <div class="controls">
        <button class="btn ghost" id="resetBtn"`,
`      <div class="ring-today cat-note" id="catNote"><span class="today-min" id="todayFocusChip">Bugün 0 dk odak</span></div>
      <div class="controls">
        <button class="btn ghost" id="resetBtn"`);

/* ---------- 3. Hakkımızda: kış görseli ---------- */
rep('about hero html',
`    <div class="about-scroll" id="aboutScroll">
      <p class="about-copy">Vespır, pomodoro`,
`    <div class="about-scroll" id="aboutScroll">
      <figure class="about-hero"><img class="about-hero-img" src="assets/noel-vespir.jpg" alt="Vespır çam ağacının altında, kış temalı illüstrasyon" width="1392" height="752" decoding="async"></figure>
      <p class="about-copy">Vespır, pomodoro`);

/* ---------- 4. Alt bar ikonları (Vespır'a özel) ---------- */
rep('nav odak iko',
`    <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="3.2"/><path d="M12 2.8v3M12 18.2v3M2.8 12h3M18.2 12h3M5.5 5.5l2.1 2.1M16.4 16.4l2.1 2.1M18.5 5.5l-2.1 2.1M7.6 16.4l-2.1 2.1"/></svg>`,
`    <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="8.9" stroke-dasharray="2.2 3.1" opacity=".45"/><ellipse cx="9.3" cy="9.1" rx="1.15" ry="1.5"/><ellipse cx="14.7" cy="9.1" rx="1.15" ry="1.5"/><ellipse cx="6.9" cy="12.3" rx=".95" ry="1.2"/><ellipse cx="17.1" cy="12.3" rx=".95" ry="1.2"/><path d="M12 11.7c2.2 0 4 1.6 4 3.3 0 1.4-1.3 2.3-2.8 2.3-.6 0-1-.3-1.2-.3s-.6.3-1.2.3c-1.5 0-2.8-.9-2.8-2.3 0-1.7 1.8-3.3 4-3.3Z"/></svg>`);

rep('nav tema iko',
`  <button class="item" id="navTema" aria-label="Karanlık ve aydınlık tema arasında geçiş yap" type="button">
    <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="8.2"/><path d="M12 3.8a8.2 8.2 0 0 1 0 16.4Z" fill="currentColor" stroke="none"/></svg>
    <span>Tema</span>
  </button>`,
`  <button class="item" id="navTema" aria-label="Karanlık ve aydınlık tema arasında geçiş yap" type="button">
    <span class="nav-ico">
      <svg class="nav-sun" viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="4.5"/><path d="M12 2.6v1.9M12 19.5v1.9M2.6 12h1.9M19.5 12h1.9M5.4 5.4l1.35 1.35M17.25 17.25l1.35 1.35M18.6 5.4l-1.35 1.35M6.75 17.25 5.4 18.6" opacity=".65"/><path d="M8.5 8.4 8 6.2l2.1.8M15.5 8.4l.5-2.2-2.1.8"/><circle cx="10.4" cy="11.4" r=".8" fill="currentColor" stroke="none"/><circle cx="13.6" cy="11.4" r=".8" fill="currentColor" stroke="none"/><path d="M11.1 13.3c.3.45.6.65.9.65s.6-.2.9-.65"/></svg>
      <svg class="nav-moon" viewBox="0 0 24 24" aria-hidden="true"><path d="M15.2 3.4a8.8 8.8 0 1 0 5.4 13.2A10 10 0 0 1 15.2 3.4Z"/><path d="M4.6 6.4c.8.45 1.7.6 2.6.45" opacity=".5"/><path d="M19.4 3.6v1.9M18.45 4.55h1.9" opacity=".85"/></svg>
    </span>
    <span>Tema</span>
  </button>`);

rep('nav ayarlar iko',
`    <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 7h7M15 7h5M4 17h5M13 17h7"/><circle cx="13" cy="7" r="2.2"/><circle cx="11" cy="17" r="2.2"/></svg>`,
`    <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2.9v1.9M12 19.2v1.9M2.9 12h1.9M19.2 12h1.9M5.6 5.6l1.4 1.4M17 17l1.4 1.4M18.4 5.6 17 7M7 17l-1.4 1.4" opacity=".55"/><circle cx="12" cy="12" r="5.6"/><ellipse cx="10.1" cy="10.4" rx=".8" ry="1.05"/><ellipse cx="13.9" cy="10.4" rx=".8" ry="1.05"/><path d="M12 12.5c1.25 0 2.2.85 2.2 1.8 0 .8-.75 1.25-1.5 1.25-.35 0-.5-.15-.7-.15s-.35.15-.7.15c-.75 0-1.5-.45-1.5-1.25 0-.95.95-1.8 2.2-1.8Z"/></svg>`);

rep('nav hesap iko',
`    <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="8.2" r="3.6"/><path d="M4.8 20.2a7.2 7.2 0 0 1 14.4 0"/></svg>`,
`    <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5.3 8.6 4.5 4.1l3.9 1.4M18.7 8.6l.8-4.5-3.9 1.4"/><path d="M12 5.4c3.9 0 7 2.9 7 6.5s-3.1 6.6-7 6.6-7-3-7-6.6 3.1-6.5 7-6.5Z"/><circle cx="9.5" cy="11.4" r=".88" fill="currentColor" stroke="none"/><circle cx="14.5" cy="11.4" r=".88" fill="currentColor" stroke="none"/><path d="M11.2 13.7h1.6l-.8 1.1Z" fill="currentColor" stroke="none"/><path d="M8.2 17.4c1.1.8 2.4 1.2 3.8 1.2s2.7-.4 3.8-1.2" opacity=".55"/></svg>`);

/* ---------- 5. Yeni CSS ---------- */
rep('css eklendi',
`#bottomNav {
  position: fixed;`,
`/* Sayaç halkasının hemen altındaki günlük odak etiketi. */
.ring-today { display: flex; margin: 0 auto 10px; align-self: center; width: max-content; max-width: 92%; }
main.app.focus-active .ring-today { display: none !important; }
/* Hakkımızda sayfasındaki kış görseli. */
.about-hero {
  margin: 4px 0 18px; padding: 0; overflow: hidden;
  border-radius: 22px; border: 1px solid var(--line);
  box-shadow: 0 26px 54px -38px var(--shadow), inset 0 1px 0 rgba(255, 255, 255, .42);
}
img.about-hero-img {
  display: block; width: 100%; height: auto; aspect-ratio: 1392 / 752;
  border-radius: 22px !important; object-fit: cover;
}
/* Alt bar: Vespır'a özel ikonlar. */
#bottomNav .nav-ico { display: grid; place-items: center; width: 25px; height: 25px; }
#bottomNav .nav-ico svg { grid-area: 1 / 1; width: 25px; height: 25px; }
#bottomNav .nav-sun { display: none; }
html[data-mode="light"] #bottomNav .nav-sun { display: block; }
html[data-mode="light"] #bottomNav .nav-moon { display: none; }
#bottomNav .item.active .nav-ico { filter: drop-shadow(0 3px 7px color-mix(in srgb, var(--accent) 58%, transparent)); }
#bottomNav .item:focus-visible { outline: 2px solid var(--accent); outline-offset: 2px; }
/* Güncelleme ekranı (güncelle + devam et) */
.update-overlay {
  position: fixed; inset: 0; z-index: 320; display: grid; place-items: center;
  padding: 18px; opacity: 1;
}
.update-overlay[hidden] { display: none; }
.update-backdrop {
  position: absolute; inset: 0;
  background: color-mix(in srgb, var(--scrim) 68%, transparent);
  -webkit-backdrop-filter: blur(18px) saturate(118%); backdrop-filter: blur(18px) saturate(118%);
}
.update-card {
  position: relative; width: min(520px, calc(100vw - 24px)); max-height: min(86svh, 720px);
  display: flex; flex-direction: column; overflow: hidden; border-radius: 28px;
  border: 1px solid color-mix(in srgb, var(--accent) 22%, var(--line));
  background: linear-gradient(158deg, var(--glass-3), color-mix(in srgb, var(--glass-3) 92%, transparent) 55%, color-mix(in srgb, var(--bg-0) 96%, transparent));
  box-shadow: 0 46px 110px -46px var(--shadow), inset 0 1px 0 rgba(255, 255, 255, .5);
  animation: updateIn .5s var(--spring) both;
}
@keyframes updateIn { from { opacity: 0; transform: translateY(18px) scale(.97); } }
.update-header { display: flex; align-items: center; gap: 10px; padding: 20px 22px 6px; flex: none; }
.update-dot { width: 10px; height: 10px; border-radius: 50%; background: var(--accent); box-shadow: 0 0 0 4px color-mix(in srgb, var(--accent) 22%, transparent); }
.update-title { font-family: var(--display); font-size: 19px; font-weight: 700; letter-spacing: -.03em; color: var(--ink); }
.update-ver {
  margin-left: auto; padding: 3px 9px; border-radius: 999px; font-size: 10px; font-weight: 800;
  letter-spacing: .06em; text-transform: uppercase; color: var(--accent);
  background: var(--accent-soft); border: 1px solid color-mix(in srgb, var(--accent) 26%, transparent);
}
.update-body { padding: 4px 22px 8px; overflow-y: auto; overscroll-behavior: contain; }
.update-intro { margin: 0 0 12px; font-size: 12.5px; line-height: 1.62; color: var(--ink-2); }
.update-news { border-radius: 18px; border: 1px solid var(--line); background: var(--field); padding: 12px 14px; }
.news-title { font-size: 10px; font-weight: 800; letter-spacing: .16em; text-transform: uppercase; color: var(--accent); margin-bottom: 8px; }
.news-list { display: flex; flex-direction: column; gap: 8px; margin: 0; padding: 0; list-style: none; }
.news-list li { position: relative; padding-left: 16px; font-size: 12px; line-height: 1.5; color: var(--ink-2); }
.news-list li::before { content: ""; position: absolute; left: 2px; top: .5em; width: 6px; height: 6px; border-radius: 50%; background: color-mix(in srgb, var(--accent) 70%, transparent); }
.update-footer { padding: 10px 22px 18px; flex: none; }
.update-btn {
  width: 100%; height: 48px; border-radius: 16px; font-size: 14px; font-weight: 700; color: #fff;
  background: linear-gradient(118deg, var(--accent), color-mix(in srgb, var(--accent) 58%, var(--accent-2)));
  box-shadow: 0 16px 30px -18px var(--accent), inset 0 1px 0 rgba(255, 255, 255, .5);
  transition: transform .22s var(--spring), filter .2s;
}
.update-btn:active { transform: scale(.98); }
#bottomNav {
  position: fixed;`);

/* ---------- 6. EN sözlüğü ---------- */
rep('en dict v22',
`  /* v21: eksik kalan arayüz metinleri */`,
`  /* v22: kış görseli ve yeni sürüm notları */
  'Vespır çam ağacının altında, kış temalı illüstrasyon': 'Vespır under a pine tree, winter illustration',
  /* v21: eksik kalan arayüz metinleri */`);

/* ---------- 7. Alt bar davranışı ---------- */
rep('nav script',
`(function() {
  const nav = document.getElementById('bottomNav');
  if (!nav) return;
  if (!document.documentElement.classList.contains('ios-glass')) { nav.remove(); return; }
  const items = Array.from(nav.querySelectorAll('.item'));
  const setActive = (id) => items.forEach((i) => i.classList.toggle('active', i.id === id));
  nav.addEventListener('click', (e) => {
    const btn = e.target.closest('.item');
    if (!btn) return;
    if (btn.id === 'navOdak') {
      setActive(btn.id);
      if (typeof closeSettings === 'function') closeSettings();
      const card = document.getElementById('timerCard');
      if (card && card.scrollIntoView) card.scrollIntoView({ behavior: 'smooth', block: 'center' });
    } else if (btn.id === 'navTema') {
      if (typeof toggleScheme === 'function') toggleScheme();
      btn.classList.add('active');
      setTimeout(() => setActive('navOdak'), 420);
    } else {
      setActive(btn.id);
      if (btn.id === 'navAyarlar' && typeof openSettings === 'function') openSettings('cat');
      if (btn.id === 'navHesap' && typeof openAccount === 'function') openAccount();
    }
  });
})();`,
`(function() {
  const nav = document.getElementById('bottomNav');
  if (!nav) return;
  if (!document.documentElement.classList.contains('ios-glass')) { nav.remove(); return; }
  const items = Array.from(nav.querySelectorAll('.item'));
  const setActive = (id) => items.forEach((i) => {
    const on = i.id === id;
    i.classList.toggle('active', on);
    if (on) i.setAttribute('aria-current', 'page');
    else i.removeAttribute('aria-current');
  });
  const closeAll = () => {
    ['about', 'contact', 'privacy', 'account'].forEach((key) => {
      const el = document.getElementById(key);
      if (!el || !el.classList.contains('open')) return;
      const closer = { about: 'closeAbout', contact: 'closeContact', privacy: 'closePrivacy', account: 'closeAccount' }[key];
      try { if (typeof window[closer] === 'function') window[closer](); } catch (e) {}
    });
  };
  nav.addEventListener('click', (e) => {
    const btn = e.target.closest('.item');
    if (!btn) return;
    if (btn.id === 'navOdak') {
      setActive(btn.id);
      closeAll();
      if (typeof closeSettings === 'function') closeSettings();
      const card = document.getElementById('timerCard');
      if (card && card.scrollIntoView) card.scrollIntoView({ behavior: 'smooth', block: 'center' });
    } else if (btn.id === 'navTema') {
      if (typeof toggleScheme === 'function') toggleScheme();
      btn.classList.add('active');
      setTimeout(() => setActive('navOdak'), 480);
    } else {
      setActive(btn.id);
      if (btn.id === 'navAyarlar' && typeof openSettings === 'function') openSettings('cat');
      if (btn.id === 'navHesap' && typeof openAccount === 'function') openAccount();
    }
  });
  /* Dil değişince etiketler sözlükten gelir; burada yalnızca durum tazelenir. */
  document.addEventListener('vespir:lang', () => setActive(nav.querySelector('.item.active') ? nav.querySelector('.item.active').id : 'navOdak'));
})();`);

/* ---------- 8. Güncelleme ekranı: Yenilikler + devam et ---------- */
rep('update overlay script',
`<script>
/* Alt bar - yalnızca iOS/Apple cihazlarda görünür.`,
`<script>
/* Güncelleme ekranı: sürüm değiştiğinde bir kez gösterilir.
   İlk ziyarette (kayıtlı sürüm yokken) açılmaz. */
(function() {
  const overlay = document.getElementById('updateOverlay');
  const list = document.getElementById('newsList');
  const verEl = document.getElementById('updateVer');
  const btn = document.getElementById('updateContinueBtn');
  if (!overlay || !list || !btn) return;
  const KEY = 'vespir.seenVersion';
  const NEWS = {
    v22: {
      tr: [
        'Sayaç halkasının içi yeniden dengelendi: "Bugün X dk odak" etiketi halkanın altına taşındı, rakamlar tam ortada.',
        'Apple cihazlarda Liquid Glass alt bar: Odaklan · Tema · Ayarlar · Hesap; ikonlar artık Vespır’a özel.',
        'Google ile giriş sayfa yenilense de sürüyor; oturum bu tarayıcıda saklanıyor. iPhone/Safari’de yönlendirmeli giriş.',
        'Hakkımızda sayfasına yeni kış (Noel) görseli eklendi.',
        'Güncelleme ekranındaki "Yenilikler" listesi gerçek sürüm notlarını gösteriyor.',
        'Çevrimdışı açılışta eski sürüm yerine güncel arayüz yükleniyor; mum artık bal kabağının içinde değil.'
      ],
      en: [
        'The inside of the timer ring is balanced again: "Today X min focus" moved under the ring and the digits sit dead centre.',
        'Liquid Glass bottom bar on Apple devices: Focus · Theme · Settings · Account, now with Vespır’s own icons.',
        'Google sign-in survives a page refresh; your session is kept in this browser, with redirect sign-in on iPhone/Safari.',
        'A new winter (Christmas) illustration was added to the What is Vespır page.',
        'The "What’s new" list on the update screen now shows real release notes.',
        'Offline starts load the current interface instead of an old version; the candle is no longer inside the pumpkin.'
      ]
    }
  };
  const lang = () => (document.documentElement.dataset.lang === 'en' ? 'en' : 'tr');
  function paint(version) {
    const pack = NEWS[version];
    if (verEl) verEl.textContent = version || '';
    list.innerHTML = '';
    if (!pack) return;
    (pack[lang()] || pack.tr).forEach((line) => {
      const li = document.createElement('li');
      li.textContent = line;
      list.appendChild(li);
    });
  }
  function close() {
    overlay.hidden = true;
    document.body.classList.remove('update-open');
    try { localStorage.setItem(KEY, document.getElementById('appVersion') ? document.getElementById('appVersion').textContent : ''); } catch (e) {}
  }
  btn.addEventListener('click', close);
  overlay.addEventListener('click', (e) => { if (e.target === overlay || e.target.classList.contains('update-backdrop')) close(); });
  const version = (document.getElementById('appVersion') || {}).textContent || '';
  let seen = '';
  try { seen = localStorage.getItem(KEY) || ''; } catch (e) {}
  if (!version) return;
  if (!seen) { try { localStorage.setItem(KEY, version); } catch (e) {} return; }
  if (seen === version) return;
  paint(version);
  overlay.hidden = false;
  document.body.classList.add('update-open');
  setTimeout(() => { try { btn.focus({ preventScroll: true }); } catch (e) {} }, 260);
})();
</script>
<script>
/* Alt bar - yalnızca iOS/Apple cihazlarda görünür.`);

/* ---------- 9. Oturum sertleştirme (Google / F5) ---------- */
rep('auth load',
`let fbLoading = null;
function loadFirebase() {
  if (fbLoading) return fbLoading;
  fbLoading = (async () => {
    const [appMod, authMod] = await Promise.all([
      import('https://www.gstatic.com/firebasejs/13.2.0/firebase-app.js'),
      import('https://www.gstatic.com/firebasejs/13.2.0/firebase-auth.js')
    ]);
    const app = appMod.initializeApp(FB_CFG);
    auth = authMod.getAuth(app);
    fb = authMod;
    try { await authMod.setPersistence(auth, authMod.browserLocalPersistence); } catch (e) {}
    authMod.onAuthStateChanged(auth, paintUser);
    return { auth, authMod };
  })().catch((err) => { fbLoading = null; throw err; });
  return fbLoading;
}`,
`let fbLoading = null;
let authReady = false;
/* SDK yüklemesi tek denemede kalmasın: yavaş bağlantıda import hatası
   oturumun hiç geri yüklenmemesi (F5 sonrası çıkış gibi) demekti. */
function loadFirebase(attempt = 1) {
  if (fbLoading) return fbLoading;
  fbLoading = (async () => {
    const [appMod, authMod] = await Promise.all([
      import('https://www.gstatic.com/firebasejs/13.2.0/firebase-app.js'),
      import('https://www.gstatic.com/firebasejs/13.2.0/firebase-auth.js')
    ]);
    const app = appMod.initializeApp(FB_CFG);
    auth = authMod.getAuth(app);
    fb = authMod;
    /* Kalıcılık, dinleyiciler bağlanmadan önce ayarlanır: oturum IndexedDB'de
       kalır ve sayfa yenilense de onAuthStateChanged ile geri gelir. */
    try { await authMod.setPersistence(auth, authMod.browserLocalPersistence); } catch (e) {}
    try { auth.languageCode = en() ? 'en' : 'tr'; } catch (e) {}
    authMod.onAuthStateChanged(auth, (next) => {
      authReady = true;
      paintUser(next);
    });
    /* Yönlendirmeli girişten (iPhone/Safari) dönüşte hesabı yakala. */
    try {
      const redirected = await authMod.getRedirectResult(auth);
      if (redirected && redirected.user) {
        paintUser(redirected.user);
        setOutStatus(en() ? 'You’re signed in with Google. Welcome!' : 'Google hesabınla giriş yaptın. Hoş geldin!', 'ok');
      }
    } catch (e) {}
    return { auth, authMod };
  })().catch((err) => {
    fbLoading = null;
    if (attempt < 3) {
      return new Promise((resolve) => setTimeout(resolve, 900 * attempt)).then(() => loadFirebase(attempt + 1));
    }
    setStatus(en() ? 'Couldn’t reach the sign-in service. Check your connection and try again.' : 'Giriş servisine ulaşılamadı. Bağlantını kontrol edip tekrar dene.', 'err');
    throw err;
  });
  return fbLoading;
}
/* iPhone/iPad Safari açılır pencereyi güvenilir açmaz: orada yönlendirme kullanılır. */
function useRedirectSignIn() {
  try {
    const ua = navigator.userAgent || '';
    return /iPad|iPhone|iPod/.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  } catch (e) { return false; }
}`);

rep('auth click',
`  try {
    /* Firebase açılışta kuruldu; burada hazır olduğundan emin olunur. */
    await loadFirebase();
    setStatus(en() ? 'Choose your Google account in the window that opens.' : 'Açılan pencereden Google hesabını seç.', '');
    const provider = new fb.GoogleAuthProvider();
    provider.setCustomParameters({ prompt: 'select_account' });
    const cred = await fb.signInWithPopup(auth, provider);
    paintUser(cred.user);
    setOutStatus(en() ? 'You’re signed in with Google. Welcome!' : 'Google hesabınla giriş yaptın. Hoş geldin!', 'ok');
  } catch (err) {
    setStatus(msgFor(err), 'err');
  } finally {`,
`  try {
    /* Firebase açılışta kuruldu; burada hazır olduğundan emin olunur. */
    await loadFirebase();
    const makeProvider = () => {
      const provider = new fb.GoogleAuthProvider();
      provider.setCustomParameters({ prompt: 'select_account' });
      return provider;
    };
    if (useRedirectSignIn()) {
      setStatus(en() ? 'Taking you to Google…' : 'Google’a yönlendiriliyorsun…', '');
      await fb.signInWithRedirect(auth, makeProvider());
      return;
    }
    setStatus(en() ? 'Choose your Google account in the window that opens.' : 'Açılan pencereden Google hesabını seç.', '');
    const cred = await fb.signInWithPopup(auth, makeProvider());
    paintUser(cred.user);
    setOutStatus(en() ? 'You’re signed in with Google. Welcome!' : 'Google hesabınla giriş yaptın. Hoş geldin!', 'ok');
  } catch (err) {
    const code = (err && err.code) || '';
    if (code === 'auth/popup-blocked' || code === 'auth/operation-not-supported-in-this-environment' || code === 'auth/cancelled-popup-request') {
      try {
        setStatus(en() ? 'Taking you to Google…' : 'Google’a yönlendiriliyorsun…', '');
        const provider = new fb.GoogleAuthProvider();
        provider.setCustomParameters({ prompt: 'select_account' });
        await fb.signInWithRedirect(auth, provider);
        return;
      } catch (e2) {}
    }
    setStatus(msgFor(err), 'err');
  } finally {`);

write('index.html', html);
console.log('index.html: ' + count + ' yama uygulandı');

/* ---------- sw.js ---------- */
let sw = read('sw.js');
const swrep = (label, a, b) => {
  const A = a.replace(/\r\n/g, '\n'), B = b.replace(/\r\n/g, '\n');
  if (!sw.includes(A)) throw new Error('SW MISSING: ' + label);
  sw = sw.split(A).join(B);
  console.log('ok  sw ' + label);
};
swrep('cache v22', `const APP_CACHE = 'vespir-app-v21';`, `const APP_CACHE = 'vespir-app-v22';`);
swrep('static paths',
  `const STATIC_PATHS = ['manifest.webmanifest', 'icon-192.png', 'icon-512.png', 'icon-maskable-512.png'];`,
  `const STATIC_PATHS = ['manifest.webmanifest', 'icon-192.png', 'icon-512.png', 'icon-maskable-512.png', 'assets/noel-vespir.jpg'];`);
swrep('nav fetch',
`      /* cache: 'reload' — tarayıcının HTTP önbelleğindeki eski HTML yerine
         sunucudaki güncel dosya alınır. Böylece güncelleme yayınlandığında
         kurulu uygulama bir sonraki açılışta yeni sürümü görür.
         (waitUntil, respondWith içinde await'ten sonra çağrılamaz; bu yüzden
         kabuk önbelleğe yazımı doğrudan beklenir.) */
      const res = await fetchWithDeadline(req, { cache: 'reload' });`,
`      /* cache: 'reload' — tarayıcının HTTP önbelleğindeki eski HTML yerine
         sunucudaki güncel dosya alınır. Böylece güncelleme yayınlandığında
         kurulu uygulama bir sonraki açılışta yeni sürümü görür.
         Zaman aşımı yok: eskiden 5 sn'yi geçen yavaş bağlantılarda önbellekteki
         ESKİ kabuk dönüyordu (kullanıcı güncellemeyi hiç görmüyordu). Artık
         yalnızca gerçek bir ağ hatasında önbelleğe düşülür. */
      const res = await fetchWithDeadline(req, { cache: 'reload' });`);
swrep('nav fetch body',
`      const res = await fetchWithDeadline(req, { cache: 'reload' });
      if (res && res.ok) { try { await putShell(url, res.clone()); } catch (err) {} }`,
`      const res = await fetch(req, { cache: 'reload' });
      if (res && res.ok) { try { await putShell(url, res.clone()); } catch (err) {} }`);
write('sw.js', sw);
console.log('sw.js yamalandı');
