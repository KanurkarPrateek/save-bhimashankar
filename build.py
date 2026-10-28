"""Builds index.html (Marathi) and en/index.html (English) from src/page.html.
In the template, [[मराठी||English]] holds both languages side by side.
[[+मराठी||English]] works like a normal pair (it can add English subtitles if GLOSS is turned on)."""
import re, pathlib, hashlib, json, html as H
root = pathlib.Path(__file__).parent
tpl = (root / "src/page.html").read_text()
GH = ('<svg viewBox="0 0 16 16" width="18" height="18"><path fill="currentColor" d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z"/></svg>')
pair = re.compile(r"\[\[(.*?)\|\|(.*?)\]\]", re.S)
# Optional (off): the Marathi page can keep a little English: every <h2> made of one pair, and any
# pair written [[+मराठी||English]], gets a small English line (class "gl").
GLOSS = False  # Marathi page is pure Marathi; English lives on en/
h2pair = re.compile(r"(<h2[^>]*>)\[\[(.*?)\|\|(.*?)\]\](</h2>)", re.S)
plus = re.compile(r"\[\[\+(.*?)\|\|(.*?)\]\]", re.S)
strip = lambda s: re.sub(r"<[^>]+>", "", s).strip()
gloss = lambda en: f'<span class="gl" lang="en">{strip(en)}</span>'

SITE = "https://bhimashankar.katyar.com/"
plain = lambda t: H.unescape(re.sub(r"<[^>]+>", "", t)).strip()

def alt_text(html):
    """Fill empty alt="" from the nearby caption or card title, so photos show up in image search."""
    def fig(m):
        cap = plain(m.group(3))
        return m.group(1) + 'alt="' + H.escape(cap, quote=True) + '"' + m.group(2) + m.group(3)
    html = re.sub(r'(<img [^>]*?)alt=""([^>]*>(?:(?!</figure>|<img |<section|<figure).)*?<figcaption>)(.*?)(?=</figcaption>)', fig, html, flags=re.S)
    def card(m):
        title = plain(m.group(3))
        return m.group(1) + 'alt="' + H.escape(title, quote=True) + '"' + m.group(2) + m.group(3)
    html = re.sub(r'(<img [^>]*?)alt=""([^>]*>(?:(?!</article>|</div></div>|<img |<section|<figure).)*?<h3>)(.*?)(?=</h3>)', card, html, flags=re.S)
    return html

def jsonld(html, lang):
    url = SITE + ("" if lang == "mr" else "en/")
    title = plain(re.search(r"<title>(.*?)</title>", html, re.S).group(1))
    desc = re.search(r'<meta name="description" content="(.*?)">', html, re.S).group(1)
    faqs = [{"@type": "Question", "name": plain(q), "acceptedAnswer": {"@type": "Answer", "text": plain(a)}}
            for q, a in re.findall(r"<details><summary>(.*?)</summary><p>(.*?)</p></details>", html, re.S)]
    sanctuary = {"@type": ["Place", "TouristAttraction"], "@id": SITE + "#sanctuary",
        "name": "भीमाशंकर वन्यजीव अभयारण्य" if lang == "mr" else "Bhimashankar Wildlife Sanctuary",
        "alternateName": ["Bhimashankar Wildlife Sanctuary", "भीमाशंकर अभयारण्य", "Bhimashankar"],
        "geo": {"@type": "GeoCoordinates", "latitude": 19.072, "longitude": 73.536},
        "address": {"@type": "PostalAddress", "addressRegion": "Maharashtra", "addressCountry": "IN"},
        "sameAs": ["https://en.wikipedia.org/wiki/Bhimashankar_Wildlife_Sanctuary"]}
    site_ = {"@type": "Place", "name": "Saidongar, Karjat" if lang == "en" else "सैदोंगर, कर्जत",
        "geo": {"@type": "GeoCoordinates", "latitude": 18.907, "longitude": 73.418}}
    graph = [
        {"@type": "WebSite", "@id": SITE + "#website", "url": SITE, "name": "भीमाशंकर वाचवा · Save Bhimashankar", "inLanguage": ["mr", "en"]},
        {"@type": "Article", "@id": url + "#article", "mainEntityOfPage": url, "url": url, "inLanguage": lang,
         "headline": title[:110], "description": desc, "image": [SITE + f"img/og-{lang}.jpg", SITE + "img/x/shekru-hanging.jpg", SITE + "img/hero.jpg"],
         "datePublished": "2026-10-27T09:00:00+05:30", "dateModified": "2026-10-28T22:00:00+05:30",
         "author": {"@type": "Person", "name": "शिवरायांचा एक जागरूक मावळा"},
         "publisher": {"@type": "Organization", "name": "भीमाशंकर वाचवा · Save Bhimashankar", "email": "bhimashankar@katyar.com", "logo": {"@type": "ImageObject", "url": SITE + "icon-512.png"}},
         "about": [sanctuary, site_, {"@type": "Thing", "name": "Shekru (Indian giant squirrel, Ratufa indica)", "sameAs": "https://en.wikipedia.org/wiki/Indian_giant_squirrel"}],
         "keywords": re.search(r'<meta name="keywords" content="(.*?)">', html).group(1)},
    ]
    if faqs: graph.append({"@type": "FAQPage", "@id": url + "#faq", "inLanguage": lang, "mainEntity": faqs})
    return '<script type="application/ld+json">' + json.dumps({"@context": "https://schema.org", "@graph": graph}, ensure_ascii=False) + "</script>"

for lang, out, R in [("mr", "index.html", ""), ("en", "en/index.html", "../")]:
    html = tpl
    if lang == "mr":
        if GLOSS:
            html = h2pair.sub(lambda m: f"{m[1]}{m[2]}{gloss(m[3])}{m[4]}", html)
            html = plus.sub(lambda m: f"{m[1]}{gloss(m[2])}", html)
        else:
            html = plus.sub(lambda m: m[1], html)
        html = pair.sub(lambda m: m[1], html)
    else:
        html = plus.sub(lambda m: m[2], html)
        html = pair.sub(lambda m: m[2], html)
    on = ' class="on" aria-current="page"'
    html = (html.replace("{{LANG}}", lang).replace("{{R}}", R).replace("{{GH}}", GH)
                .replace("{{MR_ON}}", on if lang == "mr" else "").replace("{{EN_ON}}", on if lang == "en" else ""))
    html = alt_text(html)
    html = html.replace("{{JSONLD}}", jsonld(html, lang))
    # cache-busting: bump ?v= whenever a file changes so browsers never use a stale copy
    for f in ["style.css", "app.js", "issue.js", "forest.js"]:
        v = hashlib.md5((root / f).read_bytes()).hexdigest()[:8]
        html = html.replace(f'{R}{f}"', f'{R}{f}?v={v}"')
    assert "[[" not in html and "||" not in html and "{{" not in html, f"leftover template marks in {lang}"
    p = root / out; p.parent.mkdir(exist_ok=True); p.write_text(html)
    print("built", out, len(html))
