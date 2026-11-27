/* ============================================================
   Firebase Auth — Google ile giriş
   Ayrı modül çalışır: SDK yüklenemezse uygulamanın geri kalanı
   hiç etkilenmez, yalnızca giriş sayfası bilgi verir.
   ============================================================ */
/* Firebase web API anahtarı bir sır değildir: tarayıcıya inen her yapılandırmada
   görünür ve tek başına veri okumaya/yazmaya yetmez. Gerçek koruma Firebase
   konsolunda yapılır: (1) API anahtarını yalnızca bu sitenin HTTP referrer'ına
   kısıtla, (2) Authentication > Settings > Authorized domains listesine alan adını
   ekle, (3) Firestore/Storage kullanılıyorsa güvenlik kurallarını ve App Check'i aç.
   Bu dosyaya hiçbir zaman gizli anahtar, servis hesabı veya şifre yazılmaz. */
const FB_CFG = {
  apiKey: 'AIzaSyDIvEf8juSZoLnRa5tLPN4vuYfxEMYOkQQ',
  authDomain: 'vespir-focus.firebaseapp.com',
  projectId: 'vespir-focus',
  storageBucket: 'vespir-focus.firebasestorage.app',
  messagingSenderId: '20251227909',
  appId: '1:20251227909:web:c6c3f20fc1fc0b2424696c'
};
const isFile = location.protocol === 'file:';
/* Kaldırılan e-posta girişinden kalmış olabilecek bekleyen adres kaydı silinir. */
try { localStorage.removeItem('vespir.auth.email'); } catch (e) {}
const googleBtn = document.getElementById('accountGoogle');
const googleLabel = document.getElementById('accountGoogleLabel');
const statusEl = document.getElementById('accountStatus');
const outStatus = document.getElementById('accountOutStatus');
const noteEl = document.getElementById('accountNote');
const paneIn = document.getElementById('accountSignIn');
const paneOut = document.getElementById('accountSigned');
const emailShow = document.getElementById('accountEmailShow');
const signOutBtn = document.getElementById('accountSignOut');
const subtitle = document.querySelector('#accountBtn [data-account-sub]');
const titleEl = document.getElementById('accountTitle');
let auth = null;
let fb = null;
let user = null;
let busy = false;
const en = () => document.documentElement.dataset.lang === 'en';
/* Yonlendirmeli giriste (iPhone/Safari) sayfa Google'a gidip geri doner.
   Donuste oturum gelmezse bunu sessizce yutmayalim: bir isaret birakip
   kullaniciya nedenini ve ne yapabilecegini yaziyoruz. */
