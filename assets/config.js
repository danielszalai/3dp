/* ODDFUSE – egyszerű beállítások. Ezt a fájlt szerkeszd fejlesztés / élesítés közben. */
window.ODDFUSE_CONFIG = {

  /* ==========================================================
     SZÍNPALETTA – ITT VÁLTHATSZ (csak fejlesztőként, látogatónak nincs kapcsoló)
       'violet'  →  A: Graphite + Digital Violet
       'mint'    →  B: Graphite + Muted Mint
     A palettákat az assets/palettes.js fájl tartalmazza (részletes útmutató: PALETTA.md).
     ========================================================== */
  palette: 'mint',

  /* A kapcsolatfelvételi űrlap backend címe (a Cloudflare Worker URL-je, lásd a lépésenkénti útmutatót).
     Amíg üres, az űrlap nem küld semmit. */
  formEndpoint: '',

  /* Cloudflare Turnstile PUBLIKUS site key (a secret key sosem kerülhet ide, az csak a workerben van!).
     Amíg üres, a Turnstile widget nem töltődik be. */
  turnstileSiteKey: '',

  /* Hány munka látszik a főoldali portfólióban (ajánlott: 4–8). */
  portfolioLimit: 8,

  /* Max. feltölthető modellfájl mérete MB-ban. A workerben (MAX_FILE_MB) ugyanennek kell lennie.
     Az ingyenes Cloudflare Workers csomagban kérésenként csak 10 ms CPU-idő van, a melléklet kódolása pedig
     CPU-igényes, ezért az 1 MB a biztonságos kiindulópont. Emeléshez lásd a lépésenkénti útmutatót ("Fájlméret"). */
  maxFileMB: 1,

  /* Elérhetőségek (a hibaüzenetekben használja a script; a látható adatok az index.html-ben is szerepelnek). */
  contact: {
    email: 'hello@oddfuse.hu',
    phone: '+36209888098',
    phoneDisplay: '+36 20 988 8098'
  }
};
