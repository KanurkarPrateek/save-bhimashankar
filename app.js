/* Save Bhimashankar — scroll story controller */

// Paste a Change.org / Google Form link here and the Sign button will open it.
const PETITION_URL = "";
// Cloudflare Worker that counts visitors and securely forwards signatures to the Google Sheet (see counter/)
const COUNTER_URL = "https://bhimashankar-counter.prateekkanurkar.workers.dev";
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
  ["Shekru hanging from a branch, tail streaming down", "Tisha Mukherjee", "CC BY-SA 4.0", "Indian_giant_squirrel_by_Tisha_Mukherjee_03.jpg"],
  ["Shekru resting on a branch, long cream-tipped tail", "Kandukuru Nagarjun from Bangalore, India", "CC BY 2.0", "Malabar_giant_squirrel_with_gorgeous_tail_(53414506037).jpg"],
  ["Shekru climbing head-first down a tree trunk", "Nitesh K R", "CC BY-SA 4.0", "Indian_Giant_Squirrel_or_Malabar_Giant_Squirrel.jpg"],
  ["Shekru running along a branch, bushy tail raised", "Tisha Mukherjee", "CC BY-SA 4.0", "Indian_giant_squirrel_by_Tisha_Mukherjee_10.jpg"],
  ["Maharashtra's Shekru feeding on fruit in the canopy", "Dinesh Valke from Thane, India", "CC BY-SA 2.0", "Shekru_(Marathi-_%E0%A4%B6%E0%A5%87%E0%A4%95%E0%A4%B0%E0%A5%82)_(8900080129).jpg"],
  ["Shekru stretched along a branch in green forest", "Tisha Mukherjee", "CC BY-SA 4.0", "Indian_giant_squirrel_by_Tisha_Mukherjee_01.jpg"],
  ["A forest trail vanishing into monsoon mist", "Nikhil More", "CC BY-SA 4.0", "Monsoon_Maharashtra_India_Rain_Landscape_(1)_14.jpg"],
  ["Sahyadri village under monsoon clouds", "UrbanWanderer from PUNE, India", "CC BY-SA 2.0", "Village_from_the_dreams_-_%E0%A4%B8%E0%A5%8D%E0%A4%B5%E0%A4%AA%E0%A5%8D%E0%A4%A8%E0%A4%BE%E0%A4%AE%E0%A4%A7%E0%A5%80%E0%A4%B2_%E0%A4%97%E0%A4%BE%E0%A4%B5%E0%A4%BE_(6021136517).jpg"],
  ["Rocky stream near the source of the Bhima river", "Santhosh.manchala", "CC BY-SA 4.0", "Start_of_river_Bhima_20150627.jpg"],
  ["Sahyadri escarpment above the Konkan, Junnar", "Nikhil More", "CC BY-SA 4.0", "Durgawadi_ambe_hatvij,_Junnar,_pune_(2)_22.jpg"],
  ["Monsoon gorge in the Sahyadri, wrapped in cloud", "Swapnilgorivale", "CC BY-SA 3.0", "Andharban_Forest.jpg"],
  ["Great hornbill in flight, wings spread", "Dr. Raju Kasambe", "CC BY-SA 4.0", "Great_Pied_Hornbill_Buceros_bicornis_by_Dr._Raju_Kasambe_(2).jpg"],
  ["Male Malabar trogon on a forest branch", "Shiv's fotografia", "CC BY-SA 4.0", "Malabar_Trogon_(Harpactes_fasciatus)_03.jpg"],
  ["Indian paradise flycatcher with long white tail", "Hari K Patibanda", "CC BY 2.0", "A_Beautiful_male_Indian_Paradise_Flycatcher_in_full_breeding_plumage_(50896595143).jpg"],
  ["Indian leopard stepping out between rocks", "Tisha Mukherjee", "CC BY-SA 4.0", "Indian_leopard_in_Jawai_Bandh_April_2025_by_Tisha_Mukherjee_16.jpg"],
  ["Grey langur in Bhimashankar Wildlife Sanctuary", "Nikhil More", "CC BY-SA 4.0", "Gray_langurs_Bhimashankar_wildlife_sanctuary,_Pune,_India_(1)_06.jpg"],
  ["Malabar pit viper coiled on a branch at night", "Shiv's fotografia", "CC BY-SA 4.0", "Malabar_Pit_Viper_(Craspedocephalus_malabaricus)_03.jpg"],
  ["Malabar gliding frog on a banana flower", "Manojiritty", "CC BY-SA 4.0", "Malabar_gliding_frog_@_iritty.jpg"],
  ["Atlas moth, one of the world's largest moths", "Jeevan Jose, Kerala, India", "CC BY-SA 4.0", "Attacus_taprobanis-Kadavoor-2018-07-13-001.jpg"],
  ["Blue Mormon, the state butterfly of Maharashtra", "Jeevan Jose, Kerala, India", "CC BY-SA 4.0", "Papilio_polymnestor-Kadavoor-2016-07-27-002.jpg"],
  ["Karvi (Strobilanthes callosa) in bloom", "Dinesh Valke from Thane, India", "CC BY-SA 2.0", "Strobilanthes_callosa_Nees_(52455952701).jpg"],
  ["Ceropegia flower, a rare Western Ghats vine", "Davidvraju", "CC BY-SA 4.0", "Ceropegia_fantastica_(2).jpg"],
  ["Aerides maculosa, a wild orchid of the Sahyadri", "Dinesh Valke from Thane, India", "CC BY-SA 2.0", "Aerides_maculosa_Lindl._(3623793873).jpg"],
  ["Fireflies lighting up a forest at dusk", "MicheleIlluzzi", "CC BY-SA 4.0", "Dancing_golden_threads.jpg"],
  ["Bioluminescent Mycena mushrooms glowing green", "Joseph Pallante", "CC BY-SA 4.0", "Bioluminescent_Mycena_roseoflava.jpg"],
  ["Moss-covered stones in a sacred grove (devrai), Junnar", "Nikhil More", "CC BY-SA 4.0", "Durgawadi_ambe_hatvij,_Junnar,_pune_(2)_06.jpg"],
  ["Hillside of evergreen forest felled and cleared", "Saurabhsawantphoto", "CC BY-SA 4.0", "SaurabhSawant_EvergreenForestTreeFelling_ArunachalPradesh_India_IMG_5967.jpg"],
  ["Uprooted tree stumps where forest once stood", "Nandini Velho", "CC BY-SA 3.0", "Deforestation_around_Pakke_Tiger_Reserve,_India.JPG"],
  ["Pumped-storage reservoir cut into a mountaintop", "Jendrusk", "CC BY-SA 4.0", "Pumped-storage_hydroelectricity_%C5%BBar_aerial_1.jpg"],
];
$("#credits").innerHTML = CREDITS.map(([t, a, l, f]) =>
  `<li><a href="https://commons.wikimedia.org/wiki/File:${f.includes("%") ? f : encodeURIComponent(f)}" target="_blank" rel="noopener">${t}</a> — ${a}, ${l}</li>`).join("") +
  `<li><a href="https://commons.wikimedia.org/wiki/File:From_the_mountain_high,_the_forest_stretches_like_a_green_ocean,_kissed_by_mist_and_rain_%E2%80%94_a_silent_breath_of_nature,_and_continue_with_move_on.webm" target="_blank" rel="noopener">${MR ? "पश्चिम घाट — व्हिडिओ" : "Western Ghats — video"}</a> &amp; <a href="https://commons.wikimedia.org/wiki/File:Wandering_through_the_greenish_forest,_I_follow_an_unknown_path_where_every_leaf_hides_a_secret_and_every_step_feels_like_discovery.webm" target="_blank" rel="noopener">${MR ? "जंगलातील पायवाट" : "forest path"}</a> — Mathanprasath K, CC BY 4.0</li>` +
  `<li>${MR ? "सर्व छायाचित्रे Wikimedia Commons वरून घेतली असून त्यांचा आकार बदलला आहे. काजवे, चमकणारी बुरशी, तोडलेला डोंगर आणि डोंगरमाथ्यावरचा जलाशय यांची छायाचित्रे इतर ठिकाणची असून उदाहरणादाखल दिली आहेत. परवाना" : "All via Wikimedia Commons, resized. Photos of fireflies, glowing fungi, the felled hillside and the hilltop reservoir are from elsewhere and shown as examples. Licences"}: <a href="https://creativecommons.org/licenses/by-sa/4.0/" target="_blank" rel="noopener">CC BY-SA 4.0</a>.</li>` +
  `<li>${MR ? "YouTube चित्रफितींचे हक्क त्यांच्या निर्मात्यांकडे: kelvin santarita, Maharashtra Forest, Daily life, DocTourer Shashvat, Akash Thakur, Kaivalya_yatri, Calm Wilderness, Saam TV, Mumbai Tak, BolBhidu, ABP Majha, Lokmat, Aaj Tak." : "YouTube films belong to their creators: kelvin santarita, Maharashtra Forest, Daily life, DocTourer Shashvat, Akash Thakur, Kaivalya_yatri, Calm Wilderness, Saam TV, Mumbai Tak, BolBhidu, ABP Majha, Lokmat, Aaj Tak."}</li>`;

