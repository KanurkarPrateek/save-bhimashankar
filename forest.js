// Bhimashankar — a living 3D Sahyadri plateau.
// Driven from app.js through window.FOREST.set({...}).
import * as THREE from "three";
import { EffectComposer } from "three/addons/postprocessing/EffectComposer.js";
import { RenderPass } from "three/addons/postprocessing/RenderPass.js";
import { UnrealBloomPass } from "three/addons/postprocessing/UnrealBloomPass.js";
import { OutputPass } from "three/addons/postprocessing/OutputPass.js";

const canvas = document.getElementById("forest");
const mobile = matchMedia("(max-width: 760px)").matches;
const renderer = new THREE.WebGLRenderer({ canvas, antialias: !mobile, powerPreference: "high-performance" });
let DPR = Math.min(devicePixelRatio, mobile ? 1 : 1.25);
renderer.setPixelRatio(DPR);
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.0;
renderer.outputColorSpace = THREE.SRGBColorSpace;

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(48, 1, 0.5, 900);

/* ---------- noise ---------- */
const hash = (x, y) => { const s = Math.sin(x * 127.1 + y * 311.7) * 43758.5453; return s - Math.floor(s); };
function vnoise(x, y) {
  const xi = Math.floor(x), yi = Math.floor(y), xf = x - xi, yf = y - yi;
  const u = xf * xf * (3 - 2 * xf), v = yf * yf * (3 - 2 * yf);
  const a = hash(xi, yi), b = hash(xi + 1, yi), c = hash(xi, yi + 1), d = hash(xi + 1, yi + 1);
  return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v;
}
function fbm(x, y, o = 5) { let s = 0, a = 0.5, f = 1; for (let i = 0; i < o; i++) { s += a * vnoise(x * f, y * f); f *= 2.03; a *= 0.5; } return s; }
const smooth = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
const rnd = (() => { let s = 7; return () => (s = (s * 16807) % 2147483647) / 2147483647; })();

/* ---------- terrain: plateau with a Sahyadri escarpment dropping west (-x) ---------- */
const SIZE = 320, SEG = mobile ? 140 : 200;
function edgeX(z) { return -38 + (fbm(z * 0.018, 3.3, 4) - 0.5) * 46; }
function H(x, z) {
  const n = fbm(x * 0.022 + 10, z * 0.022, 5);
  let h = (n - 0.5) * 16 + Math.sin(z * 0.04 + x * 0.01) * 1.5;
  const e = edgeX(z);
  const drop = smooth(e + 5, e - 9, x);          // 1 = below the cliff
  const valley = (fbm(x * 0.03, z * 0.03 + 9, 4) - 0.5) * 22;
  h = h * (1 - drop) + (-46 + valley) * drop;
  // basalt mesas (step terraces) out in the valley
  const mesa = Math.max(0, fbm(x * 0.012 + 40, z * 0.012 - 7, 3) - 0.56) * 220;
  h += Math.min(mesa, 40) * drop;
  return h;
}
const geo = new THREE.PlaneGeometry(SIZE, SIZE, SEG, SEG);
geo.rotateX(-Math.PI / 2);
const pos = geo.attributes.position;
const cols = new Float32Array(pos.count * 3);
const baseCols = new Float32Array(pos.count * 3);
const scarW = new Float32Array(pos.count);
const CUT = new THREE.Vector2(26, 6);           // centre of the felling zone
const CUT_R = 30;
const cA = new THREE.Color("#2f5a2a"), cB = new THREE.Color("#4f7a2c"), cRock = new THREE.Color("#4a3b33"), cDry = new THREE.Color("#8a7a45");
const tmp = new THREE.Color();
for (let i = 0; i < pos.count; i++) {
  const x = pos.getX(i), z = pos.getZ(i);
  const y = H(x, z); pos.setY(i, y);
  const sl = Math.hypot(H(x + 1, z) - y, H(x, z + 1) - y);
  tmp.copy(cA).lerp(cB, fbm(x * 0.05, z * 0.05, 3));
  tmp.lerp(cDry, smooth(0.45, 0.9, fbm(x * 0.02 - 5, z * 0.02 + 2, 3)) * 0.5);
  tmp.lerp(cRock, smooth(1.1, 2.6, sl));
  baseCols.set([tmp.r, tmp.g, tmp.b], i * 3);
  const d = Math.hypot(x - CUT.x, z - CUT.y) + (fbm(x * 0.08, z * 0.08, 3) - 0.5) * 14;
  scarW[i] = 1 - smooth(CUT_R - 6, CUT_R + 4, d);
}
cols.set(baseCols);
geo.setAttribute("color", new THREE.BufferAttribute(cols, 3));
geo.computeVertexNormals();
const ground = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.95, flatShading: true }));
scene.add(ground);

