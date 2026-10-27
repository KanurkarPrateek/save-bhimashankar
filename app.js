/* Save Bhimashankar — scroll story controller */

// Paste a Change.org / Google Form link here and the Sign button will open it.
const PETITION_URL = "";
const LANG = document.documentElement.lang === "en" ? "en" : "mr";
const MR = LANG === "mr";
const SITE_URL = location.origin + location.pathname.replace(/en\/(index\.html)?$/, "");

const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const ease = t => t * t * (3 - 2 * t);

/* ---------- photo credits (CC licences need attribution) ---------- */
const CREDITS = [
  ["Sahyadri range at Bhimashankar", "Rohit Sharma", "CC BY-SA 4.0", "Sahyadri_Range_at_Bhimashankar,_Maharashtra,_India.jpg"],
  ["Western Ghats near Bhimashankar", "Glasreifen", "CC BY-SA 4.0", "India2012_Maharashtra_WesternGhats_Bhimashankar_landscape.jpg"],
  ["Monsoon landscapes, sunrise, sunset, mantis", "Nikhil More", "CC BY-SA 4.0", "Monsoon_Maharashtra_India_Rain_Landscape_(1)_05.jpg"],
  ["Indian giant squirrel (R. i. elphinstonei)", "gailhampshire", "CC BY 2.0", "Indian_Giant_Squirrel._Ratufa_indica_elphenstoni_-_Flickr_-_gailhampshire.jpg"],
  ["Malabar grey hornbill (Kerala)", "Ganesh Mohan T", "CC BY-SA 4.0", "Malabar_Grey_Hornbill_01.jpg"],
  ["Malabar whistling thrush (Raigad)", "Shantanu Kuveskar", "CC BY-SA 4.0", "Malabar_whistling_thrush_(Myophonus_horsfieldii)_by_Shantanu_Kuveskar.jpg"],
  ["Pit viper habitat, Bhimashankar", "Nikhil More", "CC BY-SA 4.0", "Nikhil_More_bamboo_pit_viper_bhimashankar.jpg"],
  ["Bhimashankar temple", "Mechatron00", "CC BY-SA 4.0", "Bhimashankar_temple_front.jpg"],
  ["Litsea josephii", "Dinesh Valke", "CC BY-SA 2.0", "Litsea_josephii_(6325643187).jpg"],
  ["Trek route", "Rupelh", "CC BY-SA 4.0", "Bhimashankar_trekking.jpg"],
  ["Herbs at Bhimashankar", "Akshat.saxena21", "CC BY-SA 4.0", "Herbs_at_Bhimashankar.jpg"],
  ["Early morning, Bhimashankar", "Shubhamtakode", "CC BY-SA 4.0", "Bhimashankar_Wildlife_Reserve.jpg"],
];
$("#credits").innerHTML = CREDITS.map(([t, a, l, f]) =>
  `<li><a href="https://commons.wikimedia.org/wiki/File:${encodeURIComponent(f)}" target="_blank" rel="noopener">${t}</a> — ${a}, ${l}</li>`).join("") +
  `<li><a href="https://commons.wikimedia.org/wiki/File:From_the_mountain_high,_the_forest_stretches_like_a_green_ocean,_kissed_by_mist_and_rain_%E2%80%94_a_silent_breath_of_nature,_and_continue_with_move_on.webm" target="_blank" rel="noopener">${MR ? "पश्चिम घाट — व्हिडिओ" : "Western Ghats — video"}</a> &amp; <a href="https://commons.wikimedia.org/wiki/File:Wandering_through_the_greenish_forest,_I_follow_an_unknown_path_where_every_leaf_hides_a_secret_and_every_step_feels_like_discovery.webm" target="_blank" rel="noopener">${MR ? "जंगलातील पायवाट" : "forest path"}</a> — Mathanprasath K, CC BY 4.0</li>` +
  `<li>${MR ? "सर्व छायाचित्रे Wikimedia Commons वरून, आकार बदलून. परवाना" : "All via Wikimedia Commons, resized. Licences"}: <a href="https://creativecommons.org/licenses/by-sa/4.0/" target="_blank" rel="noopener">CC BY-SA 4.0</a>.</li>` +
  `<li>${MR ? "YouTube चित्रफिती त्यांच्या निर्मात्यांच्या: kelvin santarita, Maharashtra Forest, Daily life, DocTourer Shashvat, Akash Thakur, Kaivalya_yatri, Calm Wilderness, Saam TV, Mumbai Tak, BolBhidu, ABP Majha, Lokmat, Aaj Tak." : "YouTube films belong to their creators: kelvin santarita, Maharashtra Forest, Daily life, DocTourer Shashvat, Akash Thakur, Kaivalya_yatri, Calm Wilderness, Saam TV, Mumbai Tak, BolBhidu, ABP Majha, Lokmat, Aaj Tak."}</li>`;

