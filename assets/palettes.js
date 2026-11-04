/* ODDFUSE – színpaletták.
   Itt van MINDEN színérték az oldalon. A kiválasztott palettát az assets/config.js → palette adja meg.
   Színt hex formában (#RRGGBB) adj meg, a többit a script elintézi.

   Új paletta hozzáadása: másold le az egyik blokkot, adj neki új kulcsot (pl. 'amber'),
   írd át a színeket, majd állítsd be a config.js-ben:  palette: 'amber'

   Biztonsági háló: ha egy színt kihagysz vagy elrontasz (pl. hiányzó # jel), az oldal nem romlik el,
   hanem az adott színnél a 'violet' paletta értékét használja, és a böngésző konzolján figyelmeztetést kapsz.

   Színek jelentése:
     bg       fő háttér
     surface  kártyák, másodlagos felületek
     accent   akcentusszín (gombok, linkek, kiemelések)
     text     fő szövegszín
     muted    halványabb szöveg (leírások, feliratok)
     ticker   a háttérben futó szövegsáv színe (nagyon halvány)
     danger   hibaüzenetek színe
*/
(function () {
  var PALETTES = {
    /* A – Graphite + Digital Violet */
    violet: {
      bg: '#17191A', surface: '#292431', accent: '#B5A0FF',
      text: '#E8E5F0', muted: '#A5A1AD', ticker: '#45494A', danger: '#E58A8A'
    },
    /* B – Graphite + Muted Mint */
    mint: {
      bg: '#1B1E1D', surface: '#303735', accent: '#8DC8B2',
      text: '#E2E7E3', muted: '#A6B0AA', ticker: '#454C49', danger: '#E58A8A'
    }
  };

  var NAMES = ['bg', 'surface', 'accent', 'text', 'muted', 'ticker', 'danger'];
  var HEX = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i;
  function warn(msg) { if (window.console) console.warn('ODDFUSE: ' + msg); }

  var cfg = window.ODDFUSE_CONFIG || {};
  var key = cfg.palette;
  if (!Object.prototype.hasOwnProperty.call(PALETTES, key)) {
    warn('ismeretlen paletta (' + key + '), a "violet" lesz használva.');
    key = 'violet';
  }

  var p = {};
  NAMES.forEach(function (name) {
    var v = PALETTES[key][name];
    if (!HEX.test(String(v))) {
      warn('a(z) "' + key + '" paletta "' + name + '" színe hiányzik vagy hibás (' + v + '), a violet értéke lesz használva.');
      v = PALETTES.violet[name];
    }
    p[name] = v;
  });

  /* '#B5A0FF' -> '181 160 255' (így működik a Tailwind átlátszóságával, pl. bg-accent/10) */
  function channels(hex) {
    var h = String(hex).replace('#', '');
    if (h.length === 3) h = h[0] + h[0] + h[1] + h[1] + h[2] + h[2];
    return parseInt(h.slice(0, 2), 16) + ' ' + parseInt(h.slice(2, 4), 16) + ' ' + parseInt(h.slice(4, 6), 16);
  }

  var root = document.documentElement;
  NAMES.forEach(function (name) { root.style.setProperty('--c-' + name, channels(p[name])); });
  root.setAttribute('data-palette', key);

  var meta = document.querySelector('meta[name="theme-color"]');
  if (meta) meta.setAttribute('content', p.bg);
})();
