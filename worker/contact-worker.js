/**
 * ODDFUSE – kapcsolatfelvételi űrlap backend (Cloudflare Worker)
 *
 * Mit ellenőriz szerveroldalon (ebben a sorrendben):
 *  1. Honeypot mező ("website") – ha kitöltött, csendben eldobja (a bot sikert lát)
 *  2. Kitöltési idő ("elapsed", ezredmásodperc az oldal betöltése óta) – ha 3 mp-nél kevesebb, elutasít
 *  3. Hiányzó beállítások – ha valamelyik Secret/Variable nincs megadva, érthető hibát naplóz
 *  4. Rate limit IP-nként (csak ha a RATE_KV KV namespace be van kötve; különben kimarad)
 *  5. Cloudflare Turnstile token ellenőrzése a Cloudflare siteverify végpontján
 *  6. Mezők validálása (név, e-mail, üzenet), fájl kiterjesztése és mérete
 *  7. Levél kiküldése a Resend API-val (a modellfájl mellékletként)
 *
 * Beállítás (Cloudflare dashboard → Workers & Pages → a Worker → Settings → Variables and Secrets):
 *  Secrets (titkos) : TURNSTILE_SECRET, RESEND_API_KEY
 *  Variables        : TO_EMAIL        – ide érkezik a levél (olyan cím, amit tényleg olvasol)
 *                     FROM_EMAIL      – a Resendben hitelesített domainről, pl.  ODDFUSE <hello@oddfuse.hu>
 *                     ALLOWED_ORIGIN  – KÖTELEZŐ: a weboldalad címe útvonal nélkül, pl. https://oddfuse.hu  (több is lehet vesszővel elválasztva,
 *                                       pl. https://oddfuse.hu,https://felhasznalo.github.io,http://localhost:8000)
 *                     MAX_FILE_MB     – opcionális, alapértelmezett 1 (egyezzen az assets/config.js maxFileMB értékével)
 *  KV (opcionális)  : RATE_KV – rate limithez (Settings → Bindings → KV namespace)
 *
 * Teljes, lépésenkénti útmutató: a hozzá készült útmutató dokumentum (űrlap-beállítás)
 *
 * FIGYELEM: a logikát szimulált szolgáltatásokkal teszteltem, de éles Cloudflare/Resend környezetben nem.
 * Élesítés előtt végezd el az útmutató tesztlépéseit.
 */
const MIN_FILL_MS = 3000;       // ennél gyorsabb kitöltés = valószínűleg bot
const RATE_LIMIT = 5;           // ennyi beküldés...
const RATE_WINDOW_S = 3600;     // ...ennyi másodpercen belül, IP-nként
const DEFAULT_MAX_FILE_MB = 1;  // az ingyenes Workers csomagban kérésenként csak 10 ms CPU-idő van, lásd a lépésenkénti útmutatót

// Base64 kódolás a levélmellékletnek. Ha a futtatókörnyezet támogatja a natív toBase64-et, azt használja
// (gyors); különben egy gyorsított, táblázatos ciklust (kb. 4x gyorsabb, mint a String.fromCharCode + btoa).
const B64 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
const LUT = new Uint8Array(64); for (let i = 0; i < 64; i++) LUT[i] = B64.charCodeAt(i);
function toBase64(bytes) {
  if (typeof bytes.toBase64 === 'function') return bytes.toBase64();
  const n = bytes.length, full = n - (n % 3), out = new Uint8Array(Math.ceil(n / 3) * 4);
  let o = 0, i = 0;
  for (; i < full; i += 3) {
    const v = (bytes[i] << 16) | (bytes[i + 1] << 8) | bytes[i + 2];
    out[o++] = LUT[v >> 18]; out[o++] = LUT[(v >> 12) & 63]; out[o++] = LUT[(v >> 6) & 63]; out[o++] = LUT[v & 63];
  }
  const rem = n - full;
  if (rem === 1) { const v = bytes[i] << 16; out[o++] = LUT[v >> 18]; out[o++] = LUT[(v >> 12) & 63]; out[o++] = 61; out[o++] = 61; }
  else if (rem === 2) { const v = (bytes[i] << 16) | (bytes[i + 1] << 8); out[o++] = LUT[v >> 18]; out[o++] = LUT[(v >> 12) & 63]; out[o++] = LUT[(v >> 6) & 63]; out[o++] = 61; }
  return new TextDecoder().decode(out);
}

