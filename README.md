# Save Bhimashankar · भीमाशंकर वाचवा

A scroll story about Bhimashankar Wildlife Sanctuary, its forests, the Shekru and its people, and a petition against the felling of 32,000+ trees at Saidongar (Karjat), next to the sanctuary.

- `src/page.html`: the one template. Each piece of text is written as `[[मराठी||English]]`.
- `python3 build.py` builds `index.html` (Marathi, the main page) and `en/index.html` (English). Edit the template, not the built files.
- `style.css`, `app.js`: styles and scroll engine (parallax, drone footage, species reel, films, petition letter in both languages).
- `video/`: two CC BY 4.0 Western Ghats clips (Mathanprasath K, Wikimedia Commons). Bhimashankar drone films and news reports are YouTube embeds credited to their creators.
- `forest.js`: the Three.js 3D plateau (drone flight, felling simulation, regrowth).
- `img/`: photos from Wikimedia Commons (CC BY / CC BY-SA). Credits are in the page footer and `img/credits.json`.

To link a real petition (Change.org / Google Form), set `PETITION_URL` at the top of `app.js`.

Run locally: `python3 -m http.server` and open http://localhost:8000.

Made with ♥ by [Prateek Kanurkar](https://github.com/KanurkarPrateek).
