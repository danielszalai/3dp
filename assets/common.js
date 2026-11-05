/* ODDFUSE – közös segédfüggvények (főoldal + portfólió aloldal) */
(function () {
  const $ = (s, r = document) => r.querySelector(s);
  const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[c]));

  /* Adatbetöltés: először a .json fájl, ha az nem elérhető (pl. file://), a beépített tartalék */
  async function loadData(name) {
    try {
      const r = await fetch(name + '.json', { cache: 'no-cache' });
      if (!r.ok) throw new Error(r.status);
      return await r.json();
    } catch (e) {
      const fb = window.ODDFUSE_FALLBACK && window.ODDFUSE_FALLBACK[name];
      if (fb) return fb;
      throw e;
    }
  }

  /* Generált "rétegminta" illusztráció – akkor jelenik meg, ha egy projekthez/termékhez még nincs fotó.
     Nem stockfotó: a nyomtatott rétegeket idézi. profile = forma (0–7), variant = 0–2 (rétegsűrűség). */
  const PROFILES = [
    t => 0.5 + 0.4 * Math.sin(Math.PI * t),
    t => 0.22 + 0.78 * t,
    t => Math.max(.15, Math.sqrt(1 - Math.pow(1 - t, 2))),
    t => [0.4, 0.6, 0.8, 1][Math.min(3, Math.floor(t * 4))],
    t => 0.3 + 0.7 * Math.abs(2 * t - 1),
    t => t < 0.35 ? 0.45 : 0.95,
    t => 0.7 + 0.06 * Math.sin(t * 26),
    t => Math.min(1, 0.45 + t * 6) * 0.9
  ];
  function layerArt(profile = 0, variant = 0, fit = 'slice') {
    const W = 400, top = 70, bottom = 430, maxW = 250;
    const n = [52, 30, 84][variant % 3];
    const f = PROFILES[Math.abs(profile) % PROFILES.length];
    const step = (bottom - top) / n;
    let out = '';
    for (let i = 0; i < n; i++) {
      const t = i / (n - 1);
      const w = Math.max(18, f(t) * maxW);
      const y = top + i * step;
      const op = (0.28 + 0.6 * Math.pow(1 - t * 0.55, 1.4)) * (i % 2 ? 0.88 : 1);
      out += `<rect x="${((W - w) / 2).toFixed(1)}" y="${y.toFixed(1)}" width="${w.toFixed(1)}" height="${(step * .74).toFixed(1)}" rx="${(step * .3).toFixed(1)}" style="fill:rgb(var(--c-accent))" fill-opacity="${op.toFixed(2)}"/>`;
    }
    out += `<rect x="70" y="${bottom + 6}" width="260" height="6" rx="3" style="fill:rgb(var(--c-text))" fill-opacity=".14"/>`;
    return `<svg viewBox="0 0 400 500" preserveAspectRatio="xMidYMid ${fit}" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">${out}</svg>`;
  }

  /* Portfólió kártya (a főoldalon és az aloldalon is ugyanez) */
  function projectCard(p) {
    const img = p.images && p.images[0];
    const media = img
  ? (p.imageFit === 'contain'
      /* B) teljes kép középen, mögötte ugyanaz a kép elmosva kitölti a kártyát */
      ? `<img src="${esc(img)}" alt="" aria-hidden="true" loading="lazy" class="absolute inset-0 h-full w-full scale-110 object-cover opacity-60 blur-xl" />
         <img src="${esc(img)}" alt="${esc(p.title)}" loading="lazy" class="relative h-full w-full object-contain" />`
      /* A) kitöltő kép, a kivágás helyét te választod */
      : `<img src="${esc(img)}" alt="${esc(p.title)}" loading="lazy" class="h-full w-full object-cover" style="object-position:${esc(p.imagePosition || 'center')}" />`)
  : layerArt(p.profile ?? 0, 0, 'slice');
    return `
      <a href="portfolio.html?id=${encodeURIComponent(p.id)}" class="reveal card glass group relative block aspect-[4/5] overflow-hidden rounded-2xl" aria-label="${esc(p.title)} – részletek">
        <div class="art-wrap absolute inset-0 transition duration-700 group-hover:scale-105">${media}</div>
        <div class="absolute inset-0 bg-gradient-to-t from-ink/90 via-ink/15 to-transparent"></div>
        ${img ? '' : '<span class="glass-strong absolute right-3 top-3 rounded-full px-2.5 py-1 text-[10px] uppercase tracking-widest text-muted">Fotó hamarosan</span>'}
        <div class="absolute inset-x-0 bottom-0 p-4 sm:p-5">
          <span class="text-[11px] uppercase tracking-widest text-accent">${esc(p.category)}</span>
          <h3 class="mt-1 font-display text-base sm:text-lg font-semibold leading-snug">${esc(p.title)}</h3>
          <span class="mt-2 inline-flex items-center gap-1 text-xs text-muted transition group-hover:text-accent">Részletek <span aria-hidden="true">→</span></span>
        </div>
      </a>`;
  }

  /* Belépő animációk */
  const io = 'IntersectionObserver' in window
    ? new IntersectionObserver(es => es.forEach(en => { if (en.isIntersecting) { en.target.classList.add('in'); io.unobserve(en.target); } }), { threshold: .12 })
    : null;
  function observeReveals() {
    document.querySelectorAll('.reveal:not(.in)').forEach(el => io ? io.observe(el) : el.classList.add('in'));
  }

  /* Navbar mobilmenü + évszám (mindkét oldalon azonos) */
  function initChrome() {
    const btn = $('#menuBtn'), menu = $('#mobileMenu');
    if (btn && menu) {
      btn.onclick = () => { const open = menu.classList.toggle('hidden') === false; btn.setAttribute('aria-expanded', open); };
      menu.querySelectorAll('a').forEach(a => a.onclick = () => menu.classList.add('hidden'));
    }
    const y = $('#year'); if (y) y.textContent = new Date().getFullYear();
  }

  Object.assign(window, { $, esc, loadData, layerArt, projectCard, observeReveals, initChrome });
})();