export default {
  async fetch(request, env) {
    const allowed = String(env.ALLOWED_ORIGIN || '')
      .split(',').map(s => s.trim().replace(/\/+$/, '')).filter(Boolean);
    const reqOrigin = request.headers.get('Origin');
    const cors = {
      'Access-Control-Allow-Origin': allowed.length ? (allowed.includes(reqOrigin) ? reqOrigin : allowed[0]) : '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Vary': 'Origin'
    };
    const json = (obj, status = 200) =>
      new Response(JSON.stringify(obj), { status, headers: { 'Content-Type': 'application/json', ...cors } });

    try {
      if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: cors });

      // Egészségellenőrzés: a Worker URL-jét böngészőben megnyitva ezt kell látnod
      if (request.method === 'GET') return json({ ok: true, service: 'oddfuse-contact-form' });
      if (request.method !== 'POST') return json({ ok: false, error: 'method_not_allowed' }, 405);

      if (allowed.length && reqOrigin && !allowed.includes(reqOrigin)) return json({ ok: false, error: 'forbidden' }, 403);

      // Túl nagy kérés elutasítása még a feldolgozás előtt (CPU- és memóriatakarékosság)
      const maxMB = Number(env.MAX_FILE_MB) || DEFAULT_MAX_FILE_MB;
      const maxBytes = maxMB * 1048576;
      if (Number(request.headers.get('Content-Length') || 0) > maxBytes + 512 * 1024) {
        return json({ ok: false, error: 'file_too_large' }, 413);
      }

      let form;
      try { form = await request.formData(); } catch { return json({ ok: false, error: 'bad_request' }, 400); }

      // 1) Honeypot – a botnak sikert mutatunk, de nem küldünk semmit
      if (String(form.get('website') || '').trim() !== '') return json({ ok: true });

      // 2) Kitöltési idő
      // (a böngésző a saját órája helyett az eltelt időt küldi, így az óraeltérés nem okoz téves elutasítást)
      const elapsed = Number(form.get('elapsed'));
      if (!Number.isFinite(elapsed) || elapsed < MIN_FILL_MS) return json({ ok: false, error: 'too_fast' }, 400);

      // 3) Hiányzó beállítások (csak a változó NEVÉT naplózzuk, az értékét soha)
      const missing = ['TURNSTILE_SECRET', 'RESEND_API_KEY', 'TO_EMAIL', 'FROM_EMAIL', 'ALLOWED_ORIGIN'].filter(k => !env[k]);
      if (missing.length) {
        console.error('Hiányzó Worker beállítás(ok): ' + missing.join(', '));
        return json({ ok: false, error: 'server_misconfigured' }, 500);
      }

      // 4) Rate limit (ha van KV)
      const ip = request.headers.get('CF-Connecting-IP') || 'unknown';
      if (env.RATE_KV) {
        const key = 'rl:' + ip;
        const count = Number(await env.RATE_KV.get(key)) || 0;
        if (count >= RATE_LIMIT) return json({ ok: false, error: 'rate_limited' }, 429);
        await env.RATE_KV.put(key, String(count + 1), { expirationTtl: RATE_WINDOW_S });
      }

      // 5) Turnstile ellenőrzés (a token egyszer használható és 5 percig érvényes)
      const token = String(form.get('cf-turnstile-response') || '');
      if (!token) return json({ ok: false, error: 'captcha_missing' }, 400);
      const verify = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
        method: 'POST',
        body: new URLSearchParams({ secret: env.TURNSTILE_SECRET, response: token, remoteip: ip })
      }).then(r => r.json()).catch(() => ({ success: false }));
      if (!verify.success) {
        console.warn('Turnstile elutasítva: ' + JSON.stringify(verify['error-codes'] || []));
        return json({ ok: false, error: 'captcha_failed' }, 403);
      }

      // 6) Mezők validálása
      const name = String(form.get('name') || '').replace(/[\r\n\t]+/g, ' ').trim();
      const email = String(form.get('email') || '').trim();
      const message = String(form.get('message') || '').trim();
      if (name.length < 2 || name.length > 100) return json({ ok: false, error: 'invalid_name' }, 400);
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 200) return json({ ok: false, error: 'invalid_email' }, 400);
      if (message.length < 5 || message.length > 5000) return json({ ok: false, error: 'invalid_message' }, 400);

      const attachments = [];
      const file = form.get('file');
      if (file && typeof file === 'object' && file.size > 0) {
        if (!/\.(stl|step|stp)$/i.test(file.name)) return json({ ok: false, error: 'invalid_file_type' }, 400);
        if (file.size > maxBytes) return json({ ok: false, error: 'file_too_large' }, 413);
        const buf = new Uint8Array(await file.arrayBuffer());
        attachments.push({ filename: file.name.replace(/[^\w.\-]/g, '_'), content: toBase64(buf) });
      }

      // 7) Levél küldése (Resend)
      const esc = s => s.replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
      const res = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: { 'Authorization': 'Bearer ' + env.RESEND_API_KEY, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          from: env.FROM_EMAIL,
          to: [env.TO_EMAIL],
          reply_to: email,
          subject: 'ODDFUSE ajánlatkérés – ' + name.slice(0, 60),
          html: `<p><b>Név:</b> ${esc(name)}</p><p><b>E-mail:</b> ${esc(email)}</p><p><b>Üzenet:</b><br>${esc(message).replace(/\r\n|\r|\n/g, '<br>')}</p>`,
          ...(attachments.length ? { attachments } : {})
        })
      });
      if (!res.ok) {
        // A Resend hibaüzenetét naplózzuk (pl. nem hitelesített domain), személyes adat nélkül
        let detail = ''; try { detail = (await res.text()).slice(0, 300); } catch {}
        console.error('Resend hiba ' + res.status + ': ' + detail);
        return json({ ok: false, error: 'mail_failed' }, 502);
      }

      return json({ ok: true });
    } catch (err) {
      console.error('Váratlan hiba: ' + (err && err.message));
      return json({ ok: false, error: 'server_error' }, 500);
    }
  }
};
