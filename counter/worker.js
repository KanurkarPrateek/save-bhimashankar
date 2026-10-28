// Visitor counter for the Save Bhimashankar site.
// POST /hit  -> adds one visitor, returns {count}
// GET  /count -> returns {count}
const CORS = { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Methods": "GET, POST, OPTIONS", "Content-Type": "application/json", "Cache-Control": "no-store" };

export default {
  async fetch(req, env) {
    const url = new URL(req.url);
    if (req.method === "OPTIONS") return new Response(null, { headers: CORS });
    if (url.pathname === "/hit" && req.method === "POST") {
      const row = await env.DB.prepare("UPDATE counter SET n = n + 1 WHERE id = 'visits' RETURNING n").first();
      return Response.json({ count: row?.n ?? 0 }, { headers: CORS });
    }
    if (url.pathname === "/count") {
      const row = await env.DB.prepare("SELECT n FROM counter WHERE id = 'visits'").first();
      return Response.json({ count: row?.n ?? 0 }, { headers: CORS });
    }
    return new Response("Save Bhimashankar visitor counter", { headers: { "Content-Type": "text/plain" } });
  },
};
