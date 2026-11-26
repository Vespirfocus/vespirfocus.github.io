const fs = require('fs');
const path = require('path');
const root = 'C:/Users/Asus/Desktop/Vespır';
let html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const norm = (s) => s.replace(/\r\n/g, '\n').replace(/\n/g, '\r\n');
let n = 0;
function rep(label, a, b) {
  const A = norm(a), B = norm(b);
  if (!html.includes(A)) throw new Error('MISSING: ' + label);
  if (html.split(A).length - 1 !== 1) throw new Error('AMBIGUOUS: ' + label);
  html = html.split(A).join(B); n++; console.log('ok  ' + label);
}

rep('persistence fallback + log',
`    /* Kalıcılık, dinleyiciler bağlanmadan önce ayarlanır: oturum IndexedDB'de
       kalır ve sayfa yenilense de onAuthStateChanged ile geri gelir. */
    try { await authMod.setPersistence(auth, authMod.browserLocalPersistence); } catch (e) {}
    try { auth.languageCode = en() ? 'en' : 'tr'; } catch (e) {}
    authMod.onAuthStateChanged(auth, (next) => {
      authReady = true;
      paintUser(next);
    });`,
`    /* Kalıcılık, dinleyiciler bağlanmadan önce ayarlanır: oturum IndexedDB'de
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
        console.info('[Vespir] oturum', next && next.email ? next.email : 'yok', '· kalıcılık:', persistence);
        if (console.table && next) console.table([{ email: next.email, uid: next.uid, kalıcılık: persistence }]);
      } catch (e) {}
      paintUser(next);
    });`);

fs.writeFileSync(path.join(root, 'index.html'), html);
console.log('index.html: ' + n + ' düzeltme');
