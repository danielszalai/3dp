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
    },
     /* C – Graphite + Amber */
   amber: {
     bg: '#1A1815', surface: '#2E2A24', accent: '#E0B15A',
     text: '#EDE8DF', muted: '#ADA698', ticker: '#4A4740', danger: '#E58A8A'
    },
     /* D – Graphite + Electric Blue */
blue: {
  bg: '#171A1D', surface: '#252D35', accent: '#63B8FF',
  text: '#E6EDF3', muted: '#9CAAB8', ticker: '#414C56', danger: '#E58A8A'
},
     /* E – Graphite + Burnt Orange */
orange: {
  bg: '#1C1917', surface: '#302722', accent: '#F29A65',
  text: '#F1E8E2', muted: '#B3A49A', ticker: '#51433B', danger: '#E58A8A'
},
     /* F – Graphite + Acid Yellow */
yellow: {
  bg: '#191A17', surface: '#2C2D25', accent: '#E5E66B',
  text: '#ECEDE3', muted: '#A9AA9A', ticker: '#48493D', danger: '#E58A8A'
},
     /* G – Graphite + Rust Red */
rust: {
  bg: '#1B1818', surface: '#302525', accent: '#D98272',
  text: '#EFE5E3', muted: '#B1A09D', ticker: '#4D3C3A', danger: '#E58A8A'
},
     /* H – Graphite + Ice Cyan */
cyan: {
  bg: '#171B1C', surface: '#273133', accent: '#85D5D5',
  text: '#E3EEEE', muted: '#A0B3B4', ticker: '#425052', danger: '#E58A8A'
},
     /* I – Deep Midnight + Neon Indigo */
midnight: {
  bg: '#0D0F1A', surface: '#1A1D2E', accent: '#7A6CFF',
  text: '#E6E8FF', muted: '#9AA0C3', ticker: '#343852', danger: '#E58A8A'
},
     
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
