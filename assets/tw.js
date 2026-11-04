/* Tailwind (CDN) beállítások – a színek CSS változókból jönnek (assets/palettes.js tölti ki őket) */
tailwind.config = {
  theme: {
    extend: {
      fontFamily: {
        sans: ['"Space Grotesk"', 'system-ui', 'sans-serif'],
        display: ['"Space Grotesk"', 'system-ui', 'sans-serif'],
        brand: ['Unbounded', '"Space Grotesk"', 'sans-serif']
      },
      colors: {
        ink:     'rgb(var(--c-bg) / <alpha-value>)',       /* fő háttér */
        surface: 'rgb(var(--c-surface) / <alpha-value>)',  /* kártyák */
        accent:  'rgb(var(--c-accent) / <alpha-value>)',   /* akcentus */
        bone:    'rgb(var(--c-text) / <alpha-value>)',     /* fő szöveg */
        muted:   'rgb(var(--c-muted) / <alpha-value>)',    /* halvány szöveg */
        danger:  'rgb(var(--c-danger) / <alpha-value>)'    /* hiba */
      }
    }
  }
};
