// ===== CappySlicer – silnik cięcia =====
// Wejście: Float32Array z trójkątami w układzie stołu (mm, Z w górę), ustawienia.
// Wyjście: warstwy ze ścieżkami + G-code + statystyki.
(function (global) {
  "use strict";
  const CL = global.ClipperLib;
  const S = 1000; // skala Clippera: 1 jednostka = 1 µm

  // ---------- pomocnicze operacje na wielokątach ----------
  function offset(paths, delta, join) {
    if (!paths || !paths.length) return [];
    const co = new CL.ClipperOffset(2, 0.05 * S);
    co.AddPaths(paths, join === "round" ? CL.JoinType.jtRound : CL.JoinType.jtMiter, CL.EndType.etClosedPolygon);
    const out = new CL.Paths();
    co.Execute(out, delta);
    return out;
  }
  function bool(a, b, type) {
    const c = new CL.Clipper();
    if (a && a.length) c.AddPaths(a, CL.PolyType.ptSubject, true);
    if (b && b.length) c.AddPaths(b, CL.PolyType.ptClip, true);
    const out = new CL.Paths();
    c.Execute(type, out, CL.PolyFillType.pftNonZero, CL.PolyFillType.pftNonZero);
    return out;
  }
  const union = (a, b) => bool(a, b || [], CL.ClipType.ctUnion);
  const diff = (a, b) => (!a || !a.length) ? [] : (!b || !b.length) ? a : bool(a, b, CL.ClipType.ctDifference);
  const inter = (a, b) => (!a || !a.length || !b || !b.length) ? [] : bool(a, b, CL.ClipType.ctIntersection);
  function openClip(lines, region) {
    if (!lines.length || !region.length) return [];
    const c = new CL.Clipper();
    c.AddPaths(lines, CL.PolyType.ptSubject, false);
    c.AddPaths(region, CL.PolyType.ptClip, true);
    const tree = new CL.PolyTree();
    c.Execute(CL.ClipType.ctIntersection, tree, CL.PolyFillType.pftNonZero, CL.PolyFillType.pftNonZero);
    return CL.Clipper.OpenPathsFromPolyTree(tree);
  }
  function area(paths) { let a = 0; for (const p of paths) a += CL.Clipper.Area(p); return a; }
  // usuwa drobne fragmenty (otwarcie morfologiczne)
  function opening(paths, r) { return offset(offset(paths, -r), r); }
  function bbox(paths) {
    let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
    for (const p of paths) for (const q of p) { if (q.X < x0) x0 = q.X; if (q.X > x1) x1 = q.X; if (q.Y < y0) y0 = q.Y; if (q.Y > y1) y1 = q.Y; }
    return {x0, y0, x1, y1};
  }

  // ---------- przecięcie siatki płaszczyzną ----------
  function sliceAt(pos, triIdx, z) {
    const segs = [];
    for (let n = 0; n < triIdx.length; n++) {
      const o = triIdx[n] * 9;
      const v = [[pos[o], pos[o+1], pos[o+2]], [pos[o+3], pos[o+4], pos[o+5]], [pos[o+6], pos[o+7], pos[o+8]]];
      const above = v.map(p => p[2] >= z);
      const cnt = above[0] + above[1] + above[2];
      if (cnt === 0 || cnt === 3) continue;
      const pts = [];
      for (let e = 0; e < 3; e++) {
        let a = v[e], b = v[(e + 1) % 3];
        if (above[e] === above[(e + 1) % 3]) continue;
        // kolejność kanoniczna → identyczne punkty u sąsiadów
        if (a[2] > b[2] || (a[2] === b[2] && (a[0] > b[0] || (a[0] === b[0] && a[1] > b[1])))) { const t = a; a = b; b = t; }
        const t = (z - a[2]) / (b[2] - a[2]);
        pts.push(a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t);
      }
      if (pts.length === 4) segs.push(pts);
    }
    return chain(segs, false);
  }

  // łączenie odcinków w łamane (zamknięte lub otwarte)
  function chain(segs, keepOpen) {
    const key = (x, y) => Math.round(x * 2000) + "," + Math.round(y * 2000);
    const map = new Map();
    const used = new Uint8Array(segs.length);
    segs.forEach((s, i) => {
      for (const k of [key(s[0], s[1]), key(s[2], s[3])]) {
        let l = map.get(k); if (!l) map.set(k, l = []); l.push(i);
      }
    });
    const out = [];
    for (let i = 0; i < segs.length; i++) {
      if (used[i]) continue;
      used[i] = 1;
      const pts = [segs[i][0], segs[i][1], segs[i][2], segs[i][3]];
      // w przód
      for (let dir = 0; dir < 2; dir++) {
        let guard = 0;
        while (guard++ < 1e6) {
          const n = pts.length;
          const k = dir === 0 ? key(pts[n-2], pts[n-1]) : key(pts[0], pts[1]);
          const l = map.get(k); let found = -1;
          if (l) for (const j of l) if (!used[j]) { found = j; break; }
          if (found < 0) break;
          used[found] = 1;
          const s = segs[found];
          const first = key(s[0], s[1]) === k;
          const nx = first ? s[2] : s[0], ny = first ? s[3] : s[1];
          if (dir === 0) pts.push(nx, ny); else pts.unshift(nx, ny);
        }
      }
      out.push(pts);
    }
    return keepOpen ? out : out.filter(p => p.length >= 6);
  }

  const toClip = (pts) => { const p = []; for (let i = 0; i < pts.length; i += 2) p.push({X: Math.round(pts[i] * S), Y: Math.round(pts[i+1] * S)}); return p; };

  // wyspy z PolyTree: [[kontur, otwory...], ...]
  function islandsOf(loops) {
    const c = new CL.Clipper();
    c.AddPaths(loops, CL.PolyType.ptSubject, true);
    const tree = new CL.PolyTree();
    c.Execute(CL.ClipType.ctUnion, tree, CL.PolyFillType.pftEvenOdd, CL.PolyFillType.pftEvenOdd);
    const res = [];
    const walk = (node) => {
      for (const ch of node.Childs()) {
        if (!ch.IsHole()) {
          const isl = [ch.Contour()];
          for (const h of ch.Childs()) { isl.push(h.Contour()); walk(h); }
          if (Math.abs(area(isl)) > 0.02 * S * S) res.push(isl);
        }
      }
    };
    walk(tree);
    return res;
  }

  // ---------- generatory wypełnień ----------
  function lineFill(region, spacing, angleDeg, phase) {
    if (!region.length || spacing <= 0) return [];
    const a = angleDeg * Math.PI / 180, dx = Math.cos(a), dy = Math.sin(a), nx = -dy, ny = dx;
    let nMin = Infinity, nMax = -Infinity, tMin = Infinity, tMax = -Infinity;
    for (const p of region) for (const q of p) {
      const n = q.X * nx + q.Y * ny, t = q.X * dx + q.Y * dy;
      if (n < nMin) nMin = n; if (n > nMax) nMax = n; if (t < tMin) tMin = t; if (t > tMax) tMax = t;
    }
    const sp = spacing * S, ph = (phase || 0) * S;
    const lines = [];
    let k0 = Math.ceil((nMin - ph) / sp);
    for (let k = k0; k * sp + ph <= nMax; k++) {
      const n = k * sp + ph;
      lines.push([{X: Math.round(nx * n + dx * (tMin - 10)), Y: Math.round(ny * n + dy * (tMin - 10))},
                  {X: Math.round(nx * n + dx * (tMax + 10)), Y: Math.round(ny * n + dy * (tMax + 10))}]);
    }
    return openClip(lines, region);
  }
  function gyroidFill(region, spacing, z) {
    const b = bbox(region); if (!isFinite(b.x0)) return [];
    const P = spacing * 2.2, k = 2 * Math.PI / P, c = P / 10;
    const x0 = b.x0 / S - c, y0 = b.y0 / S - c, nxC = Math.ceil((b.x1 / S - x0) / c) + 2, nyC = Math.ceil((b.y1 / S - y0) / c) + 2;
    if (nxC * nyC > 4e6) return lineFill(region, spacing, 45, 0);
    const sz = Math.sin(z * k), cz = Math.cos(z * k);
    const f = new Float32Array((nxC + 1) * (nyC + 1));
    for (let j = 0; j <= nyC; j++) for (let i = 0; i <= nxC; i++) {
      const x = (x0 + i * c) * k, y = (y0 + j * c) * k;
      f[j * (nxC + 1) + i] = Math.sin(x) * Math.cos(y) + Math.sin(y) * cz + sz * Math.cos(x);
    }
    const segs = [];
    const lerp = (va, vb) => va / (va - vb);
    for (let j = 0; j < nyC; j++) for (let i = 0; i < nxC; i++) {
      const v0 = f[j*(nxC+1)+i], v1 = f[j*(nxC+1)+i+1], v2 = f[(j+1)*(nxC+1)+i+1], v3 = f[(j+1)*(nxC+1)+i];
      const px = x0 + i * c, py = y0 + j * c, pts = [];
      if ((v0 > 0) !== (v1 > 0)) pts.push(px + lerp(v0, v1) * c, py);
      if ((v1 > 0) !== (v2 > 0)) pts.push(px + c, py + lerp(v1, v2) * c);
      if ((v3 > 0) !== (v2 > 0)) pts.push(px + lerp(v3, v2) * c, py + c);
      if ((v0 > 0) !== (v3 > 0)) pts.push(px, py + lerp(v0, v3) * c);
      if (pts.length === 4) segs.push(pts);
      else if (pts.length === 8) { segs.push([pts[0],pts[1],pts[2],pts[3]]); segs.push([pts[4],pts[5],pts[6],pts[7]]); }
    }
    const polys = chain(segs, true).map(toClip);
    return openClip(polys, region);
  }
  function concentricFill(region, spacing) {
    const loops = []; let r = offset(region, -spacing * S / 2), guard = 0;
    while (r.length && guard++ < 500) { for (const p of r) loops.push(p.concat([p[0]])); r = offset(r, -spacing * S); }
    return loops;
  }
  function sparseFill(region, pattern, density, w, layerIdx, z, rot) {
    rot = rot || 0;
    if (density <= 0 || !region.length) return [];
    const d = Math.min(1, density / 100);
    switch (pattern) {
      case "grid": return lineFill(region, 2 * w / d, 45 + rot, 0).concat(lineFill(region, 2 * w / d, 135 + rot, 0));
      case "triangles": return [0, 60, 120].flatMap(a => lineFill(region, 3 * w / d, a + rot, 0));
      case "cubic": { const sp = 3 * w / d, sh = (z % sp); return [0, 60, 120].flatMap((a, i) => lineFill(region, sp, a + rot, (i === 0 ? sh : -sh) * 0.577)); }
      case "gyroid": return gyroidFill(region, w / d, z);
      case "concentric": return concentricFill(region, w / d);
      case "honeycomb": { // przybliżenie: trzy kierunki z przesunięciem zależnym od warstwy
        const sp = 3 * w / d; const ph = (layerIdx % 2) * sp / 2; return [0, 60, 120].flatMap(a => lineFill(region, sp, a + rot, ph)); }
      default: return lineFill(region, w / d, (layerIdx % 2 ? 135 : 45) + rot, 0);
    }
  }

  // ---------- punkty w obszarze / najbliższa krawędź ----------
  function inRegion(paths, x, y) {
    const pt = {X: Math.round(x * S), Y: Math.round(y * S)}; let c = 0;
    for (const p of paths) if (CL.Clipper.PointInPolygon(pt, p) !== 0) c++;
    return c % 2 === 1;
  }
  function nearest(paths, x, y) {
    const X = x * S, Y = y * S; let bd = Infinity, bx = 0, by = 0;
    for (const p of paths) {
      const n = p.length;
      for (let k = 0; k < n; k++) {
        const a = p[k], b = p[(k + 1) % n];
        const dx = b.X - a.X, dy = b.Y - a.Y, l2 = dx * dx + dy * dy;
        let t = l2 ? ((X - a.X) * dx + (Y - a.Y) * dy) / l2 : 0; t = t < 0 ? 0 : t > 1 ? 1 : t;
        const qx = a.X + dx * t, qy = a.Y + dy * t, d = (X - qx) ** 2 + (Y - qy) ** 2;
        if (d < bd) { bd = d; bx = qx; by = qy; }
      }
    }
    return {x: bx / S, y: by / S, d: Math.sqrt(bd) / S};
  }
  function circlePoly(x, y, r, segs) {
    const n = segs || Math.max(10, Math.min(36, Math.ceil(r * 5))), p = [];
    for (let k = 0; k < n; k++) { const a = k / n * Math.PI * 2; p.push({X: Math.round((x + r * Math.cos(a)) * S), Y: Math.round((y + r * Math.sin(a)) * S)}); }
    return p;
  }
  // punkty startowe gałęzi: wzdłuż konturu + siatka wewnątrz
  function samplePoints(region, dist, inset) {
    const pts = [];
    let shr = offset(region, -inset * S); if (!shr.length) shr = region;
    for (const p of shr) {
      let acc = dist * 0.5;
      for (let k = 0; k < p.length; k++) {
        const a = p[k], b = p[(k + 1) % p.length];
        const len = Math.hypot(b.X - a.X, b.Y - a.Y) / S; let t = 0;
        while (acc <= len - t) { t += acc; const f = t / len; pts.push([(a.X + (b.X - a.X) * f) / S, (a.Y + (b.Y - a.Y) * f) / S]); acc = dist; }
        acc -= (len - t);
      }
      if (!pts.length && p.length) pts.push([p[0].X / S, p[0].Y / S]);
    }
    const inner = offset(shr, -dist * 0.5 * S);
    if (inner.length) {
      const b = bbox(inner);
      for (let gx = Math.ceil(b.x0 / S / dist) * dist; gx <= b.x1 / S; gx += dist)
        for (let gy = Math.ceil(b.y0 / S / dist) * dist; gy <= b.y1 / S; gy += dist)
          if (inRegion(inner, gx, gy)) pts.push([gx, gy]);
    }
    return pts;
  }

  // ---------- podpory zwykłe ----------
  async function normalSupport(layers, over, cfg, w, onProgress) {
    const L = layers.length, gap = cfg.supZGap, xy = cfg.supXY * S;
    let acc = [];
    for (let i = L - 1; i >= 0; i--) {
      let src = i + 1 + gap < L ? over[i + 1 + gap] : null;
      if (src && src.length && cfg.supExpansion > 0) src = offset(src, cfg.supExpansion * S, "round");
      let s = src && src.length ? union(acc, src) : acc;
      s = diff(s, offset(layers[i].outline, xy));
      s = opening(s, w * S * 0.4);
      layers[i].support = s;
      const above = [];
      for (let k = 1; k <= cfg.supIface; k++) if (i + gap + k < L) above.push(...layers[i + gap + k].outline);
      layers[i].iface = cfg.supIface && above.length ? inter(s, union(above)) : [];
      acc = s;
      if (i % 16 === 0) { onProgress && onProgress(0.3 + 0.03 * (L - i) / L, "support"); await tick(); }
    }
    if (cfg.supBuildplate) {
      let allowed = layers[0].support;
      for (let i = 1; i < L; i++) { layers[i].support = inter(layers[i].support, allowed); layers[i].iface = inter(layers[i].iface, layers[i].support); allowed = layers[i].support; }
    }
  }

  // ---------- podpory drzewiaste ----------
  // Gałęzie rosną od nawisów w dół: zbliżają się do sąsiadów i łączą w pnie, omijają model,
  // a ich średnica rośnie z każdą warstwą. Pod modelem leży pełny „dach” (warstwy styku).
  async function treeSupport(layers, over, cfg, w, onProgress) {
    const L = layers.length, gap = cfg.supZGap, nI = cfg.supIface, xy = cfg.supXY;
    const tipR = Math.max(w * 0.6, cfg.treeTipD / 2), maxR = Math.max(tipR, cfg.treeMaxD / 2), bd = Math.max(1, cfg.treeBranchDist);
    const tanMove = Math.tan(Math.min(80, Math.max(5, cfg.treeAngle)) * Math.PI / 180), tanGrow = Math.tan(Math.max(0, cfg.treeGrowAngle) * Math.PI / 180);
    let nodes = [];
    for (let i = L - 1; i >= 0; i--) {
      const h = layers[i].h, outl = layers[i].outline;
      const simp = outl.length ? CL.JS.Lighten(outl, 0.08 * S) : [];
      const maxMove = h * tanMove;
      // 1. przyciąganie do najbliższej gałęzi
      if (nodes.length > 1) {
        const mv = nodes.map(() => null);
        for (let a = 0; a < nodes.length; a++) {
          const A = nodes[a]; let best = -1, bdist = Infinity;
          for (let b = 0; b < nodes.length; b++) { if (b === a) continue; const d = Math.hypot(A.x - nodes[b].x, A.y - nodes[b].y); if (d < bdist) { bdist = d; best = b; } }
          if (best >= 0 && bdist > 1e-6 && bdist < bd * 3 + A.r + nodes[best].r) {
            const B = nodes[best], m = Math.min(maxMove, bdist / 2); mv[a] = [(B.x - A.x) / bdist * m, (B.y - A.y) / bdist * m];
          }
        }
        nodes.forEach((n, k) => { if (mv[k]) { n.x += mv[k][0]; n.y += mv[k][1]; } });
        // 2. łączenie
        nodes.sort((a, b) => b.r - a.r);
        const merged = [];
        for (const n of nodes) {
          const m = merged.find(o => Math.hypot(o.x - n.x, o.y - n.y) < Math.max(o.r, n.r) * 0.9 + 0.2);
          if (m) { const wa = m.r * m.r, wb = n.r * n.r; m.x = (m.x * wa + n.x * wb) / (wa + wb); m.y = (m.y * wa + n.y * wb) / (wa + wb); m.r = Math.min(maxR, Math.sqrt(wa + wb * 0.5)); }
          else merged.push(n);
        }
        nodes = merged;
      }
      // 3. pogrubianie i omijanie modelu
      const keep = [];
      for (const n of nodes) {
        n.r = Math.min(maxR, n.r + h * tanGrow);
        if (simp.length) {
          const q = nearest(simp, n.x, n.y), clear = xy + n.r;
          if (inRegion(simp, n.x, n.y)) {
            if (!cfg.supBuildplate) continue; // gałąź opiera się na modelu
            const dx = q.x - n.x, dy = q.y - n.y, d = Math.hypot(dx, dy) || 1;
            n.x = q.x + dx / d * clear; n.y = q.y + dy / d * clear;
          } else if (q.d < clear) {
            if (q.d - xy >= tipR) n.r = q.d - xy;
            else { const dx = n.x - q.x, dy = n.y - q.y, d = q.d || 1; n.x = q.x + dx / d * clear; n.y = q.y + dy / d * clear; }
          }
        }
        keep.push(n);
      }
      nodes = keep;
      // 4. nowe końcówki pod nawisem
      const k = i + gap + nI + 1;
      if (k < L && over[k] && over[k].length) {
        const src = outl.length ? diff(over[k], offset(outl, xy * S)) : over[k];
        for (const [x, y] of samplePoints(src, bd, tipR * 0.5)) {
          if (nodes.some(n => Math.hypot(n.x - x, n.y - y) < Math.max(bd * 0.6, n.r))) continue;
          nodes.push({x, y, r: tipR});
        }
      }
      // 5. obszar warstwy
      let roof = [];
      if (nI) { const parts = []; for (let k2 = i + gap + 1; k2 <= i + gap + nI && k2 < L; k2++) if (over[k2]) parts.push(...over[k2]); if (parts.length) roof = union(parts); }
      const shapes = nodes.map(n => circlePoly(n.x, n.y, n.r)).concat(roof);
      let reg = shapes.length ? union(shapes) : [];
      if (reg.length && outl.length) reg = diff(reg, offset(outl, xy * S));
      layers[i].support = opening(reg, w * S * 0.3);
      layers[i].iface = roof.length ? inter(layers[i].support, roof) : [];
      if (i % 10 === 0) { onProgress && onProgress(0.3 + 0.03 * (L - i) / L, "support"); await tick(); }
    }
  }

  // ---------- brim ----------
  function brimPaths(layers, support0, cfg, lw) {
    let L0 = layers[0];
    let type = cfg.brimType, islands = L0.islands;
    if (type === "auto") {
      // brim tylko pod wyspami wysokimi i wąskimi (albo pod wszystkimi dla materiałów, które się odkształcają)
      type = "outer";
      if (!cfg.warpProne) islands = L0.islands.filter(isl => {
        const b = bbox([isl[0]]), minDim = Math.min(b.x1 - b.x0, b.y1 - b.y0) / S;
        let top = 0;
        for (let k = layers.length - 1; k > 0; k--) {
          const o = layers[k].outline; if (!o.length) continue; const q = bbox(o);
          if (q.x0 < b.x1 && q.x1 > b.x0 && q.y0 < b.y1 && q.y1 > b.y0) { top = layers[k].z; break; }
        }
        return top > 2.5 * minDim;
      });
      if (!islands.length) return [];
      support0 = cfg.warpProne ? support0 : [];
    }
    if (type === "none" || cfg.brimWidth <= 0 || !islands.length) return [];
    L0 = {islands, outline: L0.outline};
    const gap = cfg.brimGap, n = Math.max(1, Math.round(cfg.brimWidth / lw));
    const solid = union(L0.outline.concat(support0 || []));
    const allowed = diff([[{X: -1e7, Y: -1e7}, {X: 1e7, Y: -1e7}, {X: 1e7, Y: 1e7}, {X: -1e7, Y: 1e7}]], offset(solid, (gap - 0.01) * S));
    const loops = [];
    const closeP = (p) => p.concat([p[0]]);
    if (type === "outer" || type === "both") {
      const outers = L0.islands.map(x => x[0]).concat(support0 || []);
      for (let k = n - 1; k >= 0; k--) for (const p of offset(union(outers), (gap + (k + 0.5) * lw) * S, "round")) loops.push(closeP(p));
    }
    if (type === "inner" || type === "both") {
      for (const isl of L0.islands) for (const hole of isl.slice(1)) {
        const hp = hole.slice().reverse();
        for (let k = 0; k < n; k++) for (const p of offset([hp], -(gap + (k + 0.5) * lw) * S)) loops.push(closeP(p));
      }
    }
    if (type === "ears") {
      const discs = [], maxA = cfg.earAngle * Math.PI / 180;
      for (const isl of L0.islands) {
        const c = CL.JS.Lighten([isl[0]], 0.3 * S)[0] || isl[0], ar = CL.Clipper.Area(c) > 0 ? 1 : -1, m = c.length;
        for (let k = 0; k < m; k++) {
          const a = c[(k - 1 + m) % m], p = c[k], b = c[(k + 1) % m];
          const ux = p.X - a.X, uy = p.Y - a.Y, vx = b.X - p.X, vy = b.Y - p.Y;
          const cross = ux * vy - uy * vx; if (Math.sign(cross) !== ar) continue; // tylko narożniki wypukłe
          const turn = Math.acos(Math.max(-1, Math.min(1, (ux * vx + uy * vy) / (Math.hypot(ux, uy) * Math.hypot(vx, vy) + 1e-9))));
          if (Math.PI - turn < maxA) discs.push(circlePoly(p.X / S, p.Y / S, cfg.brimWidth, 40));
        }
      }
      if (discs.length) {
        const ear = diff(union(discs), offset(solid, gap * S));
        for (const p of concentricFill(ear, lw)) loops.push(p);
      }
      return loops.map(p => ({t: "brim", pts: p}));
    }
    return openClip(loops, allowed).map(p => ({t: "brim", pts: p}));
  }

  // ---------- fuzzy skin ----------
  function fuzz(pts, thick, dist, seed) {
    let s = seed % 2147483646 + 1; const rnd = () => (s = s * 16807 % 2147483647) / 2147483647;
    const out = [], n = pts.length;
    for (let k = 0; k < n; k++) {
      const a = pts[k], b = pts[(k + 1) % n];
      const len = Math.hypot(b.X - a.X, b.Y - a.Y) / S; if (len < 1e-6) continue;
      const nx = -(b.Y - a.Y) / S / len, ny = (b.X - a.X) / S / len;
      let t = 0;
      while (t < len) {
        const f = t / len, off = (rnd() - 0.5) * thick;
        out.push({X: Math.round(a.X + (b.X - a.X) * f + nx * off * S), Y: Math.round(a.Y + (b.Y - a.Y) * f + ny * off * S)});
        t += dist * (0.6 + rnd() * 0.8);
      }
    }
    return out.length >= 3 ? out : pts;
  }

  // kierunek mostka: od jednej podpory do drugiej
  function bridgeAngle(region, below, fallback) {
    if (!below.length) return fallback;
    const anchors = islandsOf(inter(offset(region, 1.5 * S), below)).map(isl => {
      const b = bbox([isl[0]]); return {a: Math.abs(area(isl)), x: (b.x0 + b.x1) / 2, y: (b.y0 + b.y1) / 2};
    }).sort((p, q) => q.a - p.a);
    if (anchors.length < 2) return fallback;
    return Math.atan2(anchors[1].y - anchors[0].y, anchors[1].x - anchors[0].x) * 180 / Math.PI;
  }

  // ---------- główna funkcja ----------
  async function slice(parts, cfg, onProgress) {
    const t0 = Date.now();
    if (!Array.isArray(parts)) parts = [parts];
    let zMaxModel = 0;
    const P = parts.filter(p => p && p.length >= 9).map(pos => {
      const n = pos.length / 9, zmin = new Float32Array(n), zmax = new Float32Array(n);
      for (let i = 0; i < n; i++) {
        const a = pos[i*9+2], b = pos[i*9+5], c = pos[i*9+8];
        zmin[i] = Math.min(a, b, c); zmax[i] = Math.max(a, b, c);
        if (zmax[i] > zMaxModel) zMaxModel = zmax[i];
      }
      const order = Array.from({length: n}, (_, i) => i).sort((a, b) => zmin[a] - zmin[b]);
      return {pos, n, zmin, zmax, order, ptr: 0, active: []};
    });
    const vase = !!cfg.vase;
    const walls = vase ? 1 : cfg.walls, topLayers = vase ? 0 : cfg.topLayers, density = vase ? 0 : cfg.density;
    const useSupport = cfg.support && !vase;

    // wysokości warstw
    const layers = [];
    let z = cfg.firstLayerH;
    layers.push({z, h: cfg.firstLayerH});
    while (z + cfg.layerH * 0.5 < zMaxModel) { z = +(z + cfg.layerH).toFixed(4); layers.push({z, h: cfg.layerH}); }
    const L = layers.length, w = cfg.lineW;

    // przejście 1: kontury warstw (każda część osobno, potem suma)
    for (let i = 0; i < L; i++) {
      const zc = layers[i].z - layers[i].h / 2;
      let all = [], multi = 0;
      for (const q of P) {
        while (q.ptr < q.n && q.zmin[q.order[q.ptr]] <= zc) q.active.push(q.order[q.ptr++]);
        q.active = q.active.filter(t => q.zmax[t] > zc);
        if (!q.active.length) continue;
        const loops = sliceAt(q.pos, q.active, zc).map(toClip);
        const isl = islandsOf(CL.Clipper.CleanPolygons(loops, 0.01 * S));
        if (isl.length) { multi++; for (const x of isl) all.push(...x); }
      }
      let isl = multi > 1 ? islandsOf(union(all)) : (all.length ? islandsOf(all) : []);
      if (cfg.xyComp) isl = isl.map(p => offset(p, cfg.xyComp * S)).filter(p => p.length);
      if (i === 0 && cfg.elephant > 0 && !cfg.raftLayers) isl = isl.map(p => offset(p, -cfg.elephant * S)).filter(p => p.length);
      if (vase && isl.length > 1) isl = [isl.reduce((a, b) => Math.abs(area(a)) > Math.abs(area(b)) ? a : b)];
      layers[i].islands = isl.map(p => CL.JS.Lighten(p, 0.012 * S)).filter(p => p.length);
      layers[i].outline = [].concat(...layers[i].islands);
      layers[i].support = []; layers[i].iface = [];
      if (i % 8 === 0) { onProgress && onProgress(0.3 * i / L, "slice", i, L); await tick(); }
    }

    // podpory
    if (useSupport) {
      onProgress && onProgress(0.3, "support");
      const over = new Array(L).fill(null);
      for (let i = 1; i < L; i++) {
        const step = layers[i].h / Math.tan(Math.max(5, cfg.supAngle) * Math.PI / 180);
        over[i] = opening(diff(layers[i].outline, offset(layers[i-1].outline, step * S)), w * S * 0.5);
      }
      if (cfg.supType === "tree") await treeSupport(layers, over, cfg, w, onProgress);
      else await normalSupport(layers, over, cfg, w, onProgress);
    }
    let aboveAll = null;
    if (cfg.ironing === "topmost") { aboveAll = new Array(L).fill(null); let acc = []; for (let i = L - 1; i >= 0; i--) { aboveAll[i] = acc; if (i % 4 === 0) acc = union(acc.concat(layers[i].outline)); else acc = acc.concat(layers[i].outline); } }

    // przejście 2: ścieżki modelu
    const raft = Math.max(0, Math.round(cfg.raftLayers || 0));
    const seamPt = {x: cfg.bedW / 2, y: cfg.bedD + 1000};
    let spiralEnd = null;
    for (let i = 0; i < L; i++) {
      const Ly = layers[i]; const paths = []; Ly.paths = paths;
      const lw = i === 0 && !raft ? w * cfg.firstLayerWidth : w;
      Ly.lw = lw;
      const isls = Ly.islands.slice();
      // tryb wazonu: jedna spiralna ściana
      if (vase && i >= cfg.bottomLayers) {
        if (isls.length) {
          const c = offset([isls[0][0]], -lw / 2 * S);
          if (c.length) {
            let pts = c.reduce((a, b) => Math.abs(CL.Clipper.Area(a)) > Math.abs(CL.Clipper.Area(b)) ? a : b);
            if (spiralEnd) { let bi = 0, bdd = Infinity; pts.forEach((p, k) => { const d = (p.X - spiralEnd.X) ** 2 + (p.Y - spiralEnd.Y) ** 2; if (d < bdd) { bdd = d; bi = k; } }); pts = pts.slice(bi).concat(pts.slice(0, bi)); }
            else pts = rotateSeam(pts, "rear", seamPt, i);
            paths.push({t: "outer", pts, closed: true, spiral: true}); spiralEnd = pts[0]; Ly.spiral = true;
          }
        }
        continue;
      }
      const below = i > 0 ? union(layers[i - 1].outline.concat(layers[i - 1].support || [])) : null;
      const fillRegions = [];
      for (const isl of isls) {
        const wl = [];
        let cur = offset(isl, -lw / 2 * S);
        for (let k = 0; k < walls && cur.length; k++) {
          wl.push(cur);
          if (k < walls - 1) cur = offset(cur, -lw * S);
        }
        const inner = wl.length ? offset(wl[wl.length - 1], -(lw / 2 - cfg.infillOverlap * lw) * S) : [];
        fillRegions.push(inner);
        const wallPaths = [];
        for (let k = wl.length - 1; k >= 0; k--) for (const p of wl[k]) {
          const t = k === 0 ? "outer" : "inner";
          const fz = i > 0 && (cfg.fuzzy === "all" || (cfg.fuzzy === "outer" && k === 0));
          wallPaths.push({t, pts: fz ? fuzz(p, cfg.fuzzyThick, cfg.fuzzyDist, i * 7919 + k * 31 + p.length) : p, closed: true});
        }
        if (cfg.wallOrder === "outer") wallPaths.reverse();
        isl._walls = wallPaths;
      }
      // skóra górna/dolna, mostki, prasowanie
      for (let n = 0; n < isls.length; n++) {
        const fr = fillRegions[n];
        if (!fr.length) { isls[n]._fill = []; isls[n]._top = []; continue; }
        let topReg = i >= L - 1 ? fr : diff(fr, layers[i + 1].outline);
        let solid = [];
        if (i < cfg.bottomLayers || i >= L - topLayers) solid = fr;
        else {
          let up = fr; for (let k = 1; k <= topLayers && up.length; k++) up = inter(up, layers[i + k].outline);
          let dn = fr; for (let k = 1; k <= cfg.bottomLayers && dn.length; k++) dn = inter(dn, layers[i - k].outline);
          solid = union(diff(fr, up), diff(fr, dn));
        }
        if (!topLayers) topReg = [];
        topReg = opening(topReg, lw * S * 0.3);
        solid = opening(inter(solid, fr), lw * S * 0.3);
        let bridgeReg = [];
        if (below && cfg.bridgeDetect) { bridgeReg = opening(inter(diff(fr, below), solid.length ? solid : fr), lw * S * 0.5); }
        if (bridgeReg.length) topReg = diff(topReg, bridgeReg);
        const solidReg = diff(diff(solid, topReg), bridgeReg);
        const sparse = diff(diff(fr, solid), bridgeReg);
        const ang = (i % 2 ? 135 : 45) + (cfg.infillAngle - 45);
        const lines = [], tops = [];
        for (const isl2 of islandsOf(bridgeReg)) {
          const a = bridgeAngle(isl2, below, ang);
          for (const p of lineFill(isl2, lw, a, 0)) lines.push({t: "bridge", pts: p});
        }
        for (const p of lineFill(solidReg, lw, ang, 0)) lines.push({t: "solid", pts: p});
        for (const p of sparseFill(opening(sparse, lw * S * 0.4), cfg.pattern, density, w, i, Ly.z, cfg.infillAngle - 45)) lines.push({t: "sparse", pts: p});
        if (topReg.length) {
          if (cfg.topPattern === "concentric") for (const p of concentricFill(topReg, lw)) tops.push({t: "top", pts: p});
          else {
            const tl = lineFill(topReg, lw, ang, 0).map(p => ({t: "top", pts: p}));
            if (cfg.topPattern === "monotonic") {
              const a = ang * Math.PI / 180, nx = -Math.sin(a), ny = Math.cos(a), dx = Math.cos(a), dy = Math.sin(a);
              tl.sort((p, q) => (p.pts[0].X * nx + p.pts[0].Y * ny) - (q.pts[0].X * nx + q.pts[0].Y * ny));
              tl.forEach((p, k) => { const s0 = p.pts[0].X * dx + p.pts[0].Y * dy, s1 = p.pts[p.pts.length - 1].X * dx + p.pts[p.pts.length - 1].Y * dy; if ((k % 2 === 0) !== (s0 < s1)) p.pts = p.pts.slice().reverse(); });
              tl.monotonic = true;
            }
            tops.push(...tl); tops.monotonic = tl.monotonic;
          }
          let ironReg = cfg.ironing === "top" ? topReg : cfg.ironing === "topmost" ? diff(topReg, aboveAll[i]) : [];
          ironReg = offset(ironReg, -lw * 0.4 * S);
          if (ironReg.length) { tops.iron = lineFill(ironReg, cfg.ironSpacing, ang + 90, 0).map(p => ({t: "iron", pts: p})); }
        }
        isls[n]._fill = lines; isls[n]._top = tops;
      }
      // kolejność wysp: najbliższa
      let cur = {X: 0, Y: 0};
      const left = isls.slice();
      while (left.length) {
        let bi = 0, bdd = Infinity;
        left.forEach((isl, k) => { const q = isl[0][0]; const d = (q.X - cur.X) ** 2 + (q.Y - cur.Y) ** 2; if (d < bdd) { bdd = d; bi = k; } });
        const isl = left.splice(bi, 1)[0];
        for (const wp of isl._walls) paths.push(wp);
        for (const p of orderOpen(isl._fill, paths.length ? lastPt(paths) : cur)) paths.push(p);
        const tops = isl._top || [];
        if (tops.length) for (const p of (tops.monotonic ? tops : orderOpen(tops, paths.length ? lastPt(paths) : cur))) paths.push(p);
        if (tops.iron && tops.iron.length) for (const p of orderOpen(tops.iron, paths.length ? lastPt(paths) : cur)) paths.push(p);
        if (paths.length) cur = lastPt(paths);
        delete isl._walls; delete isl._fill; delete isl._top;
      }
      // podpory
      if (useSupport && Ly.support && Ly.support.length) {
        const reg = diff(Ly.support, Ly.iface || []);
        const sl = [], sp = w / Math.max(0.05, cfg.supDensity / 100), alt = i % 2 ? 0 : 90;
        if (cfg.supType === "tree") {
          let r = offset(reg, -w / 2 * S);
          for (let k = 0; k < Math.max(1, cfg.treeWalls) && r.length; k++) { for (const p of r) sl.push({t: "support", pts: p.concat([p[0]])}); r = offset(r, -w * S); }
          if (r.length) for (const p of lineFill(r, sp, alt, 0)) sl.push({t: "support", pts: p});
        } else {
          const pat = cfg.supPattern;
          if (pat === "concentric") for (const p of concentricFill(reg, sp)) sl.push({t: "support", pts: p});
          else if (pat === "grid") for (const a of [0, 90]) for (const p of lineFill(reg, sp * 2, a, 0)) sl.push({t: "support", pts: p});
          else for (const p of lineFill(reg, sp, pat === "lines" ? 0 : alt, 0)) sl.push({t: "support", pts: p});
          if (i === 0) for (const p of offset(Ly.support, -w / 2 * S)) sl.push({t: "support", pts: p.concat([p[0]])});
        }
        const ifSp = w / Math.max(0.1, Math.min(1, cfg.supIfaceDensity / 100));
        for (const p of lineFill(Ly.iface || [], ifSp, i % 2 ? 45 : 135, 0)) sl.push({t: "iface", pts: p});
        for (const p of orderOpen(sl, paths.length ? lastPt(paths) : {X: 0, Y: 0})) paths.push(p);
      }
      // szew
      for (const p of paths) if (p.closed && !p.spiral) p.pts = rotateSeam(p.pts, cfg.seam, seamPt, i);
      if (i % 4 === 0) { onProgress && onProgress(0.33 + 0.55 * i / L, "paths", i, L); await tick(); }
    }

    // podkładka (raft)
    let final = layers;
    const foot0 = union(layers[0].outline.concat(layers[0].support || []));
    let firstFoot = foot0;
    if (raft && foot0.length) {
      const reg = offset(offset(foot0, (cfg.raftMargin + 2) * S, "round"), -2 * S, "round");
      const rl = [];
      let rz = 0;
      for (let k = 0; k < raft; k++) {
        const base = k === 0, top = k >= raft - 2 && raft > 1;
        const h = base ? cfg.firstLayerH : cfg.layerH; rz = +(rz + h).toFixed(4);
        const lwr = base ? w * 1.25 : w;
        const sp = base ? lwr * 2.4 : top ? lwr : lwr * 1.6;
        const ps = [];
        if (base) for (const p of offset(reg, -lwr / 2 * S)) ps.push({t: "raft", pts: p.concat([p[0]])});
        for (const p of lineFill(offset(reg, -lwr * S), sp, k % 2 ? 0 : 90, 0)) ps.push({t: "raft", pts: p});
        rl.push({z: rz, h, lw: lwr, paths: orderOpen(ps, {X: 0, Y: 0}), raft: true});
      }
      const dz = rz + cfg.raftGap;
      for (const Ly of layers) Ly.z = +(Ly.z - cfg.firstLayerH + cfg.layerH + dz).toFixed(4);
      layers[0].h = cfg.layerH; // pierwsza warstwa modelu leży na podkładce
      final = rl.concat(layers);
      firstFoot = reg;
    }
    // skirt i brim (na początku warstw)
    const lw0 = final[0].lw || w;
    if (!raft) {
      const bp = brimPaths(layers, layers[0].support, cfg, lw0);
      if (bp.length) { final[0].paths = orderOpen(bp, {X: 0, Y: 0}).concat(final[0].paths); firstFoot = union(firstFoot.concat(offset(foot0, (cfg.brimGap + cfg.brimWidth) * S, "round"))); }
    }
    if (cfg.skirtLoops > 0 && firstFoot.length) {
      const hull = offset(offset(firstFoot, (cfg.skirtDist + 3) * S, "round"), -3 * S, "round");
      for (let i = 0; i < Math.min(final.length, Math.max(1, cfg.skirtLayers)); i++) {
        const sk = [];
        for (let k = cfg.skirtLoops - 1; k >= 0; k--) for (const p of offset(hull, k * lw0 * S, "round")) sk.push({t: "skirt", pts: rotateSeam(p, "rear", seamPt, i), closed: true});
        final[i].paths = sk.concat(final[i].paths);
      }
    }
    final.forEach((Ly, k) => { Ly.first = k === 0; if (!Ly.lw) Ly.lw = w; });
    const res = buildGcode(final, cfg, onProgress);
    res.sliceMs = Date.now() - t0;
    return res;
  }
  const tick = () => new Promise(r => setTimeout(r, 0));
  function lastPt(paths) { const p = paths[paths.length - 1]; return p.closed ? p.pts[0] : p.pts[p.pts.length - 1]; }

  function orderOpen(list, start) {
    const out = []; let cx = start.X, cy = start.Y;
    const rem = list.filter(p => p.pts.length >= 2);
    while (rem.length) {
      let bi = 0, bd = Infinity, rev = false;
      for (let k = 0; k < rem.length; k++) {
        const a = rem[k].pts[0], b = rem[k].pts[rem[k].pts.length - 1];
        const da = (a.X - cx) ** 2 + (a.Y - cy) ** 2, db = (b.X - cx) ** 2 + (b.Y - cy) ** 2;
        if (da < bd) { bd = da; bi = k; rev = false; }
        if (!rem[k].closed && db < bd) { bd = db; bi = k; rev = true; }
        if (bd === 0) break;
      }
      const p = rem.splice(bi, 1)[0];
      if (rev) p.pts = p.pts.slice().reverse();
      out.push(p); const e = p.closed ? p.pts[0] : p.pts[p.pts.length - 1]; cx = e.X; cy = e.Y;
    }
    return out;
  }
  function rotateSeam(pts, mode, ref, layer) {
    if (pts.length < 3) return pts;
    let bi = 0;
    if (mode === "random") bi = Math.floor(((Math.sin(layer * 12.9898 + pts.length) * 43758.5453) % 1 + 1) % 1 * pts.length);
    else if (mode === "rear") { let by = -Infinity; pts.forEach((p, k) => { if (p.Y > by) { by = p.Y; bi = k; } }); }
    else { // aligned / nearest – najostrzejszy narożnik blisko tyłu
      let best = Infinity;
      for (let k = 0; k < pts.length; k++) {
        const p = pts[k], a = pts[(k - 1 + pts.length) % pts.length], b = pts[(k + 1) % pts.length];
        const v1x = a.X - p.X, v1y = a.Y - p.Y, v2x = b.X - p.X, v2y = b.Y - p.Y;
        const cos = (v1x * v2x + v1y * v2y) / (Math.hypot(v1x, v1y) * Math.hypot(v2x, v2y) + 1e-9);
        const dist = Math.hypot(p.X / S - ref.x, p.Y / S - ref.y);
        const score = dist * (mode === "aligned" ? 1 : 0.3) + (cos + 1) * -40;
        if (score < best) { best = score; bi = k; }
      }
    }
    return pts.slice(bi).concat(pts.slice(0, bi));
  }

  // ---------- G-code ----------
  const TYPE_NAME = {outer: "Outer wall", inner: "Inner wall", sparse: "Sparse infill", solid: "Internal solid infill", top: "Top surface",
    bridge: "Bridge", iron: "Ironing", support: "Support", iface: "Support interface", raft: "Raft", skirt: "Skirt", brim: "Brim"};

  function buildGcode(layers, cfg, onProgress) {
    const fa = Math.PI * (cfg.filD / 2) ** 2;
    const ox = cfg.center ? -cfg.bedW / 2 : 0, oy = cfg.center ? -cfg.bedD / 2 : 0;
    const f3 = (v) => (Math.round(v * 1000) / 1000).toString();
    const out = [];
    const stats = {time: 0, filament: 0, byType: {}, layers: layers.length, moves: 0};
    const prev = {segs: [], types: [], layerStart: [], travelStart: [], travel: []};
    let x = 0, y = 0, zc = 0, retracted = false, curF = 0, curFan = -1;
    const acc = cfg.accel;
    const tmove = (d, v) => d >= v * v / acc ? d / v + v / acc : 2 * Math.sqrt(d / acc);

    const tplVars = {bed: cfg.bedTemp, nozzle: cfg.nozzleTemp, chamber: cfg.chamber || 0, lh: f3(cfg.firstLayerH), px: f3(ox + 5), px2: f3(ox + Math.min(100, cfg.bedW - 10)),
      py: f3(oy + 3), purge: f3(Math.min(95, cfg.bedW - 15) * 0.6 * cfg.firstLayerH * 0.5 / fa * 4), dy: f3(oy + cfg.bedD - 10)};
    const fill = (t) => t.replace(/\{(\w+)\}/g, (m, k) => tplVars[k] !== undefined ? tplVars[k] : m);

    out.push("; generated by CappySlicer 1.1", "; printer: " + cfg.printerName, "; filament: " + cfg.filamentName,
      "; layer_height = " + cfg.layerH, "; nozzle_diameter = " + cfg.nozzle, "; filament_diameter = " + cfg.filD,
      "; support = " + (cfg.support ? cfg.supType : "off") + ", brim = " + cfg.brimType + ", raft_layers = " + (cfg.raftLayers || 0) + (cfg.vase ? ", spiral_vase = 1" : ""),
      ";ESTIMATED_TIME_PLACEHOLDER", ";FILAMENT_USED_PLACEHOLDER", "", "M107", fill(cfg.startGcode), "M83", "G90", "G21");
    if (cfg.firstLayerTemp !== cfg.nozzleTemp) out.push("M104 S" + cfg.firstLayerTemp);
    const setFan = (pct) => { const v = Math.round(255 * pct / 100); if (v !== curFan) { out.push(v > 0 ? "M106 S" + v : "M107"); curFan = v; } };

    const travelTo = (nx, ny) => {
      const d = Math.hypot(nx - x, ny - y);
      const needRet = d > cfg.retMinTravel && cfg.retLen > 0;
      if (needRet && !retracted) { out.push("G1 E-" + f3(cfg.retLen) + " F" + Math.round(cfg.retSpeed * 60)); retracted = true; stats.time += cfg.retLen / cfg.retSpeed; }
      if (needRet && cfg.zHop > 0) { out.push("G1 Z" + f3(zc + cfg.zHop) + " F" + Math.round(cfg.travelZ * 60)); stats.time += cfg.zHop / cfg.travelZ * 2; }
      if (d > 0.001) {
        out.push("G0 X" + f3(nx + ox) + " Y" + f3(ny + oy) + " F" + Math.round(cfg.travel * 60));
        stats.time += tmove(d, cfg.travel);
        if (cfg.previewTravel) prev.travel.push(x, y, zc, nx, ny, zc);
      }
      if (needRet && cfg.zHop > 0) out.push("G1 Z" + f3(zc) + " F" + Math.round(cfg.travelZ * 60));
      x = nx; y = ny;
    };

    let lastType = "";
    for (let i = 0; i < layers.length; i++) {
      const Ly = layers[i], h = Ly.h, lw = Ly.lw;
      zc = Ly.z;
      out.push(";LAYER_CHANGE", ";Z:" + f3(zc), ";HEIGHT:" + f3(h));
      if (!Ly.spiral) out.push("G1 Z" + f3(zc) + " F" + Math.round(cfg.travelZ * 60));
      stats.time += 0.4;
      if (i === 1) {
        if (cfg.firstLayerTemp !== cfg.nozzleTemp) out.push("M104 S" + cfg.nozzleTemp);
        if (cfg.firstLayerBed !== cfg.bedTemp) out.push("M140 S" + cfg.bedTemp);
      }
      const layerFan = i >= cfg.fanFromLayer ? cfg.fan : 0;
      setFan(layerFan);
      prev.layerStart.push(prev.segs.length / 6); prev.travelStart.push(prev.travel.length / 6);

      const speedOf = (t) => {
        let v = Ly.first ? cfg.speedFirst : ({outer: cfg.speedOuter, inner: cfg.speedInner, sparse: cfg.speedInfill, solid: cfg.speedSolid,
          top: cfg.speedTop, bridge: cfg.bridgeSpeed, iron: cfg.ironSpeed, support: cfg.speedSupport, iface: cfg.speedSupport * 0.8, raft: cfg.speedSupport,
          skirt: cfg.speedFirst, brim: cfg.speedFirst})[t];
        if (t === "iron") return Math.min(v, cfg.maxSpeed);
        return Math.max(2, Math.min(v, cfg.maxVol / (lw * h), cfg.maxSpeed));
      };
      const flowOf = (t) => t === "bridge" ? cfg.bridgeFlow : t === "iron" ? cfg.ironFlow / 100 : 1;
      let estimate = 0;
      for (const p of Ly.paths) { let len = 0; const q = p.pts; for (let k = 1; k < q.length; k++) len += Math.hypot(q[k].X - q[k-1].X, q[k].Y - q[k-1].Y) / S; if (p.closed) len += Math.hypot(q[0].X - q[q.length-1].X, q[0].Y - q[q.length-1].Y) / S; estimate += len / speedOf(p.t); }
      const slow = estimate > 0 && estimate < cfg.minLayerTime && i > 0 ? estimate / cfg.minLayerTime : 1;

      for (const p of Ly.paths) {
        const q = p.pts; if (q.length < 2) continue;
        const sx = q[0].X / S, sy = q[0].Y / S;
        if (p.spiral) {
          if (Math.hypot(sx - x, sy - y) > lw * 2) { zc = Ly.z - h; travelTo(sx, sy); }
        } else travelTo(sx, sy);
        if (retracted) { out.push("G1 E" + f3(cfg.retLen) + " F" + Math.round(cfg.retSpeed * 60)); retracted = false; }
        if (p.t !== lastType) { out.push(";TYPE:" + TYPE_NAME[p.t]); lastType = p.t; }
        if (i > 0) setFan(p.t === "bridge" ? Math.max(layerFan, cfg.bridgeFan) : layerFan);
        const v = Math.max(cfg.minSpeed, p.t === "bridge" || p.t === "iron" ? speedOf(p.t) : speedOf(p.t) * slow);
        const plw = p.t === "iron" ? lw : lw;
        const flow = plw * h / fa * cfg.flow * flowOf(p.t);
        const F = Math.round(v * 60);
        let first = true, len = 0;
        const n = p.closed ? q.length + 1 : q.length;
        let total = 0;
        if (p.spiral) { for (let k = 1; k < n; k++) total += Math.hypot(q[k % q.length].X - q[k - 1].X, q[k % q.length].Y - q[k - 1].Y) / S; }
        const z0 = Ly.z - h;
        for (let k = 1; k < n; k++) {
          const pt = q[k % q.length];
          const nx = pt.X / S, ny = pt.Y / S, d = Math.hypot(nx - x, ny - y);
          if (d < 0.005) continue;
          const e = d * flow;
          let zs = "";
          const zp = zc;
          if (p.spiral) { zc = z0 + h * Math.min(1, (len + d) / (total || 1)); zs = " Z" + f3(zc); }
          out.push("G1 X" + f3(nx + ox) + " Y" + f3(ny + oy) + zs + " E" + e.toFixed(5) + (first || F !== curF ? " F" + F : ""));
          first = false; curF = F;
          prev.segs.push(x, y, zp, nx, ny, zc); prev.types.push(p.t);
          stats.filament += e; len += d; x = nx; y = ny;
        }
        if (p.spiral) zc = Ly.z;
        const tt = tmove(len, v);
        stats.time += tt; stats.byType[p.t] = (stats.byType[p.t] || 0) + tt; stats.moves++;
      }
      if (onProgress && i % 20 === 0) onProgress(0.9 + 0.1 * i / layers.length, "gcode");
    }
    out.push("M107", ";TYPE:Custom", fill(cfg.endGcode));
    const hh = Math.floor(stats.time / 3600), mm = Math.floor(stats.time % 3600 / 60), ss = Math.round(stats.time % 60);
    const grams = stats.filament * fa / 1000 * cfg.matDensity;
    out[out.indexOf(";ESTIMATED_TIME_PLACEHOLDER")] = "; estimated printing time (normal mode) = " + hh + "h " + mm + "m " + ss + "s";
    out[out.indexOf(";FILAMENT_USED_PLACEHOLDER")] = "; filament used [mm] = " + stats.filament.toFixed(1) + "\n; filament used [g] = " + grams.toFixed(2);
    stats.grams = grams;
    stats.cost = grams / 1000 * cfg.price;
    prev.layerStart.push(prev.segs.length / 6); prev.travelStart.push(prev.travel.length / 6);
    prev.z = layers.map(l => l.z);
    return {gcode: out.join("\n") + "\n", stats, preview: prev};
  }

  global.CappyEngine = {slice, TYPE_NAME};
})(typeof window !== "undefined" ? window : globalThis);
