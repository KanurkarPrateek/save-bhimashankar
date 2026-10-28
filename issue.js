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

    /* ---------- location map: satellite relief + OpenStreetMap rivers and sanctuary ---------- */
    const mp = document.getElementById("map");
    if (mp) {
      const root = document.querySelector('link[rel=stylesheet][href*="style.css"]').href.replace(/style\.css.*$/, "");
      fetch(root + "data/map.json").then(r => r.json()).then(M => drawMap(mp, M, root)).catch(() => {});
    }
    function drawMap(mp, M, root) {
      const svg = d3.select(mp), P = M.pts, line = d3.line().curve(d3.curveCatmullRom.alpha(0.5));
      const site = [(P.upper[0] + P.lower[0]) / 2, (P.upper[1] + P.lower[1]) / 2];
      const g = svg.append("g");
      const defs = svg.append("defs");
      const f = defs.append("filter").attr("id", "mGlow").attr("x", "-50%").attr("y", "-50%").attr("width", "200%").attr("height", "200%");
      f.append("feGaussianBlur").attr("stdDeviation", 4).attr("result", "b");
      const fm = f.append("feMerge"); fm.append("feMergeNode").attr("in", "b"); fm.append("feMergeNode").attr("in", "SourceGraphic");

      g.append("image").attr("href", root + "img/map-sat.jpg").attr("width", M.w).attr("height", M.h).attr("class", "m-sat");
      g.append("rect").attr("width", M.w).attr("height", M.h).attr("class", "m-tint");

      const sanc = g.append("g");
      M.sanc.forEach(r => sanc.append("path").attr("d", "M" + r.join("L") + "Z").attr("class", "m-sanc"));
      const rv = g.append("g");
      const rivers = [["ulhas", ""], ["bhima", ""], ["pej", " hot"]];
      rivers.forEach(([k, c]) => M[k].forEach(seg => rv.append("path").attr("d", line(seg)).attr("class", "m-river" + c)));

      // official distance between the project and the sanctuary
      const dist = g.append("path").attr("d", `M${site[0]},${site[1]}L${M.near[0]},${M.near[1]}`).attr("class", "m-dist");

      const L = g.append("g"), labels = [];
      const lab = (x, y, t, cls, anchor = "start") => { const el = L.append("text").attr("x", x).attr("y", y).attr("class", "m-lbl " + (cls || "")).attr("text-anchor", anchor).text(t); labels.push(el); return el; };
      const towns = [["mumbai", T("मुंबई", "Mumbai"), "big"], ["thane", T("ठाणे", "Thane")], ["kalyan", T("कल्याण", "Kalyan")], ["badlapur", T("बदलापूर", "Badlapur")], ["neral", T("नेरळ", "Neral")], ["karjat", T("कर्जत", "Karjat"), "big"], ["lonavala", T("लोणावळा", "Lonavala")], ["pune", T("पुणे", "Pune"), "big"]];
      const dots = L.append("g");
      const leftOf = { karjat: 1, mumbai: 0 };
      towns.forEach(([k, t, c]) => { dots.append("circle").attr("cx", P[k][0]).attr("cy", P[k][1]).attr("class", "m-town" + (c ? " big" : "")); const el = lab(P[k][0], P[k][1], t, c, leftOf[k] ? "end" : "start").attr("data-dx", leftOf[k] ? -1 : 1); });
      dots.append("circle").attr("cx", P.temple[0]).attr("cy", P.temple[1]).attr("class", "m-temple");
      const sl = lab(P.temple[0], P.temple[1], T("भीमाशंकर अभयारण्य", "Bhimashankar sanctuary"), "sanc").attr("data-dy", -1.3);
      lab(P.temple[0], P.temple[1], T("ज्योतिर्लिंग मंदिर", "Jyotirlinga temple"), "sm").attr("data-dx", 1);
      const pej = M.pej[0][Math.floor(M.pej[0].length * 0.55)];
      lab(pej[0], pej[1], T("पेज नदी", "Pej river"), "riv hot").attr("data-dx", 0.6);
      const ul = M.ulhas[0][Math.floor(M.ulhas[0].length * 0.55)];
      lab(ul[0], ul[1], T("उल्हास नदी", "Ulhas river"), "riv").attr("data-dx", 0.6);
      const bh = M.bhima[0][Math.floor(M.bhima[0].length * 0.25)];
      lab(bh[0], bh[1], T("भीमा नदी", "Bhima river"), "riv").attr("data-dy", 1.4);
      const mid = [(site[0] + M.near[0]) / 2, (site[1] + M.near[1]) / 2];
      const dl = lab(mid[0], mid[1], T("अधिकृत अंतर ≈ १५.५ किमी", "official distance ≈ 15.5 km"), "dist").attr("data-dx", 0.7);

      // project site
      const sg = g.append("g").attr("class", "m-site").attr("transform", `translate(${site[0]},${site[1]})`);
      sg.append("circle").attr("class", "ring2"); sg.append("circle").attr("class", "ring2 b"); sg.append("circle").attr("class", "core");
      lab(site[0], site[1], T("प्रकल्प जागा · सैदोंगर / ढाक", "Project site · Saidongar / Dhak"), "site").attr("data-dx", 1.4).attr("data-dy", 1.5);
      lab(site[0], site[1], T("३२,४९० झाडे · २३३ हेक्टर", "32,490 trees · 233 ha"), "sm").attr("data-dx", 1.4).attr("data-dy", 2.8);

      // scale bar and edge pointers (used when the phone view crops Mumbai and Pune out)
      const sb = g.append("g"), edge = g.append("g");
      const credit = g.append("text").attr("class", "m-cr");

      function layout() {
        const narrow = mp.clientWidth < 620;
        const vb = narrow ? [350, 40, 760, 860] : [0, 0, M.w, M.h];
        svg.attr("viewBox", vb.join(" ")).attr("preserveAspectRatio", "xMidYMid slice");
        const k = vb[2] / Math.max(1, mp.clientWidth);            // viewBox units per screen pixel
        const fs = 12.5 * k;
        L.selectAll("text").each(function () {
          const t = d3.select(this), big = this.classList.contains("big"), sm = this.classList.contains("sm");
          const size = fs * (big ? 1.18 : sm ? 0.88 : 1);
          t.style("font-size", size + "px").style("stroke-width", 3.2 * k + "px");
          const x0 = +t.attr("x"), y0 = +t.attr("y");
          t.attr("dx", (+t.attr("data-dx") || 0) * 9 * k).attr("dy", ((+t.attr("data-dy") || 0) * size) + size * 0.35);
        });
        dots.selectAll("circle").attr("r", function () { return (this.classList.contains("big") ? 4.5 : this.classList.contains("m-temple") ? 5 : 3.2) * k; });
        sg.selectAll(".core").attr("r", 7 * k); sg.selectAll(".ring2").attr("r", 20 * k);
        rv.selectAll("path").style("stroke-width", function () { return (this.classList.contains("hot") ? 3.4 : 2) * k + "px"; });
        sanc.selectAll("path").style("stroke-width", 2 * k + "px");
        dist.style("stroke-width", 2 * k + "px").style("stroke-dasharray", `${5 * k} ${5 * k}`);
        // scale bar: 10 km
        sb.selectAll("*").remove();
        const bx = vb[0] + vb[2] - 24 * k - M.kmpx * 10, by = vb[1] + vb[3] - 22 * k;
        sb.append("path").attr("d", `M${bx},${by}h${M.kmpx * 10}`).attr("class", "m-scale").style("stroke-width", 3 * k + "px");
        sb.append("text").attr("x", bx + M.kmpx * 5).attr("y", by - 8 * k).attr("text-anchor", "middle").attr("class", "m-lbl sm").style("font-size", fs * 0.88 + "px").style("stroke-width", 3 * k + "px").text(T("१० किमी", "10 km"));
        credit.attr("x", vb[0] + 10 * k).attr("y", vb[1] + vb[3] - 10 * k).style("font-size", 9.5 * k + "px").text("Esri World Imagery · © OpenStreetMap");
        edge.selectAll("*").remove();
        if (narrow) {
          const e = (x, y, t, anchor) => edge.append("text").attr("x", x).attr("y", y).attr("text-anchor", anchor).attr("class", "m-lbl edge").style("font-size", fs + "px").style("stroke-width", 3.2 * k + "px").text(t);
          e(vb[0] + 10 * k, P.mumbai[1] + 40, T("← मुंबई ~६० किमी", "← Mumbai ~60 km"), "start");
          e(vb[0] + vb[2] - 10 * k, vb[1] + vb[3] - 48 * k, T("पुणे ~६० किमी →", "Pune ~60 km →"), "end");
        }
      }
      layout();
      new ResizeObserver(layout).observe(mp);

      onView(mp, () => {
        rv.selectAll("path").each(function () { const L = this.getTotalLength(); d3.select(this).attr("stroke-dasharray", `${L} ${L}`).attr("stroke-dashoffset", L).transition().duration(2600).delay(300).ease(d3.easeCubicInOut).attr("stroke-dashoffset", 0).on("end", function () { d3.select(this).attr("stroke-dasharray", null); }); });
        sanc.attr("opacity", 0).transition().duration(1200).attr("opacity", 1);
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
          const n = 3249, cols = Math.ceil(Math.sqrt(n)), step = S / cols;
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
        const count = trees ? 32490 : Math.round(HA / +chip.dataset.u);
        d3.select(num).transition().duration(900).tween("t", () => { const f = d3.interpolateNumber(0, count); return t => num.textContent = fmt(Math.round(f(t))); });
        lbl.textContent = chip.dataset.l;
      }
      const chips = document.querySelectorAll("#areaChips .chip");
      chips.forEach(c => c.addEventListener("click", () => { chips.forEach(x => x.classList.toggle("on", x === c)); show(c); }));
      onView(ar, () => show(chips[0]));
    }
  });
})();