/* ---------- reveal + counters ---------- */
const fmt = n => n.toLocaleString(MR ? "mr-IN" : "en-IN");
function countUp(el) {
  const to = +el.dataset.to, suf = el.dataset.suf || "", t0 = performance.now();
  const step = now => { const k = clamp((now - t0) / 1800); el.textContent = fmt(Math.round(to * (1 - Math.pow(1 - k, 3)))) + (k === 1 ? suf : ""); if (k < 1) requestAnimationFrame(step); };
  requestAnimationFrame(step);
}
function reveal(el) {
  if (el.classList.contains("in")) return;
  el.classList.add("in");
  const b = el.querySelector("[data-to]"); if (b) countUp(b);
  io.unobserve(el);
}
const io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) reveal(e.target); }), { threshold: 0, rootMargin: "0px 0px -8% 0px" });
let pending = $$(".reveal");
pending.forEach(el => io.observe(el));
// safety net: anything already scrolled to (fast scroll, menu jump) is shown even if the observer missed it
function sweep() {
  if (!pending.length) return;
  const vh = innerHeight;
  pending = pending.filter(el => { if (el.getBoundingClientRect().top < vh) { reveal(el); return false; } return !el.classList.contains("in"); });
}

/* ---------- scroll engine ---------- */
const prog = $("#prog i"), hdr = $("#top");
const pars = $$("[data-par]"), heroIn = $(".hero-in");
const hs = $("#life"), track = $(".hs-track");
const zones = $$(".gl-zone");
const mbar = $(".mbar");
const spImgs = $$(".sp").map(sp => [sp, sp.querySelector("img")]).filter(x => x[1]);
const steps = $$(".cstep"), count = $("#treeCount"), bar = $("#treeBar");
const TREES = 32490;
let lastStep = -1;