const PENDING_REDIRECT_KEY = 'vespir.auth.pending';
const PENDING_REDIRECT_TTL = 10 * 60 * 1000;
function markPendingRedirect() { try { localStorage.setItem(PENDING_REDIRECT_KEY, String(Date.now())); } catch (e) {} }
function clearPendingRedirect() { try { localStorage.removeItem(PENDING_REDIRECT_KEY); } catch (e) {} }
function pendingRedirectAge() {
  try {
    const at = Number(localStorage.getItem(PENDING_REDIRECT_KEY));
    return at > 0 ? Date.now() - at : -1;
  } catch (e) { return -1; }
}
/* Oturum geri yukleme yarisini bekle, sonra nedenini goster. */
function schedulePendingRedirectWarning() {
  setTimeout(() => {
    const age = pendingRedirectAge();
    if (age < 0) return;
    clearPendingRedirect();
    if (user || age > PENDING_REDIRECT_TTL) return;
    setStatus(msgFor({ code: 'auth/web-storage-unsupported' }), 'err');
  }, 1500);
}
function msgFor(err) {
  const code = (err && err.code) || '';
  const tr = {
    'auth/network-request-failed': 'İnternete bağlanamadım. Bağlantını kontrol edip tekrar dene.',
    'auth/too-many-requests': 'Çok fazla deneme oldu. Biraz bekleyip tekrar dene.',
    'auth/operation-not-allowed': 'Google ile giriş henüz etkin değil. Firebase Authentication ayarlarından Google sağlayıcısı açılmalı.',
    'auth/unauthorized-domain': 'Bu web adresi giriş için yetkilendirilmemiş. Firebase Authentication içindeki izinli alan adları kontrol edilmeli.',
    'auth/popup-blocked': 'Tarayıcı Google giriş penceresini engelledi. Açılır pencerelere izin verip tekrar dene. Gömülü sayfadaysan Vespır’ı ayrı sekmede aç.',
    'auth/popup-closed-by-user': 'Google giriş penceresini kapattın. İstersen tekrar deneyebilirsin.',
    'auth/cancelled-popup-request': 'Google giriş isteği iptal edildi. Yeniden deneyebilirsin.',
    'auth/web-storage-unsupported': 'Tarayıcı üçüncü taraf depolamayı engelliyor; Google girişi bu yüzden tamamlanamadı. Vespır’ı ayrı sekmede açıp tekrar dene ya da tarayıcı ayarlarından bu siteye veri izni ver.',
    'auth/redirect-cancelled-by-user': 'Google yönlendirmesi tamamlanmadan iptal edildi. Tekrar deneyebilirsin.',
    'auth/internal-error': 'Giriş servisi beklenmedik bir yanıt verdi. Biraz sonra tekrar dene.',
    'auth/account-exists-with-different-credential': 'Bu hesap başka bir giriş yöntemiyle kayıtlı. Yardım için iletişim sayfasından bize yaz.',
    'auth/operation-not-supported-in-this-environment': 'Bu ortam Google girişini desteklemiyor. Vespır’ı destekleyen bir tarayıcıda, ayrı sekmede ve güvenli bir web adresinden aç.',
    'auth/user-disabled': 'Bu hesap kapatılmış.'
  };
  const eng = {
    'auth/network-request-failed': 'I couldn’t reach the internet. Check your connection and try again.',
    'auth/too-many-requests': 'Too many attempts. Wait a moment and try again.',
    'auth/operation-not-allowed': 'Google sign-in isn’t enabled yet. Enable the Google provider in Firebase Authentication settings.',
    'auth/unauthorized-domain': 'This web address isn’t authorized for sign-in. Check the authorized domains in Firebase Authentication.',
    'auth/popup-blocked': 'The browser blocked the Google sign-in window. Allow popups and try again. If you’re in an embedded page, open Vespır in a separate tab.',
    'auth/popup-closed-by-user': 'You closed the Google sign-in window. You can try again whenever you like.',
    'auth/cancelled-popup-request': 'The Google sign-in request was cancelled. You can try again.',
    'auth/web-storage-unsupported': 'The browser is blocking third-party storage, so Google sign-in couldn’t finish. Open Vespır in a separate tab and try again, or allow site data for this site in your browser settings.',
    'auth/redirect-cancelled-by-user': 'The Google redirect was cancelled before it finished. You can try again.',
    'auth/internal-error': 'The sign-in service returned an unexpected response. Try again in a moment.',
    'auth/account-exists-with-different-credential': 'This account is registered with another sign-in method. Contact us through the contact page for help.',
    'auth/operation-not-supported-in-this-environment': 'This environment doesn’t support Google sign-in. Open Vespır in a supporting browser, in a separate tab and from a secure web address.',
    'auth/user-disabled': 'This account has been disabled.'
  };
  return (en() ? eng[code] : tr[code]) || (en() ? 'Something went wrong. Try again in a moment.' : 'Bir şeyler ters gitti. Biraz sonra tekrar dene.');
}
function setStatus(text, kind) {
  if (!statusEl) return;
  statusEl.textContent = text || '';
  statusEl.className = 'account-status' + (kind ? ' ' + kind : '');
}
function setOutStatus(text, kind) {
  if (!outStatus) return;
  outStatus.textContent = text || '';
  outStatus.className = 'account-status' + (kind ? ' ' + kind : '');
}
function setBusy(on) {
  busy = !!on;
  if (googleBtn) googleBtn.disabled = busy;
  if (signOutBtn) signOutBtn.disabled = busy;
}
function paintUser(next) {
  user = next || null;
  const signed = !!user;
  if (paneIn) paneIn.hidden = signed;
  if (paneOut) paneOut.hidden = !signed;
  if (titleEl) titleEl.textContent = signed ? (en() ? 'Your account' : 'Hesabın') : (en() ? 'Sign in' : 'Giriş');
  if (signed) {
    const email = user.email || '';
    if (emailShow) emailShow.textContent = email;
    if (subtitle) subtitle.textContent = (en() ? 'Welcome ' : 'Hoş geldin ') + email;
    setStatus('', '');
    setOutStatus('', '');
  } else {
    if (subtitle) subtitle.textContent = en() ? 'Sign in with Google' : 'Google ile giriş';
    if (emailShow) emailShow.textContent = '';
    setOutStatus('', '');
  }
}
// Dil değişince hesap metinlerini yeniden çiz
document.addEventListener('vespir:lang', () => {
  paintUser(user);
  if (googleLabel && !busy) googleLabel.textContent = en() ? 'Continue with Google' : 'Google ile devam et';
  paintAccountNote();
});
// Dosyadan açıldığında gösterilen not
function paintAccountNote() {
  if (!noteEl || !isFile) return;
  noteEl.innerHTML = en()
    ? 'You opened Vespır from a local HTML file. To sign in with Google, open the app over <b>HTTPS or localhost</b>.'
    : 'Şu an HTML dosyasından açık. Google ile giriş için uygulamayı <b>HTTPS veya localhost</b> üzerinden aç.';
}
paintAccountNote();
/* Oturum sayfa yenilense de sürsün: Firebase bir kez kurulur, oturum
   tarayıcının yerel deposunda (IndexedDB) kalıcı tutulur ve açılışta
   onAuthStateChanged ile geri yüklenir. Önceden yalnızca giriş butonuna
   basılınca kurulduğu için F5 sonrası oturum yok sayılıyordu. */
