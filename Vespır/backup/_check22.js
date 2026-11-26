const fs = require('fs');
const vm = require('vm');
const html = fs.readFileSync('C:/Users/Asus/Desktop/Vespır/index.html', 'utf8');
const re = /<script([^>]*)>([\s\S]*?)<\/script>/gi;
let m, i = 0, bad = 0;
while ((m = re.exec(html))) {
  const attrs = m[1] || '';
  const body = m[2];
  if (/\bsrc=/.test(attrs)) continue;
  if (/type="module"/.test(attrs)) { i++; continue; } // module: sadece sayım
  i++;
  try { new vm.Script(body, { filename: 'block' + i + '.js' }); }
  catch (e) { bad++; console.log('SYNTAX FAIL block ' + i + ': ' + e.message); }
}
console.log('inline blocks checked: ' + i + ', failures: ' + bad);
try { new vm.Script(fs.readFileSync('C:/Users/Asus/Desktop/Vespır/sw.js', 'utf8'), { filename: 'sw.js' }); console.log('sw.js OK'); }
catch (e) { bad++; console.log('sw.js FAIL: ' + e.message); }
process.exit(bad ? 1 : 0);