/* ---------- trees (instanced) ---------- */
const N = mobile ? 2600 : 5200;
const trees = [];
let guard = 0;
while (trees.length < N && guard++ < N * 30) {
  const x = (rnd() - 0.5) * SIZE * 0.92, z = (rnd() - 0.5) * SIZE * 0.92;
  const y = H(x, z);
  const sl = Math.hypot(H(x + 1, z) - y, H(x, z + 1) - y);
  if (sl > 1.4) continue;
  const dens = fbm(x * 0.04 + 3, z * 0.04 - 1, 3);
  const inCut = Math.hypot(x - CUT.x, z - CUT.y) < CUT_R + 2;
  if (!inCut && rnd() > smooth(0.3, 0.6, dens)) continue;
  const big = rnd();
  const th = 2.2 + big * 3.4, r = 1.5 + big * 2.1 + rnd() * 0.6;
  trees.push({ x, y, z, th, r, tw: 0.18 + big * 0.22, sq: 0.8 + rnd() * 0.5, rot: rnd() * 6.28, hue: rnd(),
    cut: inCut, dir: rnd() * Math.PI * 2, rank: 0 });
}
// order felling from one edge of the zone inward, like a front line
const cutList = trees.filter(t => t.cut);
cutList.forEach(t => { t.rank = (t.x - CUT.x + CUT_R) / (2 * CUT_R) * 0.75 + rnd() * 0.25; t.dir = -0.4 + rnd() * 0.8 + Math.PI; });
const crownGeo = new THREE.IcosahedronGeometry(1, 1);
const trunkGeo = new THREE.CylinderGeometry(0.7, 1, 1, 6); trunkGeo.translate(0, 0.5, 0);
const stumpGeo = new THREE.CylinderGeometry(1, 1.15, 1, 7); stumpGeo.translate(0, 0.5, 0);
const crownMat = new THREE.MeshStandardMaterial({ roughness: 0.85, flatShading: true });
const trunkMat = new THREE.MeshStandardMaterial({ color: "#3b2a20", roughness: 1, flatShading: true });
const stumpMat = new THREE.MeshStandardMaterial({ color: "#c9a27a", roughness: 0.9, flatShading: true, emissive: "#2a1508", emissiveIntensity: 0.4 });
const crowns = new THREE.InstancedMesh(crownGeo, crownMat, trees.length);
const trunks = new THREE.InstancedMesh(trunkGeo, trunkMat, trees.length);
const stumps = new THREE.InstancedMesh(stumpGeo, stumpMat, cutList.length);
scene.add(crowns, trunks, stumps);
const greens = ["#1f4d22", "#2c6a2a", "#3d7d2e", "#1b3f24", "#4f8a34", "#2a5a33", "#6b8f2e"].map(c => new THREE.Color(c));
const brown = new THREE.Color("#5a3a1e"), sapling = new THREE.Color("#8fd16a");
trees.forEach(t => { t.col = greens[Math.floor(t.hue * greens.length)].clone(); if (t.hue > 0.985) t.col.set("#a8502e"); /* flame-of-forest flecks */ });

const M = new THREE.Matrix4(), Q = new THREE.Quaternion(), S = new THREE.Vector3(), P = new THREE.Vector3(), E = new THREE.Euler();
const Mb = new THREE.Matrix4(), Mo = new THREE.Matrix4();
const zero = new THREE.Matrix4().makeScale(0, 0, 0);
function placeTree(i, t, fall, crownScale, colMix, grow) {
  // base frame: position, fall rotation about axis perpendicular to fall direction
  const ax = new THREE.Vector3(Math.cos(t.dir), 0, Math.sin(t.dir)).cross(new THREE.Vector3(0, 1, 0)).normalize();
  Q.setFromAxisAngle(ax, -fall * Math.PI * 0.49);
  Mb.compose(P.set(t.x, t.y - 0.2, t.z), Q, S.set(1, 1, 1));
  const g = grow;
  Mo.compose(P.set(0, 0, 0), new THREE.Quaternion(), S.set(t.tw * g, t.th * g, t.tw * g));
  trunks.setMatrixAt(i, M.multiplyMatrices(Mb, Mo));
  E.set(0, t.rot, 0); Q.setFromEuler(E);
  const cs = crownScale * g;
  Mo.compose(P.set(0, t.th * g + t.r * 0.55 * g, 0), Q, S.set(t.r * cs, t.r * t.sq * 1.25 * cs, t.r * cs));
  crowns.setMatrixAt(i, M.multiplyMatrices(Mb, Mo));
  tmp.copy(t.col).lerp(colMix < 0 ? sapling : brown, Math.abs(colMix));
  crowns.setColorAt(i, tmp);
}
trees.forEach((t, i) => placeTree(i, t, 0, 1, 0, 1));
trees.forEach((t, i) => t.i = i);
cutList.forEach((t, j) => { t.j = j; stumps.setMatrixAt(j, zero); });
crowns.instanceColor.needsUpdate = true;