let fbLoading = null;
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
    /* Yeniden denemede aynı uygulamayı ikinci kez kurmayalım. */
    const app = appMod.getApps && appMod.getApps().length ? appMod.getApp() : appMod.initializeApp(FB_CFG);
    auth = authMod.getAuth(app);
    fb = authMod;
    /* Kalıcılık, dinleyiciler bağlanmadan önce ayarlanır: oturum IndexedDB'de
       kalır ve sayfa yenilense de onAuthStateChanged ile geri gelir.
       IndexedDB engelliyse (gizli sekme, katı gizlilik ayarı) oturum belleğe
       değil sekme deposuna yazılır: sayfa yenilemesinde giriş yine sürer. */
    let persistence = 'unknown';
    try {
      await authMod.setPersistence(auth, authMod.browserLocalPersistence);
      persistence = 'local';
    } catch (e) {
      try {
        await authMod.setPersistence(auth, authMod.browserSessionPersistence);
        persistence = 'session';
      } catch (e2) { persistence = 'none'; }
    }
    try { auth.languageCode = en() ? 'en' : 'tr'; } catch (e) {}
    authMod.onAuthStateChanged(auth, (next) => {
      authReady = true;
      /* Tanılama: sorun bildirirken konsoldaki bu satır tek başına yeter. */
      try {
        console.info('[Vespir] oturum:', next && next.email ? next.email : 'yok', '· kalıcılık:', persistence);
      } catch (e) {}
      paintUser(next);
    });
    /* Yönlendirmeli girişten (iPhone/Safari) dönüşte hesabı yakala.
       Hata olursa sessizce yutma: kullanıcı neden giriş yapamadığını görsün. */
    try {
      const redirected = await authMod.getRedirectResult(auth);
      if (redirected && redirected.user) {
        clearPendingRedirect();
        paintUser(redirected.user);
        setOutStatus(en() ? 'You’re signed in with Google. Welcome!' : 'Google hesabınla giriş yaptın. Hoş geldin!', 'ok');
      } else if (pendingRedirectAge() >= 0) {
        schedulePendingRedirectWarning();
      }
    } catch (err) {
      clearPendingRedirect();
      setStatus(msgFor(err), 'err');
    }
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
}
if (googleBtn) googleBtn.addEventListener('click', async () => {
  if (busy) return;
  if (isFile) { setStatus(en() ? 'To sign in with Google, open Vespır over HTTPS or localhost. Sign-in doesn’t work from a local HTML file.' : 'Google ile giriş için Vespır’ı HTTPS veya localhost üzerinden aç. Doğrudan HTML dosyasından giriş yapılamaz.', 'err'); return; }
  setBusy(true);
  googleLabel.textContent = en() ? 'Opening Google…' : 'Google açılıyor…';
  setStatus(en() ? 'Loading sign-in service…' : 'Giriş servisi yükleniyor…', '');
  try {
    /* Firebase açılışta kuruldu; burada hazır olduğundan emin olunur. */
    await loadFirebase();
    const makeProvider = () => {
      const provider = new fb.GoogleAuthProvider();
      provider.setCustomParameters({ prompt: 'select_account' });
      return provider;
    };
    if (useRedirectSignIn()) {
      setStatus(en() ? 'Taking you to Google…' : 'Google’a yönlendiriliyorsun…', '');
      /* Geri dönüşte oturum gelip gelmediğini anlamak için işaret bırak. */
      markPendingRedirect();
      try {
        await fb.signInWithRedirect(auth, makeProvider());
      } catch (e) {
        clearPendingRedirect();
        throw e;
      }
      return;
    }
    setStatus(en() ? 'Choose your Google account in the window that opens.' : 'Açılan pencereden Google hesabını seç.', '');
    const cred = await fb.signInWithPopup(auth, makeProvider());
    paintUser(cred.user);
    setOutStatus(en() ? 'You’re signed in with Google. Welcome!' : 'Google hesabınla giriş yaptın. Hoş geldin!', 'ok');
  } catch (err) {
    const code = (err && err.code) || '';
    if (code === 'auth/popup-blocked' || code === 'auth/operation-not-supported-in-this-environment' || code === 'auth/cancelled-popup-request') {
      /* Popup engellendi: yönlendirmeyi dene. O da başlamazsa sessiz kalma. */
      try {
        setStatus(en() ? 'Taking you to Google…' : 'Google’a yönlendiriliyorsun…', '');
        const provider = new fb.GoogleAuthProvider();
        provider.setCustomParameters({ prompt: 'select_account' });
        markPendingRedirect();
        await fb.signInWithRedirect(auth, provider);
        return;
      } catch (e2) {
        clearPendingRedirect();
        try { console.warn('[Vespir] yönlendirmeli giriş başlatılamadı', e2); } catch (e3) {}
        setStatus(msgFor((e2 && e2.code) ? e2 : err), 'err');
      }
    } else {
      setStatus(msgFor(err), 'err');
    }
  } finally {
    googleLabel.textContent = en() ? 'Continue with Google' : 'Google ile devam et';
    setBusy(false);
    const acc = document.getElementById('account');
    if (user && acc && acc.classList.contains('open')) signOutBtn.focus({ preventScroll: true });
  }
});
if (noteEl && isFile) paintAccountNote();
/* Açılışta oturumu geri yükle: F5 / yenileme sonrası giriş görünür kalır. */
if (!isFile) loadFirebase().catch(() => {});
if (signOutBtn) signOutBtn.addEventListener('click', async () => {
  if (busy || !fb || !auth) { setStatus(en() ? 'Sign-in service not loaded.' : 'Giriş servisi yüklenmedi.', 'err'); return; }
  setBusy(true);
  try {
    await fb.signOut(auth);
    paintUser(null);
    setStatus(en() ? 'Signed out. See you soon!' : 'Çıkış yapıldı. Görüşürüz!', 'ok');
  } catch (err) {
    setOutStatus(en() ? 'Couldn’t sign out. Try again.' : 'Çıkış yapılamadı. Tekrar dene.', 'err');
  } finally {
    setBusy(false);
  }
});