function local(el) { // 0 at section top hitting viewport top, 1 when its bottom reaches viewport bottom
  const r = el.getBoundingClientRect();
  return clamp(-r.top / Math.max(1, r.height - innerHeight));
}

function onScroll() {
  const y = scrollY, vh = innerHeight, max = document.documentElement.scrollHeight - vh;
  sweep();
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

  // bottom "sign" bar on phones: show after the hero, hide once the form is on screen
  const sr = $("#sign").getBoundingClientRect();
  mbar?.classList.toggle("show", y > vh * 0.9 && sr.top > vh * 0.6);

  // horizontal species reel (phones swipe it natively instead)
  if (innerWidth < 861) { track.style.transform = ""; } else {
  const hp = local(hs);
  const dist = track.scrollWidth - innerWidth + 40;
  track.style.transform = `translate3d(${(-hp * dist).toFixed(1)}px,0,0)`;
  spImgs.forEach(([sp, img]) => {            // image inside each card pans against the motion
    const r = sp.getBoundingClientRect(); const c = (r.left + r.width / 2) / innerWidth - 0.5;
    img.style.objectPosition = `${50 + c * 30}% 50%`;
  });
  }

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
मा. पर्यावरण व वातावरणीय बदल मंत्री, महाराष्ट्र
मा. प्रधान मुख्य वनसंरक्षक (वनबल प्रमुख), महाराष्ट्र

विषय: कर्जत तालुक्यातील सैदोंगर येथील वृक्षतोडीची स्थगिती कायम ठेवण्याबाबत

महोदय/महोदया,

रायगड जिल्ह्यातील कर्जत तालुक्यात सैदोंगर (पाली–ढाक परिसर) येथे ३,००० मेगावॅट क्षमतेच्या उदंचन जलविद्युत प्रकल्पासाठी सुमारे २३३ हेक्टर वनजमिनीवरील ३२,४९० झाडे तोडण्यास वनविभागाने परवानगी दिली आहे. हे जंगल पश्चिम घाटात, भीमाशंकर वन्यजीव अभयारण्यापासून सुमारे १५ किमी अंतरावर, त्याच सह्याद्रीच्या कड्यावर आहे. ते पेज आणि उल्हास नद्यांचे पाणलोट क्षेत्र असून उल्हास नदी खालच्या भागातील लाखो लोकांना पिण्याचे पाणी पुरवते.

तरी शासनाने पुढील बाबींवर कार्यवाही करावी, ही नम्र विनंती:
१. सर्व अभ्यास सार्वजनिक होईपर्यंत आणि कोणत्याही कायदेशीर आव्हानाची सुनावणी होईपर्यंत सैदोंगर येथील वृक्षतोडीची सध्याची स्थगिती कायम ठेवावी.
२. संपूर्ण पर्यावरणीय आघात मूल्यांकन अहवाल, वृक्षगणना यादी, मंजूर वन्यजीव संवर्धन आराखडा, वनमंजुरीचे आदेश आणि वन हक्क कायद्यानुसार घेतलेल्या ग्रामसभा संमती सार्वजनिक कराव्यात.
३. पेज–उल्हास खोऱ्यातील दरडींचा धोका, जलसुरक्षा आणि परिसरातील सर्व उदंचन प्रकल्पांचे एकत्रित परिणाम यांचा स्वतंत्र अभ्यास करवून घ्यावा.
४. वन हक्क कायद्यानुसार बाधित गावांच्या ग्रामसभा आणि आदिवासी समुदायांशी प्रत्यक्ष सल्लामसलत करावी.
५. पश्चिम घाटातील राखीव जंगल नष्ट करावे लागणार नाही, अशा पर्यायी जागांचा किंवा क्लोज्ड-लूप रचनेचा विचार करावा.
${d.why ? `\nहे माझ्यासाठी का महत्त्वाचे आहे: ${d.why}\n` : ""}
आपला/आपली विश्वासू,
${d.name}
${d.city}${d.email ? "\n" + d.email : ""}

(${SITE_URL})`;
  return `To,
The Chief Minister, Government of Maharashtra
The Minister of Environment and Climate Change, Maharashtra
The Principal Chief Conservator of Forests (Head of Forest Force), Maharashtra

Subject: Keep the pause on tree felling at Saidongar, Karjat taluka

Respected Sir/Madam,

The Forest Department has permitted the felling of 32,490 trees on about 233 hectares of forest land at Saidongar (Pali–Dhak area), Karjat taluka, Raigad, for a 3,000 MW pumped-storage hydropower project. This forest lies in the Western Ghats, on the same Sahyadri escarpment as the Bhimashankar Wildlife Sanctuary, about 15 km from it. It is the catchment of the Pej and Ulhas rivers, and the Ulhas supplies drinking water to millions downstream.

I request the Government to:
1. Keep the current pause on felling at Saidongar until the studies are public and any legal challenge is heard.
2. Publish the full EIA, the tree-enumeration list, the approved Wildlife Conservation Plan, the forest-clearance orders and the gram-sabha consents under the Forest Rights Act.
3. Order an independent study of landslide risk, water security and the cumulative impact of all pumped-storage projects in the Pej–Ulhas valley.
4. Consult the gram sabhas of the affected villages and Adivasi communities in person, as the Forest Rights Act requires.
5. Consider alternative sites or a closed-loop design that do not sacrifice Western Ghats reserved forest.
${d.why ? `\nWhy this matters to me: ${d.why}\n` : ""}
Sincerely,
${d.name}
${d.city}${d.email ? "\n" + d.email : ""}

(${SITE_URL})`;
}
const ERR = {
  human: ["कृपया ‘मी माणूस आहे’ ही तपासणी पूर्ण करा.", "Please complete the human check."],
  slow: ["एकाच ठिकाणाहून खूप सह्या आल्या आहेत. थोड्या वेळाने पुन्हा प्रयत्न करा.", "Too many signatures from here. Please try again a little later."],
  email: ["ईमेल पत्ता तपासा.", "Please check the email address."],
  fields: ["नाव आणि शहर/गाव भरा.", "Please fill in your name and city."],
  net: ["सही नोंदवता आली नाही. इंटरनेट तपासून पुन्हा प्रयत्न करा.", "Couldn't record your signature. Check your connection and try again."],
};
// human check: Cloudflare Turnstile (its always-pass test key on localhost)
const tsBox = $(".cf-turnstile", form);
window.tsReady = () => window.turnstile.render(tsBox, {
  sitekey: /^(localhost|127\.)/.test(location.hostname) ? "1x00000000000000000000AA" : tsBox.dataset.sitekey,
  theme: "dark", size: "flexible", language: "auto",
});
document.head.append(Object.assign(document.createElement("script"), { src: "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit&onload=tsReady", async: true }));
const errBox = $(".form-err", form), submitBtn = $("button[type=submit]", form);
function showSigns(n) { if (typeof n !== "number") return; COUNTS.signs = n; renderCounts(); }
fetch(COUNTER_URL + "/signs", { cache: "no-store" }).then(r => r.json()).then(j => showSigns(j.count)).catch(() => {});

form.addEventListener("submit", async e => {
  e.preventDefault();
  const d = Object.fromEntries(new FormData(form).entries());
  for (const k in d) d[k] = String(d[k]).trim();
  if (!d.name || !d.city) return;
  errBox.hidden = true;
  const token = d["cf-turnstile-response"] || "";
  submitBtn.disabled = true; const label = submitBtn.textContent; submitBtn.textContent = MR ? "नोंदवत आहे…" : "Signing…";
  let res;
  try {
    res = await fetch(COUNTER_URL + "/sign", { method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: d.name, city: d.city, email: d.email, why: d.why, website: d.website, lang: LANG, token }) }).then(r => r.json());
  } catch { res = { ok: false, error: "net" }; }
  submitBtn.disabled = false; submitBtn.textContent = label;
  window.turnstile?.reset();
  if (!res.ok) { errBox.textContent = (ERR[res.error] || ERR.net)[MR ? 0 : 1]; errBox.hidden = false; return; }
  showSigns(res.count);
  const body = letter(d), subj = MR ? "सैदोंगर (कर्जत) येथील वृक्षतोडीची स्थगिती कायम ठेवा" : "Keep the pause on tree felling at Saidongar, Karjat";
  $("#sName").textContent = d.name.split(" ")[0];
  $("#shMail").href = `mailto:?subject=${encodeURIComponent(subj)}&body=${encodeURIComponent(body)}`;
  const msg = MR ? `भीमाशंकर वाचवण्यासाठी मी याचिकेवर सही केली 🌳 सह्याद्रीत, भीमाशंकरपासून सुमारे १५ किमीवर, ३२,४९० झाडे तोडण्याची परवानगी देण्यात आली आहे. गोष्ट पाहा आणि तुमचे नाव जोडा: ${SITE_URL}`
    : `I just signed to save Bhimashankar 🌳 32,490 trees in the Sahyadri, about 15 km from Bhimashankar, have been cleared for felling. See the story and add your name: ${SITE_URL}`;
  $("#shWa").href = `https://wa.me/?text=${encodeURIComponent(msg)}`;
  $("#shX").href = `https://twitter.com/intent/tweet?text=${encodeURIComponent(msg)}`;
  $("#shCopy").onclick = async () => { try { await navigator.clipboard.writeText(body); $("#shCopy").textContent = MR ? "कॉपी झाले ✓" : "Copied ✓"; } catch { $("#shCopy").textContent = MR ? "कॉपी झाले नाही" : "Copy failed"; } };
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
  const el = e.target, id = el.dataset.yt;
  if (calm) return;
  if (!e.isIntersecting) {                     // scrolled away: drop the player so it stops decoding video
    el.classList.remove("on"); el.querySelector("iframe")?.remove(); return;
  }
  if (el.querySelector("iframe")) return;
  const f = document.createElement("iframe");
  f.src = ytSrc(id, `&mute=1&loop=1&playlist=${id}&controls=0&disablekb=1&iv_load_policy=3&start=${el.dataset.start || 0}`);
  f.allow = "autoplay; encrypted-media"; f.tabIndex = -1; f.title = "";
  f.addEventListener("load", () => setTimeout(() => el.classList.add("on"), 1800));
  el.append(f);
}), { rootMargin: "150px" });
$$(".ytbg").forEach(el => bgObs.observe(el));