/* ---------- sky ---------- */
const skyU = { top: { value: new THREE.Color() }, hor: { value: new THREE.Color() }, sunCol: { value: new THREE.Color() }, sunDir: { value: new THREE.Vector3() } };
const sky = new THREE.Mesh(new THREE.SphereGeometry(600, 32, 16), new THREE.ShaderMaterial({
  side: THREE.BackSide, depthWrite: false, fog: false, uniforms: skyU,
  vertexShader: `varying vec3 vP; void main(){ vP = normalize(position); gl_Position = projectionMatrix*modelViewMatrix*vec4(position,1.); }`,
  fragmentShader: `uniform vec3 top,hor,sunCol,sunDir; varying vec3 vP;
    void main(){ float h = clamp(vP.y*1.6+0.08,0.,1.); vec3 c = mix(hor, top, pow(h,0.7));
      float s = max(dot(vP, normalize(sunDir)),0.); c += sunCol*(pow(s,600.)*3. + pow(s,12.)*.35 + pow(s,3.)*.12);
      gl_FragColor = vec4(c,1.); }`,
}));
scene.add(sky);

/* ---------- light ---------- */
const hemi = new THREE.HemisphereLight("#cfe6ff", "#24301c", 0.8);
const sun = new THREE.DirectionalLight("#ffd6a0", 2.2);
scene.add(hemi, sun);
scene.fog = new THREE.FogExp2("#6b7c86", 0.006);

/* ---------- mist & cloud-sea ---------- */
function puff() {
  const c = document.createElement("canvas"); c.width = c.height = 128;
  const g = c.getContext("2d"); const gr = g.createRadialGradient(64, 64, 4, 64, 64, 62);
  gr.addColorStop(0, "rgba(255,255,255,.9)"); gr.addColorStop(0.5, "rgba(255,255,255,.35)"); gr.addColorStop(1, "rgba(255,255,255,0)");
  g.fillStyle = gr; g.fillRect(0, 0, 128, 128); const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
}
const puffTex = puff();
const mistMat = new THREE.SpriteMaterial({ map: puffTex, transparent: true, depthWrite: false, opacity: 0.35, color: "#ffffff" });
const mists = [];
for (let i = 0; i < (mobile ? 40 : 80); i++) {
  const s = new THREE.Sprite(mistMat.clone());
  const valley = i % 3 !== 0;
  const x = valley ? -60 - rnd() * 90 : (rnd() - 0.5) * 220, z = (rnd() - 0.5) * 280;
  s.position.set(x, valley ? -30 + rnd() * 10 : H(x, z) + 4 + rnd() * 6, z);
  const sc = valley ? 40 + rnd() * 50 : 18 + rnd() * 20; s.scale.set(sc, sc * 0.45, 1);
  s.userData = { v: 0.4 + rnd() * 0.8, base: s.material.opacity * (valley ? 1.4 : 0.8), valley };
  mists.push(s); scene.add(s);
}

/* ---------- fireflies ---------- */
const dot = (() => { const c = document.createElement("canvas"); c.width = c.height = 64; const g = c.getContext("2d");
  const gr = g.createRadialGradient(32, 32, 0, 32, 32, 32); gr.addColorStop(0, "#fff"); gr.addColorStop(0.25, "rgba(255,240,170,.8)"); gr.addColorStop(1, "rgba(255,220,120,0)");
  g.fillStyle = gr; g.fillRect(0, 0, 64, 64); return new THREE.CanvasTexture(c); })();