/* ---------- reveal + counters ---------- */
const fmt = n => n.toLocaleString(MR ? "mr-IN" : "en-IN");
function countUp(el) {
  const to = +el.dataset.to, suf = el.dataset.suf || "", t0 = performance.now();
  const step = now => { const k = clamp((now - t0) / 1800); el.textContent = fmt(Math.round(to * (1 - Math.pow(1 - k, 3)))) + (k === 1 ? suf : ""); if (k < 1) requestAnimationFrame(step); };
  requestAnimationFrame(step);
}
const io = new IntersectionObserver(es => es.forEach(e => {
  if (!e.isIntersecting) return;
  e.target.classList.add("in");
  const b = e.target.querySelector("[data-to]"); if (b) countUp(b);
  io.unobserve(e.target);
}), { threshold: 0.2 });
$$(".reveal").forEach(el => io.observe(el));

/* ---------- scroll engine ---------- */
const prog = $("#prog i"), hdr = $("#top");
const pars = $$("[data-par]"), heroIn = $(".hero-in");
const hs = $("#life"), track = $(".hs-track");
const zones = $$(".gl-zone");
const steps = $$(".cstep"), count = $("#treeCount"), bar = $("#treeBar");
const TREES = 32000;
let lastStep = -1;

function local(el) { // 0 at section top hitting viewport top, 1 when its bottom reaches viewport bottom
  const r = el.getBoundingClientRect();
  return clamp(-r.top / Math.max(1, r.height - innerHeight));
}

function onScroll() {
  const y = scrollY, vh = innerHeight, max = document.documentElement.scrollHeight - vh;
  prog.style.width = (y / max * 100).toFixed(2) + "%";
  hdr.classList.toggle("solid", y > 60);
  document.body.classList.toggle("past-hero", y > vh * 0.3);

  // parallax: each layer drifts relative to its distance from the viewport centre
  for (const el of pars) {
    const r = el.getBoundingClientRect();
    if (r.bottom < -200 || r.top > vh + 200) continue;
    const f = el.dataset.par === "" ? 0.25 : +el.dataset.par;
    const d = (r.top + r.height / 2 - vh / 2);
    if (el.classList.contains("drone")) el.querySelector("img").style.translate = `0 ${(-d * 0.25).toFixed(1)}px`;
    else el.style.translate = `0 ${(-d * f).toFixed(1)}px`;
  }

  // hero text lifts away as the drone takes off
  const ht = local($("#hero"));
  heroIn.style.opacity = clamp(1 - ht * 2.2).toFixed(3);
  heroIn.style.transform = `translateY(${(-ht * 120).toFixed(1)}px)`;
  heroIn.style.filter = `blur(${(ht * 10).toFixed(1)}px)`;

  // horizontal species reel
  const hp = local(hs);
  const dist = track.scrollWidth - innerWidth + 40;
  track.style.transform = `translate3d(${(-hp * dist).toFixed(1)}px,0,0)`;
  $$(".sp", track).forEach(sp => {            // image inside each card pans against the motion
    const img = sp.querySelector("img"); if (!img) return;
    const r = sp.getBoundingClientRect(); const c = (r.left + r.width / 2) / innerWidth - 0.5;
    img.style.objectPosition = `${50 + c * 30}% 50%`;
  });

  // which 3D scene is on screen?
  let active = null, best = 0;
  for (const z of zones) {
    const r = z.getBoundingClientRect();
    const vis = clamp((Math.min(vh, r.bottom) - Math.max(0, r.top)) / vh);
    if (vis > best) { best = vis; active = z; }
  }
  const F = window.FOREST;
  if (F) {
    if (!active || best < 0.02) F.set({ active: false });
    else {
      const sc = active.dataset.scene, t = local(active);
      const s = { active: true, scene: sc, t };
      if (sc === "cut") s.cut = ease(clamp((t - 0.12) / 0.7)), s.regrow = 0;
      if (sc === "sign") { s.cut = 1; s.regrow = ease(clamp((1 - active.getBoundingClientRect().top / vh) / 1.2)); }
      if (sc === "hero") { s.cut = 0; s.regrow = 0; }
      F.set(s);
    }
  }

  // the cut: counter + story steps
  const cut = $("#cut"), ct = local(cut);
  const felled = ease(clamp((ct - 0.12) / 0.7));
  count.textContent = fmt(Math.round(felled * TREES));
  bar.style.width = (felled * 100).toFixed(1) + "%";
  const r = cut.getBoundingClientRect();
  const inCut = r.top < vh * 0.5 && r.bottom > vh * 0.5;
  const si = inCut ? Math.min(steps.length - 1, Math.floor(ct * steps.length)) : -1;
  if (si !== lastStep) { steps.forEach((s, i) => s.classList.toggle("on", i === si)); lastStep = si; }
}
let ticking = false;
addEventListener("scroll", () => { if (!ticking) { ticking = true; requestAnimationFrame(() => { onScroll(); ticking = false; }); } }, { passive: true });
addEventListener("resize", onScroll);
// forest.js loads as a module after this script; poll briefly until it registers
const wait = setInterval(() => { if (window.FOREST) { clearInterval(wait); onScroll(); } }, 100);
onScroll();

