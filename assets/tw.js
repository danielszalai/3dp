/* Tailwind (CDN) beállítások – ODDFUSE: Graphite + Digital Violet */
tailwind.config = {
  theme: {
    extend: {
      fontFamily: {
        sans: ['"Space Grotesk"', 'system-ui', 'sans-serif'],
        display: ['"Space Grotesk"', 'system-ui', 'sans-serif'],
        brand: ['Unbounded', '"Space Grotesk"', 'sans-serif']
      },
      colors: {
        ink: '#17191A',     /* fő háttér */
        plum: '#292431',    /* másodlagos háttér, kártyák */
        accent: '#B5A0FF',  /* digital violet */
        bone: '#E8E5F0'     /* fő szövegszín */
      }
    }
  }
};