const FF = mobile ? 500 : 1100;
const ffPos = new Float32Array(FF * 3), ffSeed = new Float32Array(FF);
for (let i = 0; i < FF; i++) { const x = (rnd() - 0.5) * 200, z = (rnd() - 0.5) * 200; ffPos.set([x, H(x, z) + 1 + rnd() * 7, z], i * 3); ffSeed[i] = rnd() * 100; }
const ffGeo = new THREE.BufferGeometry();
ffGeo.setAttribute("position", new THREE.BufferAttribute(ffPos, 3));
ffGeo.setAttribute("seed", new THREE.BufferAttribute(ffSeed, 1));
const ffU = { t: { value: 0 }, amt: { value: 1 }, map: { value: dot }, px: { value: renderer.getPixelRatio() } };
const fireflies = new THREE.Points(ffGeo, new THREE.ShaderMaterial({
  uniforms: ffU, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
  vertexShader: `attribute float seed; uniform float t,px; varying float vA;
    void main(){ vec3 p = position + vec3(sin(t*.3+seed)*1.5, sin(t*.5+seed*2.)*.8, cos(t*.27+seed)*1.5);
      vec4 mv = modelViewMatrix*vec4(p,1.); gl_Position = projectionMatrix*mv;
      float f = sin(t*2.2+seed*7.); vA = smoothstep(.2,1.,f);
      gl_PointSize = px*(10.+vA*14.)*(30./-mv.z); }`,
  fragmentShader: `uniform sampler2D map; uniform float amt; varying float vA;
    void main(){ vec4 c = texture2D(map, gl_PointCoord); gl_FragColor = vec4(vec3(1.,.9,.45)*c.a*vA*amt*1.6, c.a*vA*amt); }`,
}));
scene.add(fireflies);

/* ---------- dust / smoke over the felling zone ---------- */
const DU = 160, duPos = new Float32Array(DU * 3), duSeed = new Float32Array(DU);
for (let i = 0; i < DU; i++) { const a = rnd() * 6.28, r = Math.sqrt(rnd()) * CUT_R; const x = CUT.x + Math.cos(a) * r, z = CUT.y + Math.sin(a) * r; duPos.set([x, H(x, z) + rnd() * 3, z], i * 3); duSeed[i] = rnd() * 50; }
const duGeo = new THREE.BufferGeometry();
duGeo.setAttribute("position", new THREE.BufferAttribute(duPos, 3)); duGeo.setAttribute("seed", new THREE.BufferAttribute(duSeed, 1));
const duU = { t: { value: 0 }, amt: { value: 0 }, map: { value: puffTex }, px: { value: renderer.getPixelRatio() } };
const dust = new THREE.Points(duGeo, new THREE.ShaderMaterial({
  uniforms: duU, transparent: true, depthWrite: false,
  vertexShader: `attribute float seed; uniform float t,px; varying float vA;
    void main(){ float k = fract(t*.04+seed*.13); vec3 p = position + vec3(sin(seed)*k*6., k*14., cos(seed)*k*6.);
      vec4 mv = modelViewMatrix*vec4(p,1.); gl_Position = projectionMatrix*mv; vA = sin(k*3.14);
      gl_PointSize = px*(40.+k*90.)*(30./-mv.z); }`,
  fragmentShader: `uniform sampler2D map; uniform float amt; varying float vA;
    void main(){ vec4 c = texture2D(map, gl_PointCoord); gl_FragColor = vec4(vec3(.42,.3,.22), c.a*c.a*vA*amt*.09); }`,
}));
scene.add(dust);

/* ---------- post ---------- */
const composer = new EffectComposer(renderer);
composer.addPass(new RenderPass(scene, camera));
const bloom = new UnrealBloomPass(new THREE.Vector2(1, 1), 0.55, 0.6, 0.82);
composer.addPass(bloom);
composer.addPass(new OutputPass());