// local clips: play only while on screen
const vObs = new IntersectionObserver(es => es.forEach(e => {
  const v = e.target;
  if (e.isIntersecting && !calm) v.play().catch(() => {}); else v.pause();
}), { threshold: 0.15 });
$$("video").forEach(v => vObs.observe(v));

/* ---------- photo lightbox ---------- */
const lb = $("#lb");
document.addEventListener("click", e => {
  const f = e.target.closest(".mosaic figure, .sq-gal figure"); if (!f || !lb) return;
  lb.querySelector("img").src = f.querySelector("img").src;
  lb.querySelector("p").textContent = f.querySelector("figcaption")?.textContent || "";
  lb.hidden = false;
});
lb?.addEventListener("click", () => { lb.hidden = true; });
addEventListener("keydown", e => { if (e.key === "Escape" && lb) lb.hidden = true; });

/* ---------- Shekru photo with fact dots ---------- */
const sqp = $("#sqPhoto");
if (sqp) {
  const img = $(".sqp-img", sqp), dots = $$(".hs", sqp), card = $(".hs-card", sqp);
  const POS_X = 0.45; // matches object-position in CSS
  function place() {
    const w = sqp.clientWidth, h = sqp.clientHeight, iw = img.naturalWidth || 1600, ih = img.naturalHeight || 1066;
    const k = Math.max(w / iw, h / ih), ox = (w - iw * k) * POS_X, oy = (h - ih * k) * 0.5;
    dots.forEach(d => { d.style.transform = `translate(${(ox + iw * k * d.dataset.x / 100).toFixed(1)}px,${(oy + ih * k * d.dataset.y / 100).toFixed(1)}px)`; });
  }
  img.complete ? place() : img.addEventListener("load", place);
  new ResizeObserver(place).observe(sqp);
  dots.forEach(d => d.addEventListener("click", e => {
    e.stopPropagation();
    dots.forEach(o => o.classList.toggle("on", o === d));
    $("b", card).textContent = d.dataset.t; $("p", card).innerHTML = d.dataset.p;
    card.classList.add("show");
  }));
  card.addEventListener("click", () => { card.classList.remove("show"); dots.forEach(o => o.classList.remove("on")); });
  sqp.addEventListener("click", e => { if (e.target === img) card.click(); });
}

