/* A products.json és portfolio.json tartalmát beírja az assets/fallback.js fájlba.
   Erre csak azért van szükség, hogy az oldal akkor is mutassa az adatokat, ha az index.html
   dupla kattintással (file://) van megnyitva. Éles tárhelyen a .json fájlok töltődnek be.
   Futtatás: node tools/sync-fallback.js */
const fs = require('fs'), path = require('path');
const root = path.join(__dirname, '..');
const strip = o => { const c = { ...o }; delete c._help; return c; };
const data = {
  products: strip(JSON.parse(fs.readFileSync(path.join(root, 'products.json'), 'utf8'))),
  portfolio: strip(JSON.parse(fs.readFileSync(path.join(root, 'portfolio.json'), 'utf8')))
};
const out = '/* AUTOMATIKUSAN GENERÁLT – ne szerkeszd, futtasd: node tools/sync-fallback.js */\n' +
  'window.ODDFUSE_FALLBACK = ' + JSON.stringify(data) + ';\n';
fs.writeFileSync(path.join(root, 'assets', 'fallback.js'), out);
console.log('assets/fallback.js frissítve');
