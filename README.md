# Save Bhimashankar · भीमाशंकर वाचवा

A phone-first scroll story about Bhimashankar Wildlife Sanctuary, its forests, the Shekru and its people, and a petition against the felling of 32,000+ trees at Saidongar (Karjat), next to the sanctuary.

- `src/page.html`: the one template. Each piece of text is written as `[[मराठी||English]]`. On the Marathi page every `<h2>` also gets a small English line; write `[[+मराठी||English]]` to add one anywhere else.
- `python3 build.py` builds `index.html` (Marathi, the main page) and `en/index.html` (English). Edit the template, not the built files.
- `style.css`, `app.js`: styles and scroll engine (parallax, drone footage, species reel, films, petition letter in both languages).
- `video/`: two CC BY 4.0 Western Ghats clips (Mathanprasath K, Wikimedia Commons). Bhimashankar drone films and news reports are YouTube embeds credited to their creators.
- `forest.js`: the Three.js 3D plateau (drone flight, felling simulation, regrowth).
- Shekru chapter: a large photo with tap-for-facts dots (positions in `data-x`/`data-y`, % of the photo).
- `issue.js`: D3 pieces in the "What exactly is the issue?" chapter and the numbers chapter: location map (satellite relief `img/map-sat.jpg` + OpenStreetMap rivers and sanctuary boundary in `data/map.json`), pumped-storage day/evening diagram, 233-ha size comparison, 1,142 plant-species dots.
- `img/`: photos from Wikimedia Commons (CC BY / CC BY-SA). Credits are in the page footer and `img/credits.json`.

Petition signatures: the form posts to the Worker's `/sign` (origin check, Cloudflare Turnstile, 5 per hour per IP, one per email), which forwards to a private Google Sheet via the Apps Script in `apps-script/Code.gs` (deployed as a web app; the shared key and its URL are Worker secrets).

Visitor counter: `counter/` is a Cloudflare Worker + D1 database (`npx wrangler deploy` from that folder). The page calls it once per browser; localhost visits are not counted.

Facts were checked on 28 Oct 2026 against the official project documents (EAC minutes, EC letter, FAC minutes, MPCB summary, ESZ gazette) linked in the footer.

To link a real petition (Change.org / Google Form), set `PETITION_URL` at the top of `app.js`.

Run locally: `python3 -m http.server` and open http://localhost:8000.

Made with ♥ for the Sahyadri by शिवरायांचा एक जागरूक मावळा.