// gentle mouse sway for the 3D drone
addEventListener("pointermove", e => { window.FOREST?.set({ mx: e.clientX / innerWidth - 0.5, my: e.clientY / innerHeight - 0.5 }); }, { passive: true });

/* ---------- petition ---------- */
const form = $("#petition");
function letter(d) {
  if (MR) return `प्रति,
मा. मुख्यमंत्री, महाराष्ट्र शासन
मा. प्रधान मुख्य वनसंरक्षक (वन्यजीव), महाराष्ट्र
मा. पर्यावरण व वातावरणीय बदल मंत्री, महाराष्ट्र

विषय: भीमाशंकर वन्यजीव अभयारण्याशेजारील सैदोंगर (कर्जत) येथील वृक्षतोड थांबवण्याबाबत

महोदय/महोदया,

रायगड जिल्ह्यातील कर्जत तालुक्यातील सैदोंगर येथे सुमारे २३३ हेक्टर क्षेत्रावरील ३२,००० हून अधिक झाडं ३,००० मेगावॅट पंप्ड स्टोरेज जलविद्युत प्रकल्पासाठी तोडण्यासाठी चिन्हांकित केल्याचं वृत्त आहे. हे जंगल महाराष्ट्राचा राज्यप्राणी शेकरूचं घर असलेल्या भीमाशंकर वन्यजीव अभयारण्याला लागून आहे आणि पेज व उल्हास नद्यांना पाणी देतं.

माझी शासनाला नम्र विनंती आहे की:
१. राष्ट्रीय हरित लवादाची सुनावणी होईपर्यंत सर्व वृक्षतोड थांबवावी.
२. पर्यावरण आघात मूल्यांकन, वन्यजीव परिणाम अभ्यास आणि पुनर्वसन आराखडा सार्वजनिक करावा.
३. पेज–उल्हास खोऱ्यासाठी स्वतंत्र दरड आणि जलसुरक्षा अभ्यास करावा.
४. वन हक्क कायद्यानुसार ग्रामसभा आणि आदिवासी समुदायांशी सल्लामसलत करावी.
५. अभयारण्याशेजारील जुनं जंगल नष्ट न करणाऱ्या पर्यायी जागांचा विचार करावा.
${d.why ? `\nहे माझ्यासाठी का महत्त्वाचं आहे: ${d.why}\n` : ""}
आपला/आपली विश्वासू,
${d.name}
${d.city}${d.email ? "\n" + d.email : ""}

(${SITE_URL})`;
  return `To,
The Chief Minister, Government of Maharashtra
The Principal Chief Conservator of Forests (Wildlife), Maharashtra
The Minister of Environment and Climate Change, Maharashtra

Subject: Pause tree felling at Saidongar (Karjat) next to Bhimashankar Wildlife Sanctuary

Respected Sir/Madam,

More than 32,000 trees across about 233 hectares at Saidongar, Karjat taluka, Raigad, are reportedly marked for felling for a 3,000 MW pumped-storage hydropower project. This forest borders the Bhimashankar Wildlife Sanctuary, home of Maharashtra's state animal, the Shekru, and feeds the Page and Ulhas rivers.

I request the Government to:
1. Pause all felling until the National Green Tribunal hears the matter.
2. Publish the Environmental Impact Assessment, wildlife-impact study and rehabilitation plan.
3. Order an independent landslide and water-security study for the Page–Ulhas valley.
4. Consult gram sabhas and Adivasi communities as required under the Forest Rights Act.
5. Consider alternative sites that do not sacrifice old forest next to a sanctuary.
${d.why ? `\nWhy this matters to me: ${d.why}\n` : ""}
Sincerely,
${d.name}
${d.city}${d.email ? "\n" + d.email : ""}

(${SITE_URL})`;
}
form.addEventListener("submit", e => {
  e.preventDefault();
  const d = Object.fromEntries(new FormData(form).entries());
  for (const k in d) d[k] = String(d[k]).trim();
  if (!d.name || !d.city) return;
  const body = letter(d), subj = MR ? "भीमाशंकर वाचवा: सैदोंगर येथील वृक्षतोड थांबवा" : "Save Bhimashankar: pause tree felling at Saidongar";
  $("#sName").textContent = d.name.split(" ")[0];
  $("#shMail").href = `mailto:?subject=${encodeURIComponent(subj)}&body=${encodeURIComponent(body)}`;
  const msg = MR ? `मी भीमाशंकर वाचवण्यासाठी सही केली 🌳 अभयारण्याशेजारी ३२,००० हून अधिक झाडं तोडण्यासाठी चिन्हांकित आहेत. गोष्ट पाहा आणि तुमचं नाव जोडा: ${SITE_URL}`
    : `I just signed to save Bhimashankar 🌳 32,000+ trees next to the sanctuary are marked to fall. See the story and add your name: ${SITE_URL}`;
  $("#shWa").href = `https://wa.me/?text=${encodeURIComponent(msg)}`;
  $("#shX").href = `https://twitter.com/intent/tweet?text=${encodeURIComponent(msg)}`;
  $("#shCopy").onclick = async () => { try { await navigator.clipboard.writeText(body); $("#shCopy").textContent = MR ? "कॉपी झालं ✓" : "Copied ✓"; } catch { $("#shCopy").textContent = MR ? "कॉपी झालं नाही" : "Copy failed"; } };
  $(".done", form).hidden = false;
  if (PETITION_URL) window.open(PETITION_URL, "_blank", "noopener");
});

