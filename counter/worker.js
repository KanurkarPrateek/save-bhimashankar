// Save Bhimashankar: visitor counter + petition signatures.
//
// POST /hit    -> adds one visitor, returns {count}
// GET  /count  -> {count} visitors
// POST /sign   -> checks the request, then forwards it to the Google Sheet (Apps Script)
// GET  /signs  -> {count} signatures
//
// Secrets (wrangler secret put): TURNSTILE_SECRET, SHEET_SECRET, SHEET_URL
// The sheet's URL and key live only here, never in the website's code.

const ALLOWED = ["https://bhimashankar.katyar.com", "https://kanurkarprateek.github.io"];
const LOCAL = /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/;
const TURNSTILE_TEST_SECRET = "1x0000000000000000000000000000000AA"; // Cloudflare's always-pass key, used only for localhost
const PER_HOUR = 5;

function cors(origin) {
  const ok = ALLOWED.includes(origin) || LOCAL.test(origin || "");
  return {
    "Access-Control-Allow-Origin": ok ? origin : ALLOWED[0],
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Content-Type": "application/json",
    "Cache-Control": "no-store",
    Vary: "Origin",
  };
}
const json = (o, h, status = 200) => new Response(JSON.stringify(o), { status, headers: h });
const sha = async s => [...new Uint8Array(await crypto.subtle.digest("SHA-256", new TextEncoder().encode(s)))].map(b => b.toString(16).padStart(2, "0")).join("");
const txt = (v, n) => String(v ?? "").replace(/[\u0000-\u001f]/g, " ").trim().slice(0, n);

async function count(env, id) {
  const row = await env.DB.prepare("SELECT n FROM counter WHERE id = ?").bind(id).first();
  return row?.n ?? 0;
}

async function sign(req, env, h) {
  const origin = req.headers.get("Origin") || "";
  const local = LOCAL.test(origin);
  if (!ALLOWED.includes(origin) && !local) return json({ ok: false, error: "origin" }, h, 403);

  let b;
  try { b = await req.json(); } catch { return json({ ok: false, error: "bad" }, h, 400); }
  if (b.website) return json({ ok: true, count: await count(env, "signs") }, h);     // honeypot: pretend it worked

  const name = txt(b.name, 80), city = txt(b.city, 60), email = txt(b.email, 120).toLowerCase(), why = txt(b.why, 400);
  const lang = b.lang === "en" ? "en" : "mr";
  if (name.length < 2 || city.length < 2) return json({ ok: false, error: "fields" }, h, 400);
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) return json({ ok: false, error: "email" }, h, 400);

  // human check (Cloudflare Turnstile)
  const ip = req.headers.get("CF-Connecting-IP") || "";
  const tv = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
    method: "POST",
    body: new URLSearchParams({ secret: local ? TURNSTILE_TEST_SECRET : env.TURNSTILE_SECRET, response: String(b.token || ""), remoteip: ip }),
  }).then(r => r.json()).catch(() => ({ success: false }));
  if (!tv.success) return json({ ok: false, error: "human" }, h, 403);

  // rate limit per device/IP, stored only as a hash
  const ipHash = (await sha("ip:" + ip)).slice(0, 32), now = Date.now();
  await env.DB.prepare("DELETE FROM hits WHERE ts < ?").bind(now - 3600e3).run();
  const recent = await env.DB.prepare("SELECT COUNT(*) AS c FROM hits WHERE ip = ?").bind(ipHash).first();
  if ((recent?.c ?? 0) >= PER_HOUR) return json({ ok: false, error: "slow" }, h, 429);
  await env.DB.prepare("INSERT INTO hits (ip, ts) VALUES (?, ?)").bind(ipHash, now).run();

  // one signature per email
  if (email) {
    const res = await env.DB.prepare("INSERT OR IGNORE INTO signers (email) VALUES (?)").bind(await sha("em:" + email)).run();
    if (!res.meta.changes) return json({ ok: true, duplicate: true, count: await count(env, "signs") }, h);
  }

  if (!env.SHEET_URL) return json({ ok: false, error: "sheet-not-set" }, h, 503);
  const sheet = await fetch(env.SHEET_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ secret: env.SHEET_SECRET, name, city, email, why, lang, country: req.cf?.country || "" }),
    redirect: "follow",
  }).then(r => r.json()).catch(() => ({ ok: false }));
  if (!sheet.ok) return json({ ok: false, error: "sheet" }, h, 502);

  const row = await env.DB.prepare("UPDATE counter SET n = n + 1 WHERE id = 'signs' RETURNING n").first();
  return json({ ok: true, count: row?.n ?? 0 }, h);
}

export default {
  async fetch(req, env) {
    const url = new URL(req.url), h = cors(req.headers.get("Origin"));
    if (req.method === "OPTIONS") return new Response(null, { headers: h });
    if (url.pathname === "/hit" && req.method === "POST") {
      const row = await env.DB.prepare("UPDATE counter SET n = n + 1 WHERE id = 'visits' RETURNING n").first();
      return json({ count: row?.n ?? 0 }, h);
    }
    if (url.pathname === "/count") return json({ count: await count(env, "visits") }, h);
    if (url.pathname === "/signs") return json({ count: await count(env, "signs") }, h);
    if (url.pathname === "/sign" && req.method === "POST") return sign(req, env, h);
    return new Response("Save Bhimashankar", { headers: { "Content-Type": "text/plain" } });
  },
};