/* ---------- visitor + signature counters (Cloudflare Worker + D1, see counter/) ---------- */
const COUNTS = { visits: null, signs: null };
const one = n => n === 1;
const SENT = {
  visits: n => MR ? (one(n) ? `<b>१</b> व्यक्तीने ही गोष्ट पाहिली` : `<b>${fmt(n)}</b> जणांनी ही गोष्ट पाहिली`) : `<b>${fmt(n)}</b> ${one(n) ? "person has" : "people have"} seen this story`,
  signs: n => MR ? (one(n) ? `<b>१</b> व्यक्तीने आतापर्यंत सही केली` : `<b>${fmt(n)}</b> जणांनी आतापर्यंत सही केली`) : `<b>${fmt(n)}</b> ${one(n) ? "person has" : "people have"} signed so far`,
};
function renderCounts() {
  const { visits: v, signs: s } = COUNTS;
  $$(".visits[data-kind]").forEach(el => {
    const k = el.dataset.kind, t = $(".vt", el);
    if (k === "foot") {
      if (v == null) return;
      t.innerHTML = MR ? `<b>${fmt(v)}</b> भेटी${s != null ? ` · <b>${fmt(s)}</b> ${one(s) ? "सही" : "सह्या"}` : ""}`
                       : `<b>${fmt(v)}</b> ${one(v) ? "visitor" : "visitors"}${s != null ? ` · <b>${fmt(s)}</b> ${one(s) ? "signature" : "signatures"}` : ""}`;
    } else {
      if (COUNTS[k] == null) return;
      t.innerHTML = SENT[k](COUNTS[k]);
    }
    el.hidden = false;
  });
}
(async () => {
  const local = /^(localhost|127\.|192\.168\.)/.test(location.hostname);
  let seen = false; try { seen = !!localStorage.getItem("sb_seen"); } catch {}
  try {
    const r = await fetch(COUNTER_URL + (seen || local ? "/count" : "/hit"), { method: seen || local ? "GET" : "POST", cache: "no-store" });
    const { count } = await r.json();
    if (!seen && !local) try { localStorage.setItem("sb_seen", "1"); } catch {}
    if (typeof count === "number") { COUNTS.visits = count; renderCounts(); }
  } catch {}
})();