/* ---------- videos ---------- */
const ytSrc = (id, extra = "") => `https://www.youtube-nocookie.com/embed/${id}?autoplay=1&rel=0&modestbranding=1&playsinline=1${extra}`;
function playYT(btn) {
  if (btn.querySelector("iframe")) return;
  const f = document.createElement("iframe");
  f.src = ytSrc(btn.dataset.id);
  f.allow = "autoplay; encrypted-media; picture-in-picture; fullscreen";
  f.allowFullscreen = true; f.title = "YouTube video";
  btn.append(f);
}
document.addEventListener("click", e => {
  const b = e.target.closest("button.yt"); if (b) playYT(b);
});

// cinema reel: pick a film, it loads on the big screen
const screenBtn = $(".screen .yt");
$$(".reel li").forEach(li => li.addEventListener("click", () => {
  $$(".reel li").forEach(x => x.classList.toggle("on", x === li));
  const playing = !!screenBtn.querySelector("iframe");
  screenBtn.innerHTML = `<img src="https://i.ytimg.com/vi/${li.dataset.id}/hqdefault.jpg" alt=""><span class="play"></span>`;
  screenBtn.dataset.id = li.dataset.id;
  $("#nowT").textContent = li.querySelector("b").textContent;
  $("#nowC").textContent = li.dataset.c;
  if (playing || innerWidth < 860) playYT(screenBtn);
}));

// real Bhimashankar drone footage as a muted, looping background (loads only when near)
const calm = matchMedia("(prefers-reduced-motion: reduce)").matches || navigator.connection?.saveData;
const bgObs = new IntersectionObserver(es => es.forEach(e => {
  if (!e.isIntersecting || calm) return;
  const el = e.target, id = el.dataset.yt; bgObs.unobserve(el);
  const f = document.createElement("iframe");
  f.src = ytSrc(id, `&mute=1&loop=1&playlist=${id}&controls=0&disablekb=1&iv_load_policy=3&start=${el.dataset.start || 0}`);
  f.allow = "autoplay; encrypted-media"; f.tabIndex = -1; f.title = "";
  f.addEventListener("load", () => setTimeout(() => el.classList.add("on"), 1800));
  el.append(f);
}), { rootMargin: "400px" });
$$(".ytbg").forEach(el => bgObs.observe(el));

// local clips: play only while on screen
const vObs = new IntersectionObserver(es => es.forEach(e => {
  const v = e.target;
  if (e.isIntersecting && !calm) v.play().catch(() => {}); else v.pause();
}), { threshold: 0.15 });
$$("video").forEach(v => vObs.observe(v));