/* ---------- moods ---------- */
const MOODS = {
  hero: { top: "#0a1626", hor: "#e59a6a", sun: "#ffb27a", fog: "#3b4752", den: 0.0065, sunI: 1.4, hemi: 0.55, sunDir: [-1, 0.12, -0.25], fire: 1, exp: 1.05 },
  day:  { top: "#2f6496", hor: "#e8d2b0", sun: "#fff1d0", fog: "#7f9aa0", den: 0.0045, sunI: 2.6, hemi: 0.95, sunDir: [-0.4, 0.8, 0.3], fire: 0, exp: 1.0 },
  cut:  { top: "#2a1612", hor: "#d0643a", sun: "#ffa36a", fog: "#5a3a2c", den: 0.0042, sunI: 2.6, hemi: 0.95, sunDir: [-1, 0.18, 0.4], fire: 0, exp: 1.0 },
  sign: { top: "#10283c", hor: "#ffcf8a", sun: "#ffd49a", fog: "#7f9294", den: 0.0062, sunI: 2.1, hemi: 0.8, sunDir: [-1, 0.22, -0.1], fire: 0.6, exp: 1.08 },
};
const cur = { top: new THREE.Color(MOODS.hero.top), hor: new THREE.Color(MOODS.hero.hor), sun: new THREE.Color(MOODS.hero.sun), fog: new THREE.Color(MOODS.hero.fog),
  den: MOODS.hero.den, sunI: MOODS.hero.sunI, hemi: MOODS.hero.hemi, sunDir: new THREE.Vector3(...MOODS.hero.sunDir), fire: 1, exp: 1 };
const tgtC = new THREE.Color(), tgtV = new THREE.Vector3();

/* ---------- camera shots ---------- */
const state = { scene: "hero", t: 0, cut: 0, regrow: 0, mx: 0, my: 0, active: true };
const camPos = new THREE.Vector3(60, 30, 70), camLook = new THREE.Vector3(-20, 0, 0);
const wantPos = new THREE.Vector3(), wantLook = new THREE.Vector3();
function shot(time) {
  const s = state.scene, t = state.t;
  if (s === "hero") {
    // drift along the plateau toward the cliff edge, looking out over the cloud-sea
    const x = 70 - t * 70, z = 40 + Math.sin(time * 0.05) * 8 - t * 30;
    wantPos.set(x, 44 + t * 20, z);
    wantLook.set(x - 120, -40 - t * 10, z - 40 + Math.sin(time * 0.04) * 12);
  } else if (s === "cut") {
    // circle the felling zone, rising as the clearing grows
    const a = -0.6 + t * 1.2 + time * 0.01, r = 62 - t * 6, h = 62 + t * 20;
    wantPos.set(CUT.x + Math.cos(a) * r, H(CUT.x, CUT.y) + h, CUT.y + Math.sin(a) * r);
    wantLook.set(CUT.x, H(CUT.x, CUT.y) - 2, CUT.y);
  } else {
    const a = 2.4 + t * 0.6 + time * 0.008, r = 70;
    wantPos.set(CUT.x + Math.cos(a) * r, H(CUT.x, CUT.y) + 52, CUT.y + Math.sin(a) * r);
    wantLook.set(CUT.x - 30, H(CUT.x, CUT.y) - 6, CUT.y);
  }
  wantPos.x += state.mx * 4; wantPos.y += -state.my * 2;
  if (mobile && s === "hero") { wantPos.y += 34; wantLook.y -= 6; }   // phones: fly higher so the plateau, cliff and valley read clearly
}

/* ---------- per-frame felling ---------- */
let lastCut = -1, lastGrow = -1;
function updateFelling() {
  const c = state.cut, g = state.regrow;
  if (Math.abs(c - lastCut) < 0.0005 && Math.abs(g - lastGrow) < 0.0005) return;
  lastCut = c; lastGrow = g;
  const fallSpan = 0.07, haul = 0.1;
  for (const t of cutList) {
    const i = t.i;
    const t0 = t.rank * (1 - fallSpan - haul);
    const f = Math.min(1, Math.max(0, (c - t0) / fallSpan));
    const e = f * f;                                     // accelerate as it topples
    const gone = Math.max(smooth(t0 + fallSpan, t0 + fallSpan + haul, c), smooth(0, 0.35, g)); // logs hauled away
    const sap = smooth(0.25 + t.rank * 0.3, 0.75 + t.rank * 0.25, g);
    if (sap > 0.001) placeTree(i, t, 0, 1, -0.6 * (1 - sap), Math.max(0.05, sap));
    else if (f > 0) { placeTree(i, t, e, 1 - gone, Math.min(1, f * 0.9), 1); if (gone >= 1) { trunks.setMatrixAt(i, zero); crowns.setMatrixAt(i, zero); } }
    else placeTree(i, t, 0, 1, 0, 1);
    const st = f >= 1 && sap < 0.6 ? 1 : 0;
    M.compose(P.set(t.x, t.y - 0.25, t.z), Q.identity(), S.set(t.tw * 1.25 * st, 0.55 * st, t.tw * 1.25 * st));
    stumps.setMatrixAt(t.j, M);
  }
  trunks.instanceMatrix.needsUpdate = crowns.instanceMatrix.needsUpdate = stumps.instanceMatrix.needsUpdate = true;
  crowns.instanceColor.needsUpdate = true;
  // scar the soil
  const scar = new THREE.Color("#9a6238"), k = smooth(0.05, 0.9, c) * (1 - smooth(0.2, 1, g));
  for (let i = 0; i < pos.count; i++) {
    const w = scarW[i] * k; if (w === 0 && cols[i * 3] === baseCols[i * 3]) continue;
    cols[i * 3] = baseCols[i * 3] + (scar.r - baseCols[i * 3]) * w;
    cols[i * 3 + 1] = baseCols[i * 3 + 1] + (scar.g - baseCols[i * 3 + 1]) * w;
    cols[i * 3 + 2] = baseCols[i * 3 + 2] + (scar.b - baseCols[i * 3 + 2]) * w;
  }
  geo.attributes.color.needsUpdate = true;
}

