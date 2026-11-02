/* ODDFUSE – egyszerű beállítások. Ezt a fájlt szerkeszd, ha élesítesz. */
window.ODDFUSE_CONFIG = {
  /* A kapcsolatfelvételi űrlap backend címe (lásd worker/contact-worker.js).
     Amíg üres, az űrlap nem küld semmit. */
  formEndpoint: '',

  /* Cloudflare Turnstile PUBLIKUS site key (a secret key csak a workerben van!).
     Amíg üres, a Turnstile widget nem töltődik be. */
  turnstileSiteKey: '',

  /* Hány munka látszik a főoldali portfólióban (ajánlott: 4–8). */
  portfolioLimit: 8,

  /* Max. feltölthető modellfájl mérete MB-ban (a workerben is ellenőrizve van). */
  maxFileMB: 20
};
