/* D3 pieces: plant-species dots, the location map, the 233-ha comparator, and the pumped-storage toggle. */
(function () {
  const MR = document.documentElement.lang !== "en";
  const fmt = n => n.toLocaleString(MR ? "mr-IN" : "en-IN");
  const T = (mr, en) => (MR ? mr : en);
  const onView = (el, fn, opts = { threshold: 0.25 }) => {
    if (!el) return;
    const o = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { o.disconnect(); fn(); } }), opts);
    o.observe(el);
  };
  const ready = fn => (window.d3 ? fn() : addEventListener("load", fn));

  /* ---------- pumped storage toggle (no D3 needed) ---------- */
  const psp = document.getElementById("psp");
  if (psp) {
    const btns = psp.querySelectorAll(".psp-ctl button");
    let timer = null;
    btns.forEach(b => b.addEventListener("click", () => { psp.dataset.mode = b.dataset.m; btns.forEach(x => x.classList.toggle("on", x === b)); }));
    // flip day/evening every 5 s until someone taps a button
    onView(psp, () => { timer = setInterval(() => { const n = psp.dataset.mode === "store" ? 1 : 0; psp.dataset.mode = btns[n].dataset.m; btns.forEach((x, k) => x.classList.toggle("on", k === n)); }, 5000); });
    btns.forEach(b => b.addEventListener("click", () => clearInterval(timer)));
  }

  ready(() => {
    const d3 = window.d3; if (!d3) return;

    /* ---------- 1,142 plant dots ---------- */
    const pl = document.getElementById("plants");
    if (pl) {
      const N = 1142, END = 217, THR = 53;
      // pick which dots are endemic / threatened (illustrative); threatened overlaps endemic partly
      const ids = d3.shuffle(d3.range(N));
      const end = new Set(ids.slice(0, END)), thr = new Set(ids.slice(END - 30, END - 30 + THR));
      const root = d3.pack().size([396, 396]).padding(1.2)(d3.hierarchy({ children: d3.range(N).map(i => ({ i, v: 1 + Math.random() * 0.6 })) }).sum(d => d.v));
      const svg = d3.select(pl);
      const dots = svg.append("g").attr("transform", "translate(2,2)").selectAll("circle").data(root.leaves()).join("circle")
        .attr("cx", 198).attr("cy", 198).attr("r", 0).attr("class", "pd");
      onView(pl, () => {
        dots.transition().duration(1400).delay((d, k) => Math.hypot(d.x - 198, d.y - 198) * 3.2 + Math.random() * 120)
          .ease(d3.easeCubicOut).attr("cx", d => d.x).attr("cy", d => d.y).attr("r", d => d.r);
      });
      const chips = document.querySelectorAll(".flora .chip");
      chips.forEach(c => c.addEventListener("click", () => {
        chips.forEach(x => x.classList.toggle("on", x === c));
        const k = c.dataset.k;
        dots.transition().duration(600).delay(() => Math.random() * 300)
          .attr("class", d => {
            const i = d.data.i;
            if (k === "end") return end.has(i) ? "pd end" : "pd dim";
            if (k === "thr") return thr.has(i) ? "pd thr" : "pd dim";
            return "pd";
          })
          .attr("r", d => {
            const i = d.data.i, hit = (k === "end" && end.has(i)) || (k === "thr" && thr.has(i));
            return k === "all" ? d.r : hit ? d.r * 1.35 : d.r * 0.7;
          });
      }));
    }

    /* ---------- schematic location map ---------- */
    const mp = document.getElementById("map");
    if (mp) {
      const W = 400, H = 420;
      const proj = d3.geoMercator().fitExtent([[10, 10], [W - 10, H - 10]], {
        type: "MultiPoint", coordinates: [[72.78, 19.36], [74.0, 18.42]],
      });
      const P = ([lat, lon]) => proj([lon, lat]);
      const svg = d3.select(mp);
      const line = d3.line().curve(d3.curveCatmullRom.alpha(0.5));
      const closed = d3.line().curve(d3.curveCatmullRomClosed.alpha(0.5));

      const defs = svg.append("defs");
      const lg = defs.append("linearGradient").attr("id", "seaG").attr("x1", 0).attr("x2", 1);
      lg.append("stop").attr("offset", 0).attr("stop-color", "#0d2a3a"); lg.append("stop").attr("offset", 1).attr("stop-color", "#0b1a14");
      const rg = defs.append("radialGradient").attr("id", "sancG");
      rg.append("stop").attr("offset", 0).attr("stop-color", "#9be07a").attr("stop-opacity", .55); rg.append("stop").attr("offset", 1).attr("stop-color", "#3f7a3a").attr("stop-opacity", .25);

      svg.append("rect").attr("width", W).attr("height", H).attr("fill", "#0b1a12").attr("rx", 14);
      // land is the default; the sea is drawn to the left of a rough coastline
      const coast = [[19.4, 72.79], [19.27, 72.79], [19.18, 72.81], [19.08, 72.82], [18.97, 72.80], [18.9, 72.81], [18.85, 72.9], [18.78, 72.92], [18.65, 72.88], [18.5, 72.93], [18.38, 72.96]].map(P);
      svg.append("path").attr("d", line(coast) + `L0,${H} L0,0 Z`).attr("fill", "url(#seaG)");
      svg.append("path").attr("d", line(coast)).attr("fill", "none").attr("stroke", "#4c8fb0").attr("stroke-opacity", .5);
      svg.append("text").attr("class", "m-sea").attr("x", 22).attr("y", H * 0.55).text(T("अरबी समुद्र", "Arabian Sea")).attr("transform", `rotate(-90 22 ${H * 0.55})`);

      // Sahyadri escarpment
      const ghat = [[19.4, 73.66], [19.25, 73.6], [19.12, 73.52], [19.0, 73.47], [18.88, 73.42], [18.75, 73.4], [18.6, 73.42], [18.4, 73.48]].map(P);
      svg.append("path").attr("d", line(ghat)).attr("class", "m-ghat");
      const gl = P([18.66, 73.43]);
      svg.append("text").attr("class", "m-lbl ghat").attr("x", gl[0] + 6).attr("y", gl[1]).text(T("सह्याद्री कडा", "Sahyadri escarpment"));
      svg.append("text").attr("class", "m-zone").attr("x", P([18.62, 73.1])[0]).attr("y", P([18.62, 73.1])[1]).text(T("कोकण", "KONKAN"));
      svg.append("text").attr("class", "m-zone").attr("x", P([18.75, 73.75])[0]).attr("y", P([18.75, 73.75])[1]).text(T("देश / पठार", "DECCAN"));

      // sanctuary (approximate outline)
      const sanc = [[19.17, 73.55], [19.14, 73.61], [19.07, 73.6], [19.0, 73.57], [18.98, 73.51], [19.03, 73.47], [19.1, 73.48], [19.15, 73.5]].map(P);
      const sp = svg.append("path").attr("d", closed(sanc)).attr("fill", "url(#sancG)").attr("stroke", "#9be07a").attr("stroke-width", 1.2).attr("stroke-dasharray", "3 3");

      // rivers
      const rivers = [
        { c: [[18.83, 73.4], [18.88, 73.36], [18.91, 73.32], [18.98, 73.31], [19.05, 73.31], [19.15, 73.26], [19.22, 73.16], [19.24, 73.1], [19.25, 73.02]], n: T("उल्हास", "Ulhas"), at: 5 },
        { c: [[19.05, 73.48], [19.0, 73.44], [18.97, 73.4], [18.94, 73.36], [18.93, 73.33]], n: T("पेज", "Pej"), at: 1, hot: true },
        { c: [[19.07, 73.55], [19.04, 73.62], [18.98, 73.7], [18.95, 73.8], [18.9, 73.9], [18.86, 74.0]], n: T("भीमा", "Bhima"), at: 3 },
      ];
      const rv = svg.append("g");
      rivers.forEach(r => {
        const pts = r.c.map(P);
        const path = rv.append("path").attr("d", line(pts)).attr("class", "m-river" + (r.hot ? " hot" : ""));
        const L = path.node().getTotalLength();
        path.attr("stroke-dasharray", `${L} ${L}`).attr("stroke-dashoffset", L).attr("data-l", L);
        const q = pts[r.at];
        rv.append("text").attr("class", "m-riv").attr("x", q[0] + 5).attr("y", q[1] - 4).text(r.n);
      });

      // towns
      const towns = [
        [19.076, 72.877, T("मुंबई", "Mumbai"), "big"], [19.218, 72.978, T("ठाणे", "Thane")], [19.243, 73.135, T("कल्याण", "Kalyan")],
        [19.155, 73.265, T("बदलापूर", "Badlapur")], [18.91, 73.325, T("कर्जत", "Karjat")], [18.754, 73.405, T("लोणावळा", "Lonavala")], [18.52, 73.857, T("पुणे", "Pune"), "big"],
      ];
      const tg = svg.append("g");
      towns.forEach(([la, lo, n, big]) => {
        const [x, y] = P([la, lo]);
        tg.append("circle").attr("cx", x).attr("cy", y).attr("r", big ? 4.5 : 3).attr("class", "m-town");
        tg.append("text").attr("x", x + 7).attr("y", y + 4).attr("class", "m-lbl" + (big ? " big" : "")).text(n);
      });

      // temple + project site
      const [tx, ty] = P([19.0717, 73.5357]);
      svg.append("text").attr("x", tx).attr("y", ty + 4).attr("text-anchor", "middle").attr("class", "m-ico").text("🛕");
      svg.append("text").attr("x", tx + 10).attr("y", ty - 12).attr("class", "m-lbl sanc").text(T("भीमाशंकर अभयारण्य", "Bhimashankar sanctuary"));
      const [sx, sy] = P([18.975, 73.415]);
      const site = svg.append("g").attr("class", "m-site").attr("transform", `translate(${sx},${sy})`);
      site.append("circle").attr("r", 16).attr("class", "ring2");
      site.append("circle").attr("r", 16).attr("class", "ring2 b");
      site.append("circle").attr("r", 6).attr("class", "core");
      const lab = svg.append("g").attr("transform", `translate(${sx - 20},${sy - 30})`);
      lab.append("text").attr("class", "m-lbl site").attr("text-anchor", "end").text(T("प्रकल्प जागा (अंदाजे)", "Project site (approx.)"));
      lab.append("text").attr("class", "m-lbl sm").attr("text-anchor", "end").attr("y", 15).text(T("सैदोंगर · ३२,०००+ झाडं", "Saidongar · 32,000+ trees"));

      // scale bar: 10 km
      const a = P([18.47, 73.62]), b = proj([73.62 + 10 / (111.32 * Math.cos(18.47 * Math.PI / 180)), 18.47]);
      svg.append("path").attr("d", `M${a[0]},${a[1]} H${b[0]}`).attr("stroke", "#a9b8a3").attr("stroke-width", 2);
      svg.append("text").attr("x", (a[0] + b[0]) / 2).attr("y", a[1] - 6).attr("text-anchor", "middle").attr("class", "m-lbl sm").text(T("१० किमी", "10 km"));

      onView(mp, () => {
        svg.selectAll(".m-river").transition().duration(2600).delay((d, i) => 300 + i * 500).ease(d3.easeCubicInOut).attr("stroke-dashoffset", 0);
        sp.attr("opacity", 0).transition().duration(1200).attr("opacity", 1);
        mp.classList.add("live");
      });
    }

    /* ---------- 233 ha comparator ---------- */
    const ar = document.getElementById("area");
    if (ar) {
      const S = 380, O = 10, HA = 233;
      const svg = d3.select(ar);
      svg.append("defs").append("clipPath").attr("id", "areaClip").append("rect").attr("x", O).attr("y", O).attr("width", S).attr("height", S).attr("rx", 6);
      svg.append("rect").attr("x", O).attr("y", O).attr("width", S).attr("height", S).attr("rx", 6).attr("class", "a-big");
      const g = svg.append("g").attr("clip-path", "url(#areaClip)");
      const num = document.getElementById("areaN"), lbl = document.getElementById("areaL");
      function show(chip) {
        const trees = !!chip.dataset.trees;
        let cells;
        if (trees) {
          const n = 3200, cols = Math.ceil(Math.sqrt(n)), step = S / cols;
          cells = d3.range(n).map(i => ({ k: "t" + i, x: O + (i % cols) * step + step / 2, y: O + Math.floor(i / cols) * step + step / 2, s: step, tree: true }));
        } else {
          const u = +chip.dataset.u, side = S * Math.sqrt(u / HA), cols = Math.ceil(S / side), rows = Math.ceil(S / side);
          cells = [];
          for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) cells.push({ k: `${u}-${r}-${c}`, x: O + c * side, y: O + r * side, s: side });
        }
        const sel = g.selectAll(".cell").data(cells, d => d.k);
        sel.exit().transition().duration(300).attr("opacity", 0).remove();
        const en = sel.enter().append(d => document.createElementNS("http://www.w3.org/2000/svg", d.tree ? "circle" : "rect"))
          .attr("class", d => "cell" + (d.tree ? " tr" : "")).attr("opacity", 0);
        en.filter(d => !d.tree).attr("x", d => d.x + 1).attr("y", d => d.y + 1).attr("width", d => Math.max(0.5, d.s - 2)).attr("height", d => Math.max(0.5, d.s - 2)).attr("rx", d => Math.min(4, d.s * 0.12));
        en.filter(d => d.tree).attr("cx", d => d.x).attr("cy", d => d.y).attr("r", d => d.s * 0.38);
        en.transition().duration(500).delay((d, i) => Math.min(1400, i * (trees ? 0.45 : 6))).attr("opacity", 1);
        const count = trees ? 32000 : Math.round(HA / +chip.dataset.u);
        d3.select(num).transition().duration(900).tween("t", () => { const f = d3.interpolateNumber(0, count); return t => num.textContent = fmt(Math.round(f(t))); });
        lbl.textContent = chip.dataset.l;
      }
      const chips = document.querySelectorAll("#areaChips .chip");
      chips.forEach(c => c.addEventListener("click", () => { chips.forEach(x => x.classList.toggle("on", x === c)); show(c); }));
      onView(ar, () => show(chips[0]));
    }
  });
})();