/* ---------- loop ---------- */
function resize() {
  const w = innerWidth, h = innerHeight;
  renderer.setSize(w, h, false); composer.setSize(w, h); camera.aspect = w / h;
  camera.fov = w < 760 ? 62 : 48; camera.updateProjectionMatrix();
}
addEventListener("resize", resize); resize();

const clock = new THREE.Clock();
let first = true;
// adaptive quality: if frames are slow, drop resolution, then the glow
let useBloom = true, ft = 0, fn = 0;
function perf(dt) {
  ft += dt; fn++;
  if (fn < 45) return;
  const avg = ft / fn; ft = 0; fn = 0;
  if (avg > 0.028) {
    if (DPR > 0.7) { DPR = Math.max(0.7, DPR - 0.25); renderer.setPixelRatio(DPR); resize(); }
    else if (useBloom) useBloom = false;
  }
}
function frame() {
  requestAnimationFrame(frame);
  if (!state.active && !first) return;
  const dt = Math.min(clock.getDelta(), 0.05), time = clock.elapsedTime;
  const m = MOODS[state.scene === "hero" && state.t > 0.75 ? "day" : state.scene];
  const k = first ? 1 : 1 - Math.pow(0.02, dt);
  cur.top.lerp(tgtC.set(m.top), k); cur.hor.lerp(tgtC.set(m.hor), k); cur.sun.lerp(tgtC.set(m.sun), k); cur.fog.lerp(tgtC.set(m.fog), k);
  cur.den += (m.den - cur.den) * k; cur.sunI += (m.sunI - cur.sunI) * k; cur.hemi += (m.hemi - cur.hemi) * k;
  cur.fire += (m.fire - cur.fire) * k; cur.exp += (m.exp - cur.exp) * k;
  cur.sunDir.lerp(tgtV.set(...m.sunDir).normalize(), k);
  skyU.top.value.copy(cur.top); skyU.hor.value.copy(cur.hor); skyU.sunCol.value.copy(cur.sun); skyU.sunDir.value.copy(cur.sunDir);
  scene.fog.color.copy(cur.fog); scene.fog.density = cur.den;
  sun.color.copy(cur.sun); sun.intensity = cur.sunI; sun.position.copy(cur.sunDir).multiplyScalar(100);
  hemi.intensity = cur.hemi; renderer.toneMappingExposure = cur.exp;
  ffU.t.value = time; ffU.amt.value = cur.fire;
  duU.t.value = time; duU.amt.value = state.scene === "cut" ? smooth(0.05, 0.3, state.cut) : Math.max(0, duU.amt.value - dt);
  for (const s of mists) {
    s.position.z += s.userData.v * dt * 1.2; if (s.position.z > 150) s.position.z = -150;
    s.material.color.copy(cur.hor).lerp(tgtC.set("#ffffff"), 0.55);
    s.material.opacity = s.userData.base * (state.scene === "cut" ? (s.userData.valley ? 0.6 : 0.15) : 1);
  }
  updateFelling();
  shot(time);
  const ck = first ? 1 : 1 - Math.pow(0.12, dt);
  camPos.lerp(wantPos, ck); camLook.lerp(wantLook, ck);
  camera.position.copy(camPos); camera.lookAt(camLook);
  if (useBloom) composer.render(); else renderer.render(scene, camera);
  perf(dt);
  if (first) { first = false; document.body.classList.add("gl-ready"); }
}
frame();

window.FOREST = { set(s) { Object.assign(state, s); } };
