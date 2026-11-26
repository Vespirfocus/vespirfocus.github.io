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

rep('firebase app reuse',
`    const app = appMod.initializeApp(FB_CFG);
    auth = authMod.getAuth(app);`,
`    /* Yeniden denemede aynı uygulamayı ikinci kez kurmayalım. */
    const app = appMod.getApps && appMod.getApps().length ? appMod.getApp() : appMod.initializeApp(FB_CFG);
    auth = authMod.getAuth(app);`);

rep('overlay for existing users',
`  if (!seen) { try { localStorage.setItem(KEY, version); } catch (e) {} return; }`,
`  if (!seen) {
    /* Daha önce Vespır kullanılmışsa (yerel ayar kaydı varsa) bu bir güncelleme:
       yenilikler bir kez gösterilir. İlk ziyarette ekran açılmaz. */
    let usedBefore = false;
    try { usedBefore = !!localStorage.getItem('vespir.v1'); } catch (e) {}
    if (!usedBefore) { try { localStorage.setItem(KEY, version); } catch (e) {} return; }
    seen = 'v0';
  }`);

fs.writeFileSync(path.join(root, 'index.html'), html);
console.log('index.html: ' + n + ' düzeltme');
