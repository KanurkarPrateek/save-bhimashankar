/* 3D Shekru: a procedural Indian giant squirrel with shell-texture fur.
   Drag sideways to turn it, tap "उडी" to make it leap, tap the dots for facts. */
import * as THREE from "three";

const host = document.getElementById("shekru3d");
if (host) init(host);

function init(host) {
  const canvas = host.querySelector("canvas");
  const small = matchMedia("(max-width: 760px)").matches;
  const SHELLS = small ? 18 : 30;

  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: "high-performance" });
  renderer.setPixelRatio(Math.min(devicePixelRatio, small ? 1.75 : 2));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.15;

  const scene = new THREE.Scene();
  scene.fog = new THREE.FogExp2(0x0b1a10, 0.045);
  const cam = new THREE.PerspectiveCamera(34, 1, 0.1, 100);

  // lights are passed into the fur shader by hand, so keep them as plain vectors too
  const KEY = new THREE.Vector3(0.6, 1.0, 0.7).normalize();
  const RIM = new THREE.Vector3(-0.7, 0.3, -0.8).normalize();
  scene.add(new THREE.HemisphereLight(0xdfffd0, 0x1d2a14, 0.9));
  const sun = new THREE.DirectionalLight(0xffe2b0, 2.4); sun.position.copy(KEY).multiplyScalar(10); scene.add(sun);
  const rim = new THREE.DirectionalLight(0x9be07a, 1.2); rim.position.copy(RIM).multiplyScalar(10); scene.add(rim);

  /* ---------- fur shader (shells) ---------- */
  const noise = (() => {
    const N = 128, d = new Uint8Array(N * N * 4);
    for (let i = 0; i < N * N; i++) { const v = Math.random() * 255; d[i * 4] = v; d[i * 4 + 1] = Math.random() * 255; d[i * 4 + 2] = 0; d[i * 4 + 3] = 255; }
    const t = new THREE.DataTexture(d, N, N); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.magFilter = t.minFilter = THREE.NearestFilter; t.needsUpdate = true; return t;
  })();
  const shared = { uTime: { value: 0 }, uNoise: { value: noise }, uKey: { value: KEY }, uRim: { value: RIM }, uSway: { value: 1 } };

  function furMaterial({ h, len, density, tail = false }) {
    return new THREE.ShaderMaterial({
      uniforms: { ...shared, uH: { value: h }, uLen: { value: len }, uDen: { value: density } },
      transparent: h > 0, depthWrite: h === 0, side: THREE.FrontSide,
      vertexShader: /* glsl */`
        uniform float uH, uLen, uTime, uSway; attribute vec3 color; attribute float tailT;
        varying vec2 vUv; varying vec3 vN, vC; varying float vT;
        void main(){
          vUv = uv; vC = color; vT = tailT;
          vec3 p = position + normal * uLen * uH;
          ${tail ? `float s = tailT*tailT; p.x += sin(uTime*1.25 - tailT*2.6) * .42 * s * uSway; p.z += cos(uTime*.9 - tailT*2.) * .12 * s * uSway;` : ``}
          p.y -= uH*uH*uLen*.35;                       // fur droops a little
          vN = normalize(mat3(modelMatrix) * normal);
          gl_Position = projectionMatrix * modelViewMatrix * vec4(p,1.);
        }`,
      fragmentShader: /* glsl */`
        uniform float uH, uDen; uniform sampler2D uNoise; uniform vec3 uKey, uRim;
        varying vec2 vUv; varying vec3 vN, vC; varying float vT;
        void main(){
          vec2 g = vUv * uDen;
          vec4 n = texture2D(uNoise, g / 128.);
          if (uH > 0.) {
            vec2 c = fract(g) * 2. - 1.;
            float strand = n.r;
            if (strand < uH || length(c) > (strand - uH) * 2.2) discard;
          }
          vec3 N = normalize(vN);
          float key = max(dot(N, uKey), 0.);
          float rim = pow(1. - abs(N.z*.6 + N.y*.2), 3.) * max(dot(N, uRim)+.4, 0.);
          float ao = mix(.38, 1., uH);
          vec3 col = vC * (0.42 + key * 0.95) * ao + vec3(.8,1.,.6) * rim * .25 * uH;
          col *= mix(.92, 1.08, n.g);                    // per-strand tint
          gl_FragColor = vec4(col, 1.);
        }`,
    });
  }

  const C = { maroon: new THREE.Color("#7a2a16"), deep: new THREE.Color("#3b120a"), black: new THREE.Color("#1c0b07"), cream: new THREE.Color("#ecd3a2"), buff: new THREE.Color("#c99a5c") };

  // bake fur colour per vertex: dark maroon on the back, cream underneath
  function paint(geo, fn) {
    const p = geo.attributes.position, n = geo.attributes.normal, col = new Float32Array(p.count * 3), c = new THREE.Color();
    for (let i = 0; i < p.count; i++) { fn(c, p.getX(i), p.getY(i), p.getZ(i), n.getX(i), n.getY(i), n.getZ(i)); col.set([c.r, c.g, c.b], i * 3); }
    geo.setAttribute("color", new THREE.BufferAttribute(col, 3));
    if (!geo.attributes.tailT) geo.setAttribute("tailT", new THREE.BufferAttribute(new Float32Array(p.count), 1));
    return geo;
  }
  const mixC = (c, a, b, t) => c.copy(a).lerp(b, THREE.MathUtils.clamp(t, 0, 1));
  const ss = (a, b, x) => { const t = THREE.MathUtils.clamp((x - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };

  function furry(geo, opts) {
    const g = new THREE.Group();
    for (let i = 0; i < SHELLS; i++) {
      const m = new THREE.Mesh(geo, furMaterial({ ...opts, h: i / (SHELLS - 1) }));
      m.renderOrder = i; m.frustumCulled = false; g.add(m);
    }
    return g;
  }

  // ellipsoid helper, baked into geometry so normals stay right
  function ellipsoid(rx, ry, rz, seg = 40) {
    const g = new THREE.SphereGeometry(1, seg, Math.round(seg * .75));
    g.scale(rx, ry, rz); g.computeVertexNormals(); return g;
  }

  /* ---------- the squirrel ---------- */
  const sq = new THREE.Group();      // root: moves when it leaps
  const body = new THREE.Group(); sq.add(body);

  const backFur = (c, x, y, z, nx, ny, nz) => {
    const up = ss(-0.35, 0.45, ny);
    mixC(c, C.cream, C.maroon, up);
    if (ny > 0.55 && Math.abs(nx) < 0.5) c.lerp(C.deep, ss(0.55, 0.95, ny) * 0.75);   // dark saddle
  };

  const torso = ellipsoid(0.52, 0.46, 1.0); torso.translate(0, 0.5, 0);
  body.add(furry(paint(torso, backFur), { len: 0.07, density: 260 }));

  const haunch = ellipsoid(0.55, 0.52, 0.55); haunch.translate(0, 0.5, -0.62);
  body.add(furry(paint(haunch, backFur), { len: 0.07, density: 200 }));

  const chest = ellipsoid(0.4, 0.42, 0.42); chest.translate(0, 0.58, 0.72);
  body.add(furry(paint(chest, (c, x, y, z, nx, ny, nz) => { mixC(c, C.cream, C.maroon, ss(-0.1, 0.7, ny) * ss(-0.2, 0.4, -nz + ny)); }), { len: 0.06, density: 180 }));

  const head = new THREE.Group(); head.position.set(0, 0.86, 1.12); body.add(head);
  const skull = ellipsoid(0.34, 0.31, 0.4); skull.rotateX(-0.25);
  head.add(furry(paint(skull, (c, x, y, z, nx, ny, nz) => {
    mixC(c, C.cream, C.maroon, ss(-0.2, 0.5, ny + nz * -0.2));
    if (nz > 0.5 && ny > -0.3) c.lerp(C.buff, 0.55);                         // pale face
    if (ny > 0.6) c.lerp(C.black, 0.45);                                      // dark crown
  }), { len: 0.04, density: 200 }));
  const snout = ellipsoid(0.17, 0.15, 0.2); snout.translate(0, -0.08, 0.35);
  head.add(furry(paint(snout, c => c.copy(C.cream)), { len: 0.025, density: 150 }));
  const nose = new THREE.Mesh(new THREE.SphereGeometry(0.055, 16, 12), new THREE.MeshStandardMaterial({ color: 0x3a1f1a, roughness: 0.35 }));
  nose.position.set(0, -0.04, 0.55); head.add(nose);
  const eyeM = new THREE.MeshStandardMaterial({ color: 0x050302, roughness: 0.08, metalness: 0.2 });
  for (const s of [-1, 1]) {
    const e = new THREE.Mesh(new THREE.SphereGeometry(0.065, 20, 14), eyeM); e.position.set(s * 0.22, 0.06, 0.24); head.add(e);
    const glint = new THREE.Mesh(new THREE.SphereGeometry(0.016, 8, 6), new THREE.MeshBasicMaterial({ color: 0xffffff })); glint.position.set(s * 0.24, 0.09, 0.3); head.add(glint);
    const ear = new THREE.ConeGeometry(0.1, 0.24, 18, 1); ear.translate(0, 0.12, 0); ear.computeVertexNormals();
    const eg = furry(paint(ear, c => c.copy(C.deep)), { len: 0.04, density: 50 });
    eg.position.set(s * 0.17, 0.24, -0.05); eg.rotation.set(-0.25, 0, s * -0.35); head.add(eg);
    const wh = new THREE.Group(); // whiskers
    for (let k = 0; k < 3; k++) {
      const l = new THREE.Line(new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(0, 0, 0), new THREE.Vector3(s * 0.38, -0.05 + k * 0.05, -0.05)]), new THREE.LineBasicMaterial({ color: 0x2a1a12, transparent: true, opacity: 0.6 }));
      wh.add(l);
    }
    wh.position.set(s * 0.1, -0.08, 0.48); head.add(wh);
  }

  // legs: cream forearms with dark hands gripping the branch
  const limbs = [];
  function leg(x, z, r, hgt, dark) {
    const g = new THREE.CapsuleGeometry(r, hgt, 6, 16); g.computeVertexNormals();
    const m = furry(paint(g, (c, px, py) => mixC(c, dark ? C.maroon : C.cream, C.deep, ss(-hgt / 2, -hgt / 2 - r * 0.8, py))), { len: 0.04, density: 50 });
    m.position.set(x, 0.18, z); body.add(m); limbs.push(m); return m;
  }
  leg(-0.3, 0.75, 0.1, 0.32, false).rotation.x = 0.35;
  leg(0.3, 0.75, 0.1, 0.32, false).rotation.x = 0.35;
  leg(-0.42, -0.62, 0.14, 0.22, true).rotation.x = -0.3;
  leg(0.42, -0.62, 0.14, 0.22, true).rotation.x = -0.3;

  // tail: a custom tube along a curve with a bushy radius profile
  const tailPivot = new THREE.Group(); tailPivot.position.set(0, 0.55, -1.05); body.add(tailPivot);
  const tailCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(0, 0, 0), new THREE.Vector3(0, -0.1, -0.35), new THREE.Vector3(0, -0.6, -0.6),
    new THREE.Vector3(0, -1.4, -0.55), new THREE.Vector3(0, -2.3, -0.42), new THREE.Vector3(0, -3.0, -0.35),
  ]);
  function tailGeo(curve, segs = 90, radial = 22) {
    const frames = curve.computeFrenetFrames(segs, false), pos = [], nor = [], uv = [], tt = [], idx = [];
    for (let i = 0; i <= segs; i++) {
      const t = i / segs, P = curve.getPointAt(t), N = frames.normals[i], B = frames.binormals[i];
      const r = 0.12 + 0.24 * Math.sin(Math.PI * Math.min(1, t * 1.15)) ** 0.6 * (t < 0.92 ? 1 : 1 - (t - 0.92) / 0.08 * 0.85);
      for (let j = 0; j <= radial; j++) {
        const a = j / radial * Math.PI * 2, cx = Math.cos(a), sx = Math.sin(a);
        const n = new THREE.Vector3().addScaledVector(N, cx).addScaledVector(B, sx).normalize();
        pos.push(P.x + n.x * r, P.y + n.y * r, P.z + n.z * r); nor.push(n.x, n.y, n.z); uv.push(t * 6, j / radial); tt.push(t);
      }
    }
    for (let i = 0; i < segs; i++) for (let j = 0; j < radial; j++) {
      const a = i * (radial + 1) + j, b = a + radial + 1;
      idx.push(a, b, a + 1, b, b + 1, a + 1);
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute("normal", new THREE.Float32BufferAttribute(nor, 3));
    g.setAttribute("uv", new THREE.Float32BufferAttribute(uv, 2)); g.setAttribute("tailT", new THREE.Float32BufferAttribute(tt, 1)); g.setIndex(idx);
    return g;
  }
  const tg = tailGeo(tailCurve);
  paint(tg, (c, x, y, z, nx, ny, nz) => { const t = -y / 3; mixC(c, C.maroon, C.deep, t * 1.3); if (t > 0.85) c.lerp(C.buff, (t - 0.85) * 3); });
  const tail = furry(tg, { len: 0.22, density: 140, tail: true });
  tailPivot.add(tail);

  /* ---------- branches + canopy ---------- */
  const barkTex = (() => {
    const c = document.createElement("canvas"); c.width = 256; c.height = 64; const x = c.getContext("2d");
    x.fillStyle = "#3b2a1c"; x.fillRect(0, 0, 256, 64);
    for (let i = 0; i < 260; i++) { x.fillStyle = `rgba(${20 + Math.random() * 60},${15 + Math.random() * 40},${10 + Math.random() * 20},.55)`; x.fillRect(Math.random() * 256, Math.random() * 64, 6 + Math.random() * 40, 1 + Math.random() * 3); }
    for (let i = 0; i < 70; i++) { x.fillStyle = `rgba(${70 + Math.random() * 50},${110 + Math.random() * 60},${40},${.35 + Math.random() * .4})`; x.beginPath(); x.arc(Math.random() * 256, Math.random() * 30, 2 + Math.random() * 7, 0, 7); x.fill(); }
    const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(4, 1); t.colorSpace = THREE.SRGBColorSpace; return t;
  })();
  const barkM = new THREE.MeshStandardMaterial({ map: barkTex, roughness: 0.95 });
  function branch(pts, r) {
    const curve = new THREE.CatmullRomCurve3(pts.map(p => new THREE.Vector3(...p)));
    const m = new THREE.Mesh(new THREE.TubeGeometry(curve, 60, r, 14, false), barkM); scene.add(m); return curve;
  }
  const B1 = branch([[-1, -0.25, -6], [0.1, -0.12, -2], [0, -0.1, 1.5], [0.4, 0.05, 4]], 0.22);
  const B2 = branch([[10.5, 0.4, -6], [8.6, 0.6, -1.5], [8.2, 0.8, 1.4], [9.2, 1.1, 5]], 0.2);
  branch([[0.2, -0.12, -1.2], [-1.5, 0.6, -2.4], [-2.6, 1.6, -2.8]], 0.08);
  branch([[0.1, -0.1, 2.2], [1.6, 0.4, 3], [2.4, 1.2, 3.8]], 0.07);
  const B2pos = B2.getPointAt(0.5);

  // leaves: an instanced canopy kept well away from the camera's orbit
  const ls = new THREE.Shape(); ls.moveTo(0, 0); ls.quadraticCurveTo(0.16, 0.11, 0.42, 0); ls.quadraticCurveTo(0.16, -0.11, 0, 0);
  const leafGeo = new THREE.ShapeGeometry(ls, 6);
  const leafM = new THREE.MeshStandardMaterial({ color: 0xffffff, side: THREE.DoubleSide, roughness: 0.6 });
  const LN = small ? 900 : 1800, leaves = new THREE.InstancedMesh(leafGeo, leafM, LN), dummy = new THREE.Object3D(), lc = new THREE.Color();
  const clusters = [];
  for (let k = 0; k < 26; k++) { const a = Math.random() * Math.PI * 2, r = 10.5 + Math.random() * 6; clusters.push([Math.cos(a) * r, -1.5 + Math.random() * 7, Math.sin(a) * r, 1.4 + Math.random() * 1.4]); }
  for (let k = 0; k < 10; k++) { const a = Math.random() * Math.PI * 2, r = 3 + Math.random() * 8; clusters.push([Math.cos(a) * r, 7 + Math.random() * 2, Math.sin(a) * r, 1.8]); }
  for (let i = 0; i < LN; i++) {
    const c = clusters[i % clusters.length], u = new THREE.Vector3().randomDirection().multiplyScalar(Math.cbrt(Math.random()) * c[3]);
    dummy.position.set(c[0] + u.x, c[1] + u.y * 0.7, c[2] + u.z);
    dummy.rotation.set(Math.random() * 6, Math.random() * 6, Math.random() * 6); dummy.scale.setScalar(0.8 + Math.random() * 0.8);
    dummy.updateMatrix(); leaves.setMatrixAt(i, dummy.matrix);
    leaves.setColorAt(i, lc.setHSL(0.22 + Math.random() * 0.1, 0.5 + Math.random() * 0.25, 0.16 + Math.random() * 0.2));
  }
  scene.add(leaves);

  // drifting light motes
  const MN = 160, mg = new THREE.BufferGeometry(), mp = new Float32Array(MN * 3);
  for (let i = 0; i < MN; i++) mp.set([(Math.random() - .5) * 16, Math.random() * 7 - 2.5, (Math.random() - .5) * 14], i * 3);
  mg.setAttribute("position", new THREE.BufferAttribute(mp, 3));
  const motes = new THREE.Points(mg, new THREE.PointsMaterial({ color: 0xf3ff9a, size: 0.06, transparent: true, opacity: 0.7, blending: THREE.AdditiveBlending, depthWrite: false }));
  scene.add(motes);

  sq.position.set(0, 0.05, 0); scene.add(sq);
  sq.scale.setScalar(0.92);

  /* ---------- hotspots: 3D anchors projected to HTML dots ---------- */
  const hot = [...host.querySelectorAll(".hs")].map(el => ({ el, obj: { tail: tail, head: head, back: body, hand: limbs[0], ear: head }[el.dataset.at], off: new THREE.Vector3(...el.dataset.off.split(",").map(Number)) }));
  const card = host.querySelector(".hs-card"), cardT = card?.querySelector("b"), cardP = card?.querySelector("p");
  hot.forEach(h => h.el.addEventListener("click", e => {
    e.stopPropagation();
    hot.forEach(o => o.el.classList.toggle("on", o === h));
    cardT.textContent = h.el.dataset.t; cardP.innerHTML = h.el.dataset.p; card.classList.add("show");
    if (h.el.dataset.at === "tail") swish = 1;
  }));
  card?.addEventListener("click", () => { card.classList.remove("show"); hot.forEach(o => o.el.classList.remove("on")); });

  /* ---------- interaction ---------- */
  let yaw = 0.75, yawT = 0.75, pitch = 0.22, dragging = false, lastX = 0, idle = 0, swish = 0;
  canvas.addEventListener("pointerdown", e => { dragging = true; lastX = e.clientX; idle = 0; });
  addEventListener("pointerup", () => dragging = false);
  canvas.addEventListener("pointercancel", () => dragging = false);
  canvas.addEventListener("pointermove", e => { if (!dragging) return; yawT += (e.clientX - lastX) * 0.008; lastX = e.clientX; idle = 0; });

  let leap = -1; // -1 idle, else 0..1 progress of a there-and-back jump
  const leapBtn = host.querySelector(".leap");
  leapBtn?.addEventListener("click", () => { if (leap < 0) { leap = 0; leapBtn.disabled = true; } });

  function resize() {
    const r = host.getBoundingClientRect();
    renderer.setSize(r.width, r.height, false);
    cam.aspect = r.width / r.height;
    cam.fov = cam.aspect < 0.8 ? 44 : 34;
    cam.updateProjectionMatrix();
  }
  new ResizeObserver(resize).observe(host); resize();

  let visible = false;
  new IntersectionObserver(([e]) => { visible = e.isIntersecting; if (visible) loop(); }, { rootMargin: "100px" }).observe(host);

  const clock = new THREE.Clock(), tmp = new THREE.Vector3();
  const home = new THREE.Vector3(0, 0.05, 0), far = new THREE.Vector3(B2pos.x, B2pos.y + 0.18, B2pos.z);
  let running = false;
  function loop() {
    if (running) return; running = true;
    const tick = () => {
      if (!visible) { running = false; return; }
      const dt = Math.min(clock.getDelta(), 0.05), t = clock.elapsedTime;
      shared.uTime.value = t;
      idle += dt; if (!dragging && idle > 2.5) yawT += dt * 0.18;
      yaw += (yawT - yaw) * 0.08;

      // breathing + head looking around
      body.scale.set(1, 1 + Math.sin(t * 2.2) * 0.012, 1);
      head.rotation.y = Math.sin(t * 0.6) * 0.35 + Math.sin(t * 1.7) * 0.05;
      head.rotation.x = Math.sin(t * 0.45) * 0.12 - 0.05;

      swish = Math.max(0, swish - dt * 0.6);
      shared.uSway.value = 1 + swish * 2.5;

      // leap: arc to the far branch and back, tail swings out straight as a rudder
      if (leap >= 0) {
        leap += dt / 3.2;
        const p = leap < 0.5 ? leap * 2 : (leap - 0.5) * 2, out = leap < 0.5;
        const a = out ? home : far, b = out ? far : home;
        const k = p < 0.25 ? 0 : p > 0.75 ? 1 : (p - 0.25) / 0.5;            // crouch, fly, land
        const e = k * k * (3 - 2 * k);
        sq.position.lerpVectors(a, b, e); sq.position.y += Math.sin(e * Math.PI) * 2.2;
        const dir = tmp.subVectors(b, a); sq.rotation.y = Math.atan2(dir.x, dir.z);
        const fly = Math.sin(Math.min(1, Math.max(0, (p - 0.2) / 0.6)) * Math.PI);
        tailPivot.rotation.x = fly * 1.25;
        body.scale.z = 1 + fly * 0.18; body.position.y = -Math.sin(Math.min(p / 0.25, 1) * Math.PI) * 0.08 * (p < 0.25 ? 1 : 0);
        limbs.forEach((l, i) => l.rotation.x = (i < 2 ? 0.35 + fly * 0.9 : -0.3 - fly * 0.9));
        if (leap >= 1) { leap = -1; sq.position.copy(home); sq.rotation.y = 0; tailPivot.rotation.x = 0; leapBtn.disabled = false; }
      }

      const look = new THREE.Vector3().copy(sq.position).add(new THREE.Vector3(0, 0.1, 0));
      const R = cam.aspect < 0.8 ? 6.6 : 7.4;
      cam.position.set(look.x + Math.sin(yaw) * R * Math.cos(pitch), look.y + 0.9 + Math.sin(pitch) * R, look.z + Math.cos(yaw) * R * Math.cos(pitch));
      cam.lookAt(look.x, look.y - (cam.aspect < 0.8 ? 0.7 : 0.35), look.z);

      motes.rotation.y = t * 0.02; motes.position.y = Math.sin(t * 0.3) * 0.2;
      renderer.render(scene, cam);

      // place hotspot dots
      const r = host.getBoundingClientRect();
      for (const h of hot) {
        h.obj.updateWorldMatrix(true, false);
        tmp.copy(h.off).applyMatrix4(h.obj.matrixWorld).project(cam);
        const hidden = tmp.z > 1 || leap >= 0;
        h.el.style.transform = `translate(${((tmp.x + 1) / 2 * r.width).toFixed(1)}px,${((1 - tmp.y) / 2 * r.height).toFixed(1)}px)`;
        h.el.style.opacity = hidden ? 0 : 1;
      }
      requestAnimationFrame(tick);
    };
    clock.getDelta(); tick();
  }
  host.classList.add("ready");
}
