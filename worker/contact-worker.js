/**
 * ODDFUSE – kapcsolatfelvételi űrlap backend (Cloudflare Worker)
 *
 * Mit ellenőriz szerveroldalon:
 *  1. Honeypot mező ("website") – ha kitöltött, csendben eldobja
 *  2. Időzítés ("ts") – túl gyors beküldés esetén elutasít
 *  3. Cloudflare Turnstile token ellenőrzése a Cloudflare siteverify végpontján
 *  4. Mezők validálása (név, e-mail, üzenet hossza), fájl kiterjesztése és mérete
 *  5. Egyszerű rate limit IP-nként (ha a RATE_KV KV namespace be van kötve)
 *  6. Levél kiküldése a Resend API-val (opcionális mellékletként a modellfájl)
 *
 * Beállítás (Cloudflare dashboard → Workers → Settings → Variables / Secrets):
 *  Secrets : TURNSTILE_SECRET, RESEND_API_KEY
 *  Vars    : TO_EMAIL, FROM_EMAIL (a Resendben hitelesített küldő), ALLOWED_ORIGIN (pl. https://oddfuse.hu),
 *            MAX_FILE_MB (alapértelmezett 20 – egyezzen az assets/config.js maxFileMB értékével)
 *  KV      : RATE_KV (opcionális, rate limithez)
 *
 * FIGYELEM: ez egy kiindulási példa, éles használat előtt tesztelni kell a saját környezetedben.
 */
const MIN_FILL_MS = 3000;
const RATE_LIMIT = 5;          // ennyi beküldés...
const RATE_WINDOW_S = 3600;    // ...ennyi másodpercen belül, IP-nként

export default {
  async fetch(request, env) {
    const origin = env.ALLOWED_ORIGIN || '*';
    const cors = {
      'Access-Control-Allow-Origin': origin,
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Vary': 'Origin'
    };
    const json = (obj, status = 200) =>
      new Response(JSON.stringify(obj), { status, headers: { 'Content-Type': 'application/json', ...cors } });

    if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: cors });
    if (request.method !== 'POST') return json({ ok: false, error: 'method_not_allowed' }, 405);

    const reqOrigin = request.headers.get('Origin');
    if (env.ALLOWED_ORIGIN && reqOrigin && reqOrigin !== env.ALLOWED_ORIGIN) return json({ ok: false, error: 'forbidden' }, 403);

    let form;
    try { form = await request.formData(); } catch { return json({ ok: false, error: 'bad_request' }, 400); }

    // 1) Honeypot – botnak sikert mutatunk, de nem küldünk semmit
    if ((form.get('website') || '').toString().trim() !== '') return json({ ok: true });

    // 2) Időzítés
    const ts = Number(form.get('ts'));
    if (!ts || Date.now() - ts < MIN_FILL_MS) return json({ ok: false, error: 'too_fast' }, 400);

    // 3) Rate limit (ha van KV)
    const ip = request.headers.get('CF-Connecting-IP') || 'unknown';
    if (env.RATE_KV) {
      const key = 'rl:' + ip;
      const count = Number(await env.RATE_KV.get(key)) || 0;
      if (count >= RATE_LIMIT) return json({ ok: false, error: 'rate_limited' }, 429);
      await env.RATE_KV.put(key, String(count + 1), { expirationTtl: RATE_WINDOW_S });
    }

    // 4) Turnstile ellenőrzés
    const token = (form.get('cf-turnstile-response') || '').toString();
    if (!token) return json({ ok: false, error: 'captcha_missing' }, 400);
    const verify = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      method: 'POST',
      body: new URLSearchParams({ secret: env.TURNSTILE_SECRET || '', response: token, remoteip: ip })
    }).then(r => r.json()).catch(() => ({ success: false }));
    if (!verify.success) return json({ ok: false, error: 'captcha_failed' }, 403);

    // 5) Mezők validálása
    const name = (form.get('name') || '').toString().trim();
    const email = (form.get('email') || '').toString().trim();
    const message = (form.get('message') || '').toString().trim();
    if (name.length < 2 || name.length > 100) return json({ ok: false, error: 'invalid_name' }, 400);
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 200) return json({ ok: false, error: 'invalid_email' }, 400);
    if (message.length < 5 || message.length > 5000) return json({ ok: false, error: 'invalid_message' }, 400);

    const attachments = [];
    const file = form.get('file');
    if (file && typeof file === 'object' && file.size > 0) {
      const maxBytes = (Number(env.MAX_FILE_MB) || 20) * 1048576;
      if (!/\.(stl|step|stp)$/i.test(file.name)) return json({ ok: false, error: 'invalid_file_type' }, 400);
      if (file.size > maxBytes) return json({ ok: false, error: 'file_too_large' }, 413);
      const buf = new Uint8Array(await file.arrayBuffer());
      let bin = ''; for (let i = 0; i < buf.length; i += 0x8000) bin += String.fromCharCode(...buf.subarray(i, i + 0x8000));
      attachments.push({ filename: file.name.replace(/[^\w.\-]/g, '_'), content: btoa(bin) });
    }

    // 6) Levél küldése (Resend)
    const esc = s => s.replace(/[&<>"']/g, c => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[c]));
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { 'Authorization': 'Bearer ' + env.RESEND_API_KEY, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from: env.FROM_EMAIL,
        to: [env.TO_EMAIL],
        reply_to: email,
        subject: 'ODDFUSE ajánlatkérés – ' + name.slice(0, 60),
        html: `<p><b>Név:</b> ${esc(name)}</p><p><b>E-mail:</b> ${esc(email)}</p><p><b>Üzenet:</b><br>${esc(message).replace(/\n/g, '<br>')}</p>`,
        ...(attachments.length ? { attachments } : {})
      })
    });
    if (!res.ok) return json({ ok: false, error: 'mail_failed' }, 502);

    return json({ ok: true });
  }
};
