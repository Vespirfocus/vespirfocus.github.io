const fs = require('fs');
const P = 'C:/Users/Asus/Desktop/Vespır/index.html';
const lines = fs.readFileSync(P, 'utf8').split(/\r?\n/);
function must(c, m) { if (!c) { console.error('HATA: ' + m); process.exit(1); } }
function findLine(n, from = 0) { for (let i = from; i < lines.length; i++) if (lines[i].includes(n)) return i; return -1; }

/* 1) Bugünkü odak çipi ayarlardan çıkar */
let i = findLine('id="todayFocusChip"');
must(i >= 0, 'todayFocusChip yok');
must(lines[i].includes('settings-meta'), 'chip settings-meta disinda');
lines[i] = lines[i].replace('<span class="stat-chip" id="todayFocusChip">Bugün 0 dk odak</span>', '');
must(!lines[i].includes('todayFocusChip'), 'chip silinemedi');

/* 2) Aynı çip sayaca, "başlamaya hazır" notunun yanına */
let j = findLine('id="catNoteText"');
must(j >= 0, 'catNoteText yok');
lines[j] = lines[j].replace(
  '<span id="catNoteText">Vespır başlamaya hazır</span>',
  '<span id="catNoteText">Vespır başlamaya hazır</span><span class="note-sep" aria-hidden="true">·</span><span class="today-min" id="todayFocusChip">Bugün 0 dk odak</span>'
);
must(lines[j].includes('today-min'), 'cip eklenemedi');

/* 3) Görünüm */
let k = findLine('.cat-note.pulse i {');
must(k >= 0, 'cat-note.pulse yok');
lines.splice(k + 1, 0,
  '.cat-note .note-sep { opacity: .42; margin: 0 1px; line-height: 1; }',
  '.cat-note .today-min { color: var(--accent); font-weight: 800; letter-spacing: .04em; }'
);

/* 4) Sürüm v17 */
let v = findLine("const APP_VERSION = 'v16';");
must(v >= 0, 'APP_VERSION yok');
lines[v] = lines[v].replace("'v16'", "'v17'");
let av = findLine('id="appVersion">v16<');
must(av >= 0, 'appVersion yok');
lines[av] = lines[av].replace('id="appVersion">v16<', 'id="appVersion">v17<');

/* 5) Firebase yükleyicisi */
let click = findLine("if (googleBtn) googleBtn.addEventListener('click', async () => {");
must(click >= 0, 'google dinleyicisi yok');
lines.splice(click, 0,
  '/* Oturum sayfa yenilense de sürsün: Firebase bir kez kurulur, oturum',
  '   tarayıcının yerel deposunda (IndexedDB) kalıcı tutulur ve açılışta',
  '   onAuthStateChanged ile geri yüklenir. Önceden yalnızca giriş butonuna',
  '   basılınca kurulduğu için F5 sonrası oturum yok sayılıyordu. */',
  'let fbLoading = null;',
  'function loadFirebase() {',
  '  if (fbLoading) return fbLoading;',
  '  fbLoading = (async () => {',
  '    const [appMod, authMod] = await Promise.all([',
  "      import('https://www.gstatic.com/firebasejs/13.2.0/firebase-app.js'),",
  "      import('https://www.gstatic.com/firebasejs/13.2.0/firebase-auth.js')",
  '    ]);',
  '    const app = appMod.initializeApp(FB_CFG);',
  '    auth = authMod.getAuth(app);',
  '    fb = authMod;',
  '    try { await authMod.setPersistence(auth, authMod.browserLocalPersistence); } catch (e) {}',
  '    authMod.onAuthStateChanged(auth, paintUser);',
  '    return { auth, authMod };',
  '  })().catch((err) => { fbLoading = null; throw err; });',
  '  return fbLoading;',
  '}'
);

let oldInit = findLine('    if (!fb) {');
must(oldInit >= 0, 'eski Firebase bloğu yok');
must(lines[oldInit + 8] && lines[oldInit + 8].trim() === '}', 'blok kapanışı yanlış yerde');
must(lines.slice(oldInit, oldInit + 8).join('\n').includes('onAuthStateChanged(auth, paintUser)'), 'blok içeriği farklı');
lines.splice(oldInit, 8, '    await loadFirebase();');

/* 6) Açılışta oturumu geri yükle */
let so = findLine("if (signOutBtn) signOutBtn.addEventListener('click', async () => {");
must(so >= 0, 'cikis butonu yok');
lines.splice(so, 0,
  '/* Açılışta oturumu geri yükle: F5 / yenileme sonrası giriş görünür kalır. */',
  'if (!isFile) loadFirebase().catch(() => {});'
);

fs.writeFileSync(P, lines.join('\r\n'), 'utf8');
console.log('index.html güncellendi, satır sayısı:', lines.length);
