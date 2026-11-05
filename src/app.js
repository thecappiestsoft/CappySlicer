// ===== CappySlicer – interfejs / user interface =====
(function () {
  "use strict";
  const $ = (id) => document.getElementById(id);
  const h = (tag, attrs, ...kids) => {
    const e = document.createElement(tag);
    for (const [k, v] of Object.entries(attrs || {})) {
      if (k === "class") e.className = v; else if (k.startsWith("on")) e.addEventListener(k.slice(2), v);
      else if (v !== undefined && v !== null && v !== false) e.setAttribute(k, v === true ? "" : v);
    }
    for (const k of kids.flat()) if (k !== null && k !== undefined) e.append(k.nodeType ? k : document.createTextNode(k));
    return e;
  };
  const loc = () => LANG === "pl" ? "pl-PL" : "en-GB";
  const fmt = (n, d = 1) => Number(n).toLocaleString(loc(), {minimumFractionDigits: d, maximumFractionDigits: d});
  const store = {
    get() { try { return JSON.parse(localStorage.getItem("cappy.v1") || "{}"); } catch (e) { return {}; } },
    set(v) { try { localStorage.setItem("cappy.v1", JSON.stringify(v)); } catch (e) {} }
  };
  let toastT;
  function toast(msg) {
    let el = document.querySelector(".toast"); if (!el) { el = h("div", {class: "toast", role: "status"}); document.body.append(el); }
    el.textContent = msg; el.hidden = false; clearTimeout(toastT); toastT = setTimeout(() => el.hidden = true, 3200);
  }
  const css = (v) => getComputedStyle(document.documentElement).getPropertyValue(v).trim();

  // ---------- dane ----------
  const PRINTERS = buildPrinterList();
  const FILS = buildFilamentList();
  const FILMAP = new Map(FILS.map(f => [f.key, f]));
  const COLORS = ["#f2f2f0", "#2b2d31", "#d33a3a", "#f08a24", "#f6c531", "#46b04a", "#2f80ed", "#8e5bd8", "#c18a5e", "#9aa3ad", "#2dd4e6", "#ff6fae"];
  const prName = (n) => LANG === "en" && PRINTER_EN[n] ? PRINTER_EN[n] : n;
  const vendorName = (v) => I18N[LANG]["pr.vendor." + v] || v;
  const matName = (id) => LANG === "en" && MAT_EN[id] ? MAT_EN[id][0] : MATERIALS[id][0];
  const matNote = (id) => LANG === "en" ? (MAT_EN[id] ? MAT_EN[id][1] : "") : ((MATERIALS[id][8] || {}).note || "");
  const groupName = (gid) => LANG === "en" ? MAT_GROUPS_EN[gid] : MAT_GROUPS.find(g => g[0] === gid)[1];
  const filName = (f) => (f.brand === "Generic" ? "Generic " : f.brand + " ") + matName(f.mat);

  const saved = store.get();
  let lang0 = saved.lang;
  if (!lang0) { try { lang0 = (navigator.language || "pl").toLowerCase().startsWith("pl") ? "pl" : "en"; } catch (e) { lang0 = "pl"; } }
  LANG = lang0 === "en" ? "en" : "pl";
  const state = {
    printer: PRINTERS.findIndex(p => p.name === saved.printer),
    nozzle: saved.nozzle || 0.4,
    hard: saved.hard ?? null,
    custom: saved.custom || {},
    fil: FILMAP.has(saved.fil) ? saved.fil : "Fiberlogy|PLA",
    filOv: saved.filOv || {},
    color: saved.color || "#f08a24",
    ov: saved.ov || {support: true, supType: "tree"}, // pierwsze uruchomienie: kapibara z podporami drzewiastymi
    adv: !!saved.adv,
    tab: "quality", q: ""
  };
  if (state.printer < 0) state.printer = Math.max(0, PRINTERS.findIndex(p => p.name === "Prusa MK4S"));
  for (const k of ["adhesion", "brimLoops"]) delete state.ov[k]; // ustawienia z wersji 1.0
  const save = () => store.set({lang: LANG, printer: P().name, nozzle: state.nozzle, hard: state.hard, custom: state.custom, fil: state.fil, filOv: state.filOv, color: state.color, ov: state.ov, adv: state.adv});

  function P() {
    const p = Object.assign({}, PRINTERS[state.printer]);
    if (p.custom) { p.x = +state.custom.x || p.x; p.y = +state.custom.y || p.y; p.z = +state.custom.z || p.z; }
    p.hardNozzle = state.hard === null ? p.hard : !!state.hard;
    return p;
  }
  function F() {
    const f = Object.assign({}, FILMAP.get(state.fil));
    for (const [k, v] of Object.entries(state.filOv)) if (v !== "" && v !== null && !isNaN(v)) f[k] = +v;
    return f;
  }

  // ---------- ustawienia procesu ----------
  // [id, zakładka, typ, jednostka, min | opcje, max, krok, flagi]  flagi: adv = tylko w trybie zaawansowanym, when = warunek widoczności
  const sup = (e) => e.support, tree = (e) => e.support && e.supType === "tree", norm = (e) => e.support && e.supType !== "tree";
  const TABS = ["quality", "walls", "infill", "support", "adh", "speed", "cool", "ret", "special", "gcode"];
  const SET = [
    ["layerH", "quality", "num", "mm", 0.04, 0.6, 0.02],
    ["firstLayerH", "quality", "num", "mm", 0.1, 0.6, 0.02],
    ["lineW", "quality", "num", "mm", 0.15, 1.5, 0.01, {adv: 1}],
    ["firstLayerWidth", "quality", "num", "×", 0.8, 1.6, 0.05, {adv: 1}],
    ["seam", "quality", "sel", "", ["aligned", "nearest", "rear", "random"]],
    ["elephant", "quality", "num", "mm", 0, 0.5, 0.05, {adv: 1}],
    ["xyComp", "quality", "num", "mm", -0.5, 0.5, 0.01, {adv: 1}],
    ["walls", "walls", "num", "", 1, 10, 1],
    ["wallOrder", "walls", "sel", "", ["inner", "outer"], 0, 0, {adv: 1}],
    ["topLayers", "walls", "num", "", 0, 30, 1],
    ["bottomLayers", "walls", "num", "", 0, 30, 1],
    ["topPattern", "walls", "sel", "", ["monotonic", "lines", "concentric"], 0, 0, {adv: 1}],
    ["density", "infill", "num", "%", 0, 100, 5],
    ["pattern", "infill", "sel", "", ["grid", "lines", "triangles", "cubic", "gyroid", "honeycomb", "concentric"]],
    ["infillAngle", "infill", "num", "°", 0, 180, 15, {adv: 1}],
    ["infillOverlap", "infill", "num", "×", 0, 0.5, 0.05, {adv: 1}],
    ["support", "support", "bool"],
    ["supType", "support", "sel", "", ["normal", "tree"], 0, 0, {when: sup}],
    ["supAngle", "support", "num", "°", 5, 85, 5, {when: sup}],
    ["supBuildplate", "support", "bool", "", 0, 0, 0, {when: sup}],
    ["supPattern", "support", "sel", "", ["alternate", "lines", "grid", "concentric"], 0, 0, {when: norm, adv: 1}],
    ["supDensity", "support", "num", "%", 5, 60, 5, {when: sup}],
    ["supExpansion", "support", "num", "mm", 0, 10, 0.5, {when: norm, adv: 1}],
    ["treeAngle", "support", "num", "°", 10, 70, 5, {when: tree}],
    ["treeBranchDist", "support", "num", "mm", 1, 20, 0.5, {when: tree}],
    ["treeTipD", "support", "num", "mm", 0.4, 5, 0.1, {when: tree, adv: 1}],
    ["treeMaxD", "support", "num", "mm", 1, 25, 0.5, {when: tree}],
    ["treeGrowAngle", "support", "num", "°", 0, 15, 1, {when: tree, adv: 1}],
    ["treeWalls", "support", "num", "", 1, 4, 1, {when: tree, adv: 1}],
    ["supZGap", "support", "num", "", 0, 3, 1, {when: sup, adv: 1}],
    ["supXY", "support", "num", "mm", 0.2, 3, 0.1, {when: sup, adv: 1}],
    ["supIface", "support", "num", "", 0, 5, 1, {when: sup}],
    ["supIfaceDensity", "support", "num", "%", 20, 100, 5, {when: (e) => e.support && e.supIface > 0, adv: 1}],
    ["brimType", "adh", "sel", "", ["auto", "none", "outer", "inner", "both", "ears"]],
    ["brimWidth", "adh", "num", "mm", 1, 30, 0.5, {when: (e) => e.brimType !== "none"}],
    ["brimGap", "adh", "num", "mm", 0, 2, 0.05, {when: (e) => e.brimType !== "none", adv: 1}],
    ["earAngle", "adh", "num", "°", 30, 160, 5, {when: (e) => e.brimType === "ears"}],
    ["skirtLoops", "adh", "num", "", 0, 10, 1],
    ["skirtDist", "adh", "num", "mm", 1, 20, 1, {when: (e) => e.skirtLoops > 0}],
    ["skirtLayers", "adh", "num", "", 1, 50, 1, {when: (e) => e.skirtLoops > 0, adv: 1}],
    ["raftLayers", "adh", "num", "", 0, 6, 1],
    ["raftMargin", "adh", "num", "mm", 0, 15, 0.5, {when: (e) => e.raftLayers > 0}],
    ["raftGap", "adh", "num", "mm", 0, 0.5, 0.05, {when: (e) => e.raftLayers > 0, adv: 1}],
    ["speedOuter", "speed", "num", "mm/s", 5, 600, 5],
    ["speedInner", "speed", "num", "mm/s", 5, 800, 5],
    ["speedInfill", "speed", "num", "mm/s", 5, 800, 5],
    ["speedSolid", "speed", "num", "mm/s", 5, 800, 5, {adv: 1}],
    ["speedTop", "speed", "num", "mm/s", 5, 600, 5],
    ["speedSupport", "speed", "num", "mm/s", 5, 600, 5],
    ["speedFirst", "speed", "num", "mm/s", 5, 200, 5],
    ["travel", "speed", "num", "mm/s", 20, 1000, 10],
    ["accel", "speed", "num", "mm/s²", 100, 50000, 100, {adv: 1}],
    ["fanFromLayer", "cool", "num", "", 0, 10, 1],
    ["minLayerTime", "cool", "num", "s", 0, 60, 1],
    ["bridgeDetect", "cool", "bool", "", 0, 0, 0, {adv: 1}],
    ["bridgeSpeed", "cool", "num", "mm/s", 5, 200, 5, {when: (e) => e.bridgeDetect}],
    ["bridgeFlow", "cool", "num", "×", 0.5, 1.5, 0.05, {when: (e) => e.bridgeDetect, adv: 1}],
    ["bridgeFan", "cool", "num", "%", 0, 100, 5, {when: (e) => e.bridgeDetect}],
    ["retLen", "ret", "num", "mm", 0, 10, 0.1],
    ["retSpeed", "ret", "num", "mm/s", 5, 100, 5],
    ["retMinTravel", "ret", "num", "mm", 0, 10, 0.5, {adv: 1}],
    ["zHop", "ret", "num", "mm", 0, 2, 0.1],
    ["flow", "ret", "num", "×", 0.8, 1.2, 0.01, {adv: 1}],
    ["vase", "special", "bool"],
    ["ironing", "special", "sel", "", ["none", "top", "topmost"]],
    ["ironFlow", "special", "num", "%", 3, 40, 1, {when: (e) => e.ironing !== "none"}],
    ["ironSpacing", "special", "num", "mm", 0.05, 0.5, 0.01, {when: (e) => e.ironing !== "none", adv: 1}],
    ["ironSpeed", "special", "num", "mm/s", 5, 150, 5, {when: (e) => e.ironing !== "none", adv: 1}],
    ["fuzzy", "special", "sel", "", ["none", "outer", "all"]],
    ["fuzzyThick", "special", "num", "mm", 0.05, 1, 0.05, {when: (e) => e.fuzzy !== "none"}],
    ["fuzzyDist", "special", "num", "mm", 0.1, 3, 0.1, {when: (e) => e.fuzzy !== "none", adv: 1}],
    ["startGcode", "gcode", "text"],
    ["endGcode", "gcode", "text"]
  ];
  const label = (id) => (SET_TXT[LANG][id] || SET_TXT.pl[id] || [id])[0];
  const hint = (id) => (SET_TXT[LANG][id] || SET_TXT.pl[id] || ["", ""])[1];
  const optLabel = (id, v) => ((OPT_TXT[LANG][id] || {})[v]) || v;

  function defaults() {
    const p = P(), f = F(), n = state.nozzle;
    const r2 = (v) => Math.round(v * 100) / 100;
    const layerH = state.ov.layerH ?? r2(Math.min(0.75 * n, Math.max(0.08, n * 0.5)));
    const tier = p.maxV >= 400 ? 2 : p.maxV >= 200 ? 1 : 0;
    const sp = [[40, 60, 80, 60, 40, 50, 20, 150], [100, 150, 150, 120, 80, 100, 30, 250], [200, 300, 270, 250, 200, 150, 50, 500]][tier];
    const slowFlex = f.flex ? 0.35 : 1;
    return {
      layerH, firstLayerH: r2(Math.min(0.4, Math.max(0.15, n * 0.5))), lineW: r2(n * 1.125), firstLayerWidth: 1.1,
      seam: "aligned", elephant: 0.1, xyComp: 0,
      walls: 2, wallOrder: "inner", topLayers: Math.max(3, Math.round(0.8 / layerH)), bottomLayers: Math.max(3, Math.round(0.6 / layerH)), topPattern: "monotonic",
      density: 15, pattern: "grid", infillAngle: 45, infillOverlap: 0.15,
      support: false, supType: "normal", supAngle: 40, supBuildplate: false, supPattern: "alternate", supDensity: 15, supExpansion: 0, supZGap: 1, supXY: 0.6,
      supIface: 2, supIfaceDensity: 70, treeAngle: 40, treeBranchDist: 5, treeTipD: r2(Math.max(1, n * 2.5)), treeMaxD: 8, treeGrowAngle: 5, treeWalls: 1,
      brimType: "auto", brimWidth: 5, brimGap: 0.1, earAngle: 125, skirtLoops: 1, skirtDist: 4, skirtLayers: 1, raftLayers: 0, raftMargin: 3, raftGap: 0.2,
      speedOuter: sp[0] * slowFlex, speedInner: sp[1] * slowFlex, speedInfill: sp[2] * slowFlex, speedSolid: sp[3] * slowFlex, speedTop: sp[4] * slowFlex,
      speedSupport: sp[5] * slowFlex, speedFirst: f.flex ? 15 : sp[6], travel: sp[7], accel: p.accel,
      fanFromLayer: 2, minLayerTime: f.flex ? 8 : 6, bridgeDetect: true, bridgeSpeed: [20, 30, 50][tier], bridgeFlow: 0.95, bridgeFan: 100,
      retLen: p.bowden ? (f.flex ? 2 : 5) : f.retract, retSpeed: p.bowden ? 40 : (f.flex ? 20 : 35), retMinTravel: 1.5, zHop: f.group === "petg" ? 0.4 : 0.2, flow: 1,
      vase: false, ironing: "none", ironFlow: 10, ironSpacing: 0.15, ironSpeed: [15, 30, 40][tier], fuzzy: "none", fuzzyThick: 0.3, fuzzyDist: 0.8,
      startGcode: START_TEMPLATES[p.tpl] || START_TEMPLATES.marlin, endGcode: END_TEMPLATES[p.tpl] || END_TEMPLATES.marlin
    };
  }
  const eff = () => Object.assign(defaults(), state.ov);

  // ---------- język ----------
  function applyStatic() {
    document.documentElement.lang = LANG;
    document.querySelectorAll("[data-i18n]").forEach(el => el.textContent = t(el.dataset.i18n));
    document.querySelectorAll("[data-i18n-title]").forEach(el => el.title = t(el.dataset.i18nTitle));
    document.querySelectorAll("[data-i18n-ph]").forEach(el => el.placeholder = t(el.dataset.i18nPh));
    document.querySelectorAll("[data-i18n-aria]").forEach(el => el.setAttribute("aria-label", t(el.dataset.i18nAria)));
    document.querySelectorAll("[data-i18n-u]").forEach(el => el.setAttribute("data-u", t(el.dataset.i18nU)));
    $("langPl").setAttribute("aria-pressed", String(LANG === "pl")); $("langEn").setAttribute("aria-pressed", String(LANG === "en"));
    $("ver").textContent = t(window.cappyNative ? "foot.desk" : "foot.web");
    if (window.cappyNative && window.cappyNative.setLanguage) window.cappyNative.setLanguage(LANG);
  }
  function setLang(l) {
    LANG = l; save(); applyStatic();
    renderPrinterSelect(); renderPrinterInfo(); renderFilament(); renderQuality(); renderSettings(); renderSamples(); renderObjects();
    if (!$("picker").hidden) renderPicker();
    if (result) { renderStats(); renderLegend(); updateLayer(); }
  }

  // ---------- panel: drukarka ----------
  function renderPrinterSelect() {
    const sel = $("selPrinter"); sel.innerHTML = "";
    const groups = {};
    PRINTERS.forEach((p, i) => { (groups[p.vendor] = groups[p.vendor] || []).push([p, i]); });
    for (const [v, arr] of Object.entries(groups)) {
      const og = h("optgroup", {label: vendorName(v)});
      for (const [p, i] of arr) og.append(h("option", {value: i}, prName(p.name)));
      sel.append(og);
    }
    sel.value = state.printer;
    $("prCount").textContent = t("pr.count", {n: PRINTERS.length});
    for (const o of $("selNozzle").options) o.textContent = fmt(+o.value, 1) + " mm";
  }
  function renderPrinterInfo() {
    const p = P();
    $("prMeta").textContent = (p.round ? "Ø" + p.x : p.x + " × " + p.y) + " × " + p.z + " mm · " + p.kin + " · " + t("fw." + p.fw) + " · " + fmt(p.fd, 2) + " mm";
    $("customDims").hidden = !p.custom;
    if (p.custom) { $("cW").value = p.x; $("cD").value = p.y; $("cH").value = p.z; }
    $("selNozzle").value = String(state.nozzle);
    $("selHard").value = p.hardNozzle ? "1" : "0";
    const chips = $("prChips"); chips.innerHTML = "";
    const add = (s, c) => chips.append(h("span", {class: "chip " + (c || "")}, s));
    add(t(p.enc ? "chip.enc" : "chip.open"), p.enc ? "acc" : "");
    add(t(p.bowden ? "chip.bowden" : "chip.direct"));
    add(t("chip.maxT", {n: p.maxT}));
    add(t("chip.maxB", {n: p.maxB}));
    add(t("chip.speed", {n: p.maxV}));
    if (p.fw === "bambu") add(t("chip.bambu"), "warn");
  }

  // ---------- panel: filament ----------
  function renderFilament() {
    const f = F(), base = FILMAP.get(state.fil);
    $("filSwatch").style.background = state.color;
    $("filName").textContent = filName(f);
    $("filSub").textContent = (FLAG[f.cc] ? FLAG[f.cc] + " " : "") + matName(f.mat) + " · " + fmt(f.density, 2) + " g/cm³";
    $("fNoz").value = f.nozzle; $("fNoz").min = base.tMin - 10; $("fNoz").max = base.tMax + 10;
    $("fNozRange").textContent = base.tMin + "–" + base.tMax;
    $("fBed").value = f.bed; $("fFan").value = f.fan; $("fPrice").value = f.price;
    const fc = $("filChips"); fc.innerHTML = "";
    const add = (s, c, title) => fc.append(h("span", {class: "chip " + (c || ""), title}, s));
    add(t("fil.flow", {n: fmt(f.maxVol, 1)}), "", t("fil.flow.t"));
    if (f.dry) add(t("fil.dry", {t: f.dry[0], h: f.dry[1]}));
    if (f.chamber) add(t("fil.chamber", {n: f.chamber}));
    if (f.enc) add(t("fil.enc"), "warn");
    if (f.abr) add(t("fil.abr"), "warn");
    if (f.flex) add(t("fil.flex"), "acc");
    $("filNote").textContent = matNote(f.mat);
    $("filCount").textContent = t("fil.count", {n: FILS.length});
    const cs = $("colors"); cs.innerHTML = "";
    for (const c of COLORS) cs.append(h("button", {style: "background:" + c, "aria-label": c, "aria-pressed": String(c === state.color),
      onclick: () => { state.color = c; save(); renderFilament(); recolorModels(); }}));
    renderAlerts();
  }
  function renderAlerts() {
    const p = P(), f = F(), a = $("alerts"); a.innerHTML = "";
    const add = (bad, k, v) => a.append(h("div", {class: "alert" + (bad ? " bad" : "")}, h("div", {}, h("b", {}, t(k, v)), t(k + ".d", v))));
    const m = matName(f.mat);
    if (f.tMin > p.maxT) add(true, "al.temp", {m, t: f.tMin, p: prName(p.name), max: p.maxT});
    else if (f.nozzle > p.maxT) add(false, "al.over", {t: f.nozzle, max: p.maxT});
    if (f.bed > p.maxB) add(f.bed - p.maxB > 20, "al.bed", {t: f.bed, max: p.maxB});
    if (f.enc && !p.enc) add(false, "al.enc");
    if (f.chamber >= 70 && p.maxT < 400) add(true, "al.ind");
    if (f.abr && !p.hardNozzle) add(false, "al.abr");
    if (f.flex && p.bowden) add(false, "al.flexb");
    if (f.flex && f.mat === "TPU85" && p.bowden) add(true, "al.tpu85");
    const e = eff();
    if (e.layerH > state.nozzle * 0.8) add(false, "al.layer", {n: fmt(state.nozzle, 1), max: fmt(state.nozzle * 0.75, 2)});
    if (e.vase) add(false, "al.vase");
  }

  // wybór filamentu
  let pGroup = "all";
  function openPicker() { $("picker").hidden = false; $("fSearch").value = ""; renderPicker(); setTimeout(() => $("fSearch").focus(), 30); }
  function renderPicker() {
    const tabs = $("pTabs"); tabs.innerHTML = "";
    for (const [id, name] of [["all", t("pick.all")], ["pl", t("pick.pl")], ...MAT_GROUPS.map(g => [g[0], groupName(g[0])])]) {
      tabs.append(h("button", {"aria-pressed": String(pGroup === id), onclick: () => { pGroup = id; renderPicker(); }}, name.replace(/ \(.*\)/, "")));
    }
    const q = $("fSearch").value.trim().toLowerCase().split(/\s+/).filter(Boolean);
    const list = $("pList"); list.innerHTML = "";
    let count = 0;
    for (const [gid] of MAT_GROUPS) {
      if (pGroup !== "all" && pGroup !== "pl" && pGroup !== gid) continue;
      const mats = Object.entries(MATERIALS).filter(([, m]) => m[1] === gid);
      const gEl = h("div", {}, h("div", {class: "picker-group"}, groupName(gid)));
      let gCount = 0;
      for (const [mid, m] of mats) {
        const items = FILS.filter(f => f.mat === mid && (pGroup !== "pl" || f.cc === "PL") &&
          q.every(s => (f.brand + " " + matName(mid) + " " + m[0] + " " + mid).toLowerCase().includes(s)));
        if (!items.length) continue;
        gCount += items.length;
        gEl.append(h("div", {class: "picker-mat"}, h("b", {}, matName(mid)), h("span", {}, m[2][0] + "–" + m[2][1] + " °C · " + t("pick.bed") + " " + m[3] + " °C")));
        gEl.append(h("div", {class: "picker-items"}, items.map(f => h("button", {"aria-current": String(f.key === state.fil), onclick: () => pickFil(f.key)},
          h("span", {}, (f.cc === "PL" ? "🇵🇱 " : "") + f.brand), h("small", {}, f.price + " " + t("cur"))))));
      }
      if (gCount) { list.append(gEl); count += gCount; }
    }
    if (!count) list.append(h("p", {style: "padding:20px;color:var(--muted)"}, t("pick.none")));
    $("pCount").textContent = t("pick.count", {n: count, all: FILS.length});
  }
  function pickFil(key) { state.fil = key; state.filOv = {}; $("picker").hidden = true; save(); renderFilament(); renderSettings(); invalidate(); }

  // ---------- panel: proces ----------
  function renderQuality() {
    const q = $("qual"); q.innerHTML = "";
    const n = state.nozzle, cur = eff().layerH;
    [0.2, 0.3, 0.4, 0.5, 0.6, 0.7].forEach((k, i) => {
      const v = Math.round(Math.max(0.04, n * k) * 100) / 100;
      q.append(h("button", {"aria-pressed": String(Math.abs(v - cur) < 0.001), onclick: () => { state.ov.layerH = v; delete state.ov.topLayers; delete state.ov.bottomLayers; save(); renderQuality(); renderSettings(); renderAlerts(); invalidate(); }},
        h("b", {}, fmt(v, 2)), h("span", {}, t("q." + i))));
    });
  }
  function settingField(s, e, d) {
    const [id, , type, unit, a, b, step, fl] = s;
    const changed = state.ov[id] !== undefined && JSON.stringify(state.ov[id]) !== JSON.stringify(d[id]);
    const onchg = (v) => {
      state.ov[id] = v; save();
      if (id === "layerH") renderQuality();
      renderAlerts(); invalidate();
      if (["support", "supType", "brimType", "skirtLoops", "raftLayers", "ironing", "fuzzy", "bridgeDetect", "supIface"].includes(id) || !changed) renderSettings();
    };
    const hn = hint(id);
    const cls = "fld" + (fl && fl.when ? " dep" : "");
    const lab = h("label", {for: "s_" + id}, h("span", {}, label(id)), changed ? h("span", {style: "color:var(--accent)", title: t("proc.changed")}, "●") : null);
    let input;
    if (type === "bool") {
      input = h("input", {type: "checkbox", id: "s_" + id}); input.checked = !!e[id];
      input.addEventListener("change", () => onchg(input.checked));
      return h("div", {class: cls}, h("label", {class: "toggle", for: "s_" + id}, h("span", {}, label(id), changed ? h("span", {style: "color:var(--accent)"}, " ●") : null), input), hn ? h("div", {class: "hint"}, hn) : null);
    }
    if (type === "sel") {
      input = h("select", {id: "s_" + id}, a.map(v => h("option", {value: v}, optLabel(id, v)))); input.value = e[id];
      input.addEventListener("change", () => onchg(input.value));
    } else if (type === "text") {
      input = h("textarea", {id: "s_" + id, rows: 7, spellcheck: "false", style: "width:100%;font:11.5px/1.45 var(--f-mono);background:var(--panel2);border:1px solid var(--line);border-radius:6px;padding:7px;resize:vertical"});
      input.value = e[id]; input.addEventListener("change", () => onchg(input.value));
    } else {
      input = h("input", {type: "number", id: "s_" + id, min: a, max: b, step}); input.value = Math.round(e[id] * 1000) / 1000;
      input.addEventListener("change", () => { let v = parseFloat(input.value); if (isNaN(v)) v = d[id]; v = Math.min(b, Math.max(a, v)); input.value = v; onchg(v); });
    }
    const wrap = unit && type === "num" ? h("div", {class: "unit", "data-u": unit}, input) : input;
    return h("div", {class: cls}, lab, wrap, hn ? h("div", {class: "hint"}, hn) : null);
  }
  function renderSettings() {
    const tabs = $("tabs"), box = $("settings"); tabs.innerHTML = ""; box.innerHTML = "";
    const e = eff(), d = defaults(), q = state.q.trim().toLowerCase();
    const visible = (s) => (!s[7] || !s[7].when || s[7].when(e));
    if (q) {
      tabs.hidden = true;
      const hits = SET.filter(s => (label(s[0]) + " " + hint(s[0]) + " " + s[0]).toLowerCase().includes(q));
      let lastTab = "";
      for (const s of hits) {
        if (s[1] !== lastTab) { box.append(h("div", {class: "grp"}, t("tab." + s[1]))); lastTab = s[1]; }
        box.append(settingField(s, e, d));
      }
      if (!hits.length) box.append(h("p", {class: "empty"}, t("proc.nores", {q: state.q.trim()})));
      return;
    }
    tabs.hidden = false;
    for (const id of TABS) tabs.append(h("button", {role: "tab", "aria-selected": String(state.tab === id), onclick: () => { state.tab = id; renderSettings(); }}, t("tab." + id)));
    for (const s of SET.filter(s => s[1] === state.tab)) {
      if (!visible(s)) continue;
      if (s[7] && s[7].adv && !state.adv) continue;
      box.append(settingField(s, e, d));
    }
    if (state.tab === "speed") {
      const f = F(), mv = f.maxVol / (e.lineW * e.layerH);
      box.append(h("div", {class: "alert"}, h("div", {}, h("b", {}, t("al.flow", {n: Math.round(mv)})), t("al.flow.d", {v: fmt(f.maxVol, 1), h: fmt(e.layerH, 2), w: fmt(e.lineW, 2)}))));
    }
  }

  // ================= 3D =================
  const canvas = $("c3d"), view = $("view");
  const renderer = new THREE.WebGLRenderer({canvas, antialias: true, alpha: false});
  renderer.setPixelRatio(Math.min(2, window.devicePixelRatio || 1));
  if (THREE.ColorManagement) THREE.ColorManagement.legacyMode = false;
  renderer.outputEncoding = THREE.sRGBEncoding;
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(38, 1, 1, 5000);
  camera.up.set(0, 0, 1);
  const controls = new THREE.OrbitControls(camera, canvas);
  controls.enableDamping = true; controls.dampingFactor = 0.12; controls.screenSpacePanning = true;
  scene.add(new THREE.HemisphereLight(0xffffff, 0x404858, 0.75));
  const sun = new THREE.DirectionalLight(0xffffff, 0.75); sun.position.set(-0.6, -1, 1.4); scene.add(sun);
  const sun2 = new THREE.DirectionalLight(0xffffff, 0.25); sun2.position.set(1, 0.8, 0.6); scene.add(sun2);
  const bedGroup = new THREE.Group(); scene.add(bedGroup);
  const modelGroup = new THREE.Group(); scene.add(modelGroup);
  const prevGroup = new THREE.Group(); scene.add(prevGroup);

  function sceneColors() { renderer.setClearColor(new THREE.Color(css("--scene") || "#121418")); buildBed(); }

  function peiTexture(p) {
    const size = 1024, cv = document.createElement("canvas"); cv.width = cv.height = size;
    const g = cv.getContext("2d");
    const grad = g.createLinearGradient(0, 0, size, size);
    grad.addColorStop(0, "#d9a441"); grad.addColorStop(0.5, "#bd8a30"); grad.addColorStop(1, "#9a6a1d");
    g.fillStyle = grad; g.fillRect(0, 0, size, size);
    let seed = 7; const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
    for (let i = 0; i < 14000; i++) { g.fillStyle = rnd() > 0.5 ? "rgba(110,74,16," + (0.2 + rnd() * 0.35) + ")" : "rgba(246,214,130," + (0.2 + rnd() * 0.35) + ")"; g.fillRect(rnd() * size, rnd() * size, 1 + rnd() * 1.6, 1 + rnd() * 1.6); }
    const sx = size / p.x, sy = size / p.y;
    g.lineWidth = 1; g.strokeStyle = "rgba(70,45,8,.22)";
    for (let x = 10; x < p.x; x += 10) { g.beginPath(); g.moveTo(x * sx, 0); g.lineTo(x * sx, size); g.stroke(); }
    for (let y = 10; y < p.y; y += 10) { g.beginPath(); g.moveTo(0, size - y * sy); g.lineTo(size, size - y * sy); g.stroke(); }
    g.lineWidth = 2; g.strokeStyle = "rgba(70,45,8,.38)";
    for (let x = 50; x < p.x; x += 50) { g.beginPath(); g.moveTo(x * sx, 0); g.lineTo(x * sx, size); g.stroke(); }
    for (let y = 50; y < p.y; y += 50) { g.beginPath(); g.moveTo(0, size - y * sy); g.lineTo(size, size - y * sy); g.stroke(); }
    g.fillStyle = "rgba(60,38,6,.5)"; g.font = "600 " + Math.round(size * 0.032) + "px 'Chakra Petch', sans-serif";
    g.fillText(prName(p.name), size * 0.03, size * 0.965);
    const tex = new THREE.CanvasTexture(cv); tex.anisotropy = 4;
    if ("colorSpace" in tex) tex.colorSpace = "srgb"; else tex.encoding = THREE.sRGBEncoding;
    return tex;
  }
  let lastBedKey = "";
  function buildBed() {
    const p = P();
    const key = [p.name, p.x, p.y, p.z, css("--grid2"), LANG].join("|");
    if (key === lastBedKey) return; lastBedKey = key;
    bedGroup.clear();
    const mat = new THREE.MeshStandardMaterial({map: peiTexture(p), roughness: 0.6, metalness: 0.25});
    const plate = p.round ? new THREE.Mesh(new THREE.CircleGeometry(p.x / 2, 96), mat) : new THREE.Mesh(new THREE.PlaneGeometry(p.x, p.y), mat);
    plate.position.set(p.x / 2, p.y / 2, -0.05); bedGroup.add(plate);
    const base = p.round ? new THREE.CylinderGeometry(p.x / 2 + 4, p.x / 2 + 4, 6, 96) : new THREE.BoxGeometry(p.x + 10, p.y + 10, 6);
    if (p.round) base.rotateX(Math.PI / 2);
    const bm = new THREE.Mesh(base, new THREE.MeshStandardMaterial({color: 0x2a2e33, roughness: 0.8})); bm.position.set(p.x / 2, p.y / 2, -3.2); bedGroup.add(bm);
    const lc = new THREE.Color(css("--grid2") || "#343b43");
    let edges;
    if (p.round) {
      const pts = []; const r = p.x / 2;
      for (let k = 0; k < 96; k++) { const a0 = k / 96 * Math.PI * 2, a1 = (k + 1) / 96 * Math.PI * 2; pts.push(r + r * Math.cos(a0), r + r * Math.sin(a0), p.z, r + r * Math.cos(a1), r + r * Math.sin(a1), p.z); }
      for (let k = 0; k < 4; k++) { const a = k * Math.PI / 2; pts.push(r + r * Math.cos(a), r + r * Math.sin(a), 0, r + r * Math.cos(a), r + r * Math.sin(a), p.z); }
      edges = new THREE.BufferGeometry(); edges.setAttribute("position", new THREE.Float32BufferAttribute(pts, 3));
    } else {
      edges = new THREE.EdgesGeometry(new THREE.BoxGeometry(p.x, p.y, p.z)); edges.translate(p.x / 2, p.y / 2, p.z / 2);
    }
    bedGroup.add(new THREE.LineSegments(edges, new THREE.LineBasicMaterial({color: lc, transparent: true, opacity: 0.8})));
    const ax = (c, x, y) => { const g = new THREE.BufferGeometry(); g.setAttribute("position", new THREE.Float32BufferAttribute([0, 0, 0.05, x, y, 0.05], 3)); return new THREE.Line(g, new THREE.LineBasicMaterial({color: c})); };
    bedGroup.add(ax(0xef4f4f, 20, 0), ax(0x4fcf6f, 0, 20));
  }
  function setView(kind) {
    const p = P(), cx = p.x / 2, cy = p.y / 2, R = Math.max(p.x, p.y, p.z);
    controls.target.set(cx, cy, Math.min(p.z, 60) * 0.3);
    if (kind === "top") camera.position.set(cx, cy - 0.001, R * 2.2);
    else if (kind === "front") camera.position.set(cx, cy - R * 1.45, p.z * 0.3);
    else camera.position.set(cx - R * 0.62, cy - R * 1.3, R * 0.98);
    controls.update();
  }
  function resize() {
    const r = view.getBoundingClientRect();
    renderer.setSize(r.width, r.height, false);
    camera.aspect = r.width / Math.max(1, r.height); camera.updateProjectionMatrix();
    if (prevMat) prevMat.resolution.set(r.width, r.height);
  }
  new ResizeObserver(resize).observe(view);
  (function loop() { requestAnimationFrame(loop); controls.update(); renderer.render(scene, camera); })();

  // ---------- modele ----------
  const objects = []; let selected = null; let nextId = 1;
  function makeMat() { return new THREE.MeshStandardMaterial({color: new THREE.Color(state.color), roughness: 0.55, metalness: 0.04}); }
  function recolorModels() { for (const o of objects) for (const m of o.meshes) m.material.color.set(state.color); updateHighlight(); }
  const objName = (o) => o.key ? t(o.key) : o.name;

  function prepGeo(g) { const geo = g.index ? g.toNonIndexed() : g; if (!geo.attributes.normal) geo.computeVertexNormals(); return geo; }
  function addObject(name, geos, opts) {
    opts = opts || {};
    const group = new THREE.Group();
    const box = new THREE.Box3();
    geos.forEach(g => { g.computeBoundingBox(); box.union(g.boundingBox); });
    const c = new THREE.Vector3(); box.getCenter(c);
    const meshes = geos.map(g => { g = prepGeo(g); g.translate(-c.x, -c.y, -box.min.z); const m = new THREE.Mesh(g, makeMat()); group.add(m); return m; });
    const p = P();
    const o = {id: nextId++, name, key: opts.key, group, meshes, pos: [opts.x ?? p.x / 2, opts.y ?? p.y / 2], rot: opts.rot || [0, 0, 0], scale: opts.scale || [100, 100, 100]};
    modelGroup.add(group); objects.push(o);
    applyXf(o);
    if (opts.x === undefined) placeFree(o);
    select(o); invalidate();
    return o;
  }
  function applyXf(o) {
    const g = o.group;
    g.rotation.set(o.rot[0] * Math.PI / 180, o.rot[1] * Math.PI / 180, o.rot[2] * Math.PI / 180, "XYZ");
    g.scale.set(o.scale[0] / 100, o.scale[1] / 100, o.scale[2] / 100);
    g.position.set(0, 0, 0); g.updateMatrixWorld(true);
    const b = new THREE.Box3().setFromObject(g, true);
    const c = new THREE.Vector3(); b.getCenter(c);
    g.position.set(o.pos[0] - c.x, o.pos[1] - c.y, -b.min.z); g.updateMatrixWorld(true);
    o.box = new THREE.Box3().setFromObject(g, true);
    checkBounds(o);
  }
  function checkBounds(o) {
    const p = P(), b = o.box, tol = 0.5;
    if (p.round) {
      const r = p.x / 2; const pts = [[b.min.x, b.min.y], [b.max.x, b.min.y], [b.min.x, b.max.y], [b.max.x, b.max.y]];
      o.oob = pts.some(([x, y]) => Math.hypot(x - r, y - r) > r + tol) || b.max.z > p.z + tol;
    } else o.oob = b.min.x < -tol || b.min.y < -tol || b.max.x > p.x + tol || b.max.y > p.y + tol || b.max.z > p.z + tol;
  }
  function placeFree(o) {
    const p = P();
    const w = o.box.max.x - o.box.min.x, d = o.box.max.y - o.box.min.y;
    const others = objects.filter(x => x !== o);
    const free = (x, y) => others.every(q => x + w / 2 + 4 < q.box.min.x || x - w / 2 - 4 > q.box.max.x || y + d / 2 + 4 < q.box.min.y || y - d / 2 - 4 > q.box.max.y);
    const cx = p.x / 2, cy = p.y / 2;
    for (let r = 0; r < Math.max(p.x, p.y); r += 6) {
      for (let a = 0; a < 16; a++) {
        const x = cx + r * Math.cos(a / 16 * Math.PI * 2), y = cy + r * Math.sin(a / 16 * Math.PI * 2);
        if (free(x, y)) { o.pos = [x, y]; applyXf(o); return; }
        if (r === 0) break;
      }
    }
  }
  function arrange() {
    if (!objects.length) return;
    const p = P(), gap = 6;
    const items = objects.map(o => ({o, w: o.box.max.x - o.box.min.x, d: o.box.max.y - o.box.min.y})).sort((a, b) => b.d - a.d);
    const rows = []; let row = {items: [], w: 0, d: 0};
    for (const it of items) {
      if (row.items.length && row.w + gap + it.w > p.x - 10) { rows.push(row); row = {items: [], w: 0, d: 0}; }
      row.items.push(it); row.w += (row.items.length > 1 ? gap : 0) + it.w; row.d = Math.max(row.d, it.d);
    }
    rows.push(row);
    const totalD = rows.reduce((a, r) => a + r.d, 0) + gap * (rows.length - 1);
    let y = p.y / 2 + totalD / 2;
    for (const r of rows) {
      let x = p.x / 2 - r.w / 2;
      for (const it of r.items) { it.o.pos = [x + it.w / 2, y - r.d / 2]; applyXf(it.o); x += it.w + gap; }
      y -= r.d + gap;
    }
    renderObjects(); invalidate();
  }
  function select(o) { selected = o; updateHighlight(); renderObjects(); }
  function updateHighlight() {
    for (const o of objects) for (const m of o.meshes) m.material.emissive.set(o.oob ? 0x5a0d0d : o === selected ? 0x0b3a40 : 0x000000);
  }
  const fmt0 = (v) => Math.round(v * 10) / 10;
  function renderObjects() {
    const list = $("objList"); list.innerHTML = "";
    $("emptyHint").hidden = objects.length > 0 || mode === "prev";
    $("objPanel").hidden = !objects.length || mode === "prev";
    for (const o of objects) {
      const b = o.box;
      list.append(h("button", {"aria-current": String(o === selected), class: o.oob ? "oob" : "", onclick: () => select(o)},
        h("span", {}, objName(o)), h("small", {}, o.oob ? t("obj.oob") : fmt(b.max.x - b.min.x, 0) + "×" + fmt(b.max.y - b.min.y, 0) + "×" + fmt(b.max.z, 0))));
    }
    const o = selected; $("xfBox").hidden = !o;
    for (const id of ["btnDup", "btnCenter", "btnFlat", "btnDel"]) $(id).disabled = !o;
    if (!o) return;
    $("pX").value = fmt0(o.pos[0]); $("pY").value = fmt0(o.pos[1]); $("pZ").value = 0;
    ["rX", "rY", "rZ"].forEach((id, i) => $(id).value = Math.round(o.rot[i] * 10) / 10);
    ["sX", "sY", "sZ"].forEach((id, i) => $(id).value = Math.round(o.scale[i] * 10) / 10);
    const b = o.box; $("dX").textContent = fmt(b.max.x - b.min.x, 1); $("dY").textContent = fmt(b.max.y - b.min.y, 1); $("dZ").textContent = fmt(b.max.z - b.min.z, 1);
    updateHighlight();
  }
  function bindXf() {
    const upd = () => { const o = selected; if (!o) return;
      o.pos = [+$("pX").value, +$("pY").value];
      o.rot = ["rX", "rY", "rZ"].map(id => +$(id).value || 0);
      applyXf(o); renderObjects(); invalidate(); };
    ["pX", "pY", "rX", "rY", "rZ"].forEach(id => $(id).addEventListener("change", upd));
    ["sX", "sY", "sZ"].forEach((id, i) => $(id).addEventListener("change", () => {
      const o = selected; if (!o) return; const v = Math.max(1, +$(id).value || 100);
      if ($("uniform").checked) { const k = v / o.scale[i]; o.scale = o.scale.map(s => s * k); } else o.scale[i] = v;
      applyXf(o); renderObjects(); invalidate();
    }));
    $("btnDel").onclick = () => removeSel();
    $("btnDup").onclick = () => { const o = selected; if (!o) return; addObject(o.name, o.meshes.map(m => m.geometry.clone()), {key: o.key, rot: o.rot.slice(), scale: o.scale.slice()}); renderObjects(); };
    $("btnCenter").onclick = () => { const p = P(); if (selected) { selected.pos = [p.x / 2, p.y / 2]; applyXf(selected); renderObjects(); invalidate(); } };
    $("btnFlat").onclick = layFlat;
    $("btnArrange").onclick = arrange;
  }
  function removeSel() {
    const o = selected; if (!o) return;
    modelGroup.remove(o.group); o.meshes.forEach(m => m.geometry.dispose());
    objects.splice(objects.indexOf(o), 1); selected = objects[objects.length - 1] || null; renderObjects(); invalidate();
  }
  function layFlat() {
    const o = selected; if (!o) return;
    const acc = new Map(); const v = [new THREE.Vector3(), new THREE.Vector3(), new THREE.Vector3()], n = new THREE.Vector3(), e1 = new THREE.Vector3(), e2 = new THREE.Vector3();
    for (const m of o.meshes) {
      const pos = m.geometry.attributes.position;
      for (let i = 0; i < pos.count; i += 3) {
        for (let k = 0; k < 3; k++) v[k].fromBufferAttribute(pos, i + k).applyMatrix4(m.matrixWorld);
        e1.subVectors(v[1], v[0]); e2.subVectors(v[2], v[0]); n.crossVectors(e1, e2);
        const a = n.length(); if (a < 1e-9) continue; n.divideScalar(a);
        const key = n.toArray().map(x => Math.round(x * 50)).join(",");
        const cur = acc.get(key) || {a: 0, n: new THREE.Vector3()}; cur.a += a; cur.n.addScaledVector(n, a); acc.set(key, cur);
      }
    }
    let best = null; for (const c of acc.values()) if (!best || c.a > best.a) best = c;
    if (!best) return;
    const q = new THREE.Quaternion().setFromUnitVectors(best.n.normalize(), new THREE.Vector3(0, 0, -1));
    const qo = new THREE.Quaternion().setFromEuler(o.group.rotation);
    const e = new THREE.Euler().setFromQuaternion(q.multiply(qo), "XYZ");
    o.rot = [e.x, e.y, e.z].map(r => Math.round(r * 180 / Math.PI * 100) / 100);
    applyXf(o); renderObjects(); invalidate(); toast(t("obj.flat.done"));
  }

  // przeciąganie modeli
  const ray = new THREE.Raycaster(), mouse = new THREE.Vector2();
  let drag = null;
  function pick(ev) {
    const r = canvas.getBoundingClientRect();
    mouse.set((ev.clientX - r.left) / r.width * 2 - 1, -(ev.clientY - r.top) / r.height * 2 + 1);
    ray.setFromCamera(mouse, camera);
  }
  function planeHit() { const pl = new THREE.Plane(new THREE.Vector3(0, 0, 1), 0); const p = new THREE.Vector3(); return ray.ray.intersectPlane(pl, p) ? p : null; }
  canvas.addEventListener("pointerdown", (ev) => {
    if (mode !== "prep" || ev.button !== 0) return;
    pick(ev);
    const hits = ray.intersectObjects(objects.flatMap(o => o.meshes), false);
    if (hits.length) {
      const o = objects.find(x => x.meshes.includes(hits[0].object));
      select(o);
      const p = planeHit(); if (!p) return;
      drag = {o, dx: o.pos[0] - p.x, dy: o.pos[1] - p.y, moved: false};
      controls.enabled = false; canvas.setPointerCapture(ev.pointerId);
    } else drag = {none: true, x: ev.clientX, y: ev.clientY};
  }, true);
  canvas.addEventListener("pointermove", (ev) => {
    if (!drag || drag.none) return;
    pick(ev); const p = planeHit(); if (!p) return;
    drag.o.pos = [p.x + drag.dx, p.y + drag.dy]; drag.moved = true;
    applyXf(drag.o); updateHighlight();
  });
  const endDrag = (ev) => {
    if (!drag) return;
    if (drag.none) { if (Math.hypot(ev.clientX - drag.x, ev.clientY - drag.y) < 4) select(null); }
    else { controls.enabled = true; if (drag.moved) { renderObjects(); invalidate(); } }
    drag = null;
  };
  canvas.addEventListener("pointerup", endDrag); canvas.addEventListener("pointercancel", endDrag);

  // ---------- wczytywanie plików ----------
  async function loadFiles(files) {
    for (const file of files) {
      const ext = file.name.split(".").pop().toLowerCase();
      try {
        if (ext === "stl") {
          addObject(file.name.replace(/\.stl$/i, ""), [new THREE.STLLoader().parse(await file.arrayBuffer())]);
        } else if (ext === "obj") {
          const root = new THREE.OBJLoader().parse(await file.text()); root.updateMatrixWorld(true);
          const geos = [];
          root.traverse(ch => { if (ch.isMesh) { const g = ch.geometry.clone(); g.applyMatrix4(ch.matrixWorld); g.rotateX(Math.PI / 2); geos.push(g.index ? g.toNonIndexed() : g); } });
          if (!geos.length) throw new Error("no meshes");
          addObject(file.name.replace(/\.obj$/i, ""), geos);
        } else toast(t("t.fmt", {e: ext}));
      } catch (e) { console.error(e); toast(t("t.load", {n: file.name, e: e.message})); }
    }
    setMode("prep");
  }
  $("btnAdd").onclick = () => $("fileIn").click();
  $("fileIn").onchange = (e) => { loadFiles([...e.target.files]); e.target.value = ""; };
  let dragDepth = 0;
  view.addEventListener("dragenter", (e) => { e.preventDefault(); dragDepth++; $("drop").hidden = false; });
  view.addEventListener("dragleave", () => { if (--dragDepth <= 0) { dragDepth = 0; $("drop").hidden = true; } });
  view.addEventListener("dragover", (e) => e.preventDefault());
  view.addEventListener("drop", (e) => { e.preventDefault(); dragDepth = 0; $("drop").hidden = true; loadFiles([...e.dataTransfer.files]); });

  // ---------- przykładowe modele ----------
  const SAMPLES = {
    capy: () => {
      const parts = [];
      const sph = (sx, sy, sz, x, y, z, seg) => { const g = new THREE.SphereGeometry(1, seg || 32, 18); g.scale(sx, sy, sz); g.translate(x, y, z); return g; };
      parts.push(sph(26, 15, 15, 0, 0, 19), sph(12, 10.5, 10.5, 24, 0, 28), sph(8.5, 8.5, 7.5, 33, 0, 25));
      parts.push(sph(2.6, 2, 3.6, 21, 6.5, 37.5, 16), sph(2.6, 2, 3.6, 21, -6.5, 37.5, 16));
      for (const [x, y] of [[-14, 8], [-14, -8], [13, 8], [13, -8]]) { const c = new THREE.CylinderGeometry(4.2, 4.6, 11, 28); c.rotateX(Math.PI / 2); c.translate(x, y, 5.5); parts.push(c); }
      return parts;
    },
    cube: () => [new THREE.BoxGeometry(20, 20, 20)],
    vase: () => {
      const pts = [new THREE.Vector2(0, 0)]; for (let i = 0; i <= 40; i++) pts.push(new THREE.Vector2(14 + 6 * Math.sin(i / 6) + i * 0.08, i * 2));
      const g = new THREE.LatheGeometry(pts, 72); g.rotateX(Math.PI / 2); return [g];
    },
    knot: () => [new THREE.TorusKnotGeometry(16, 5.5, 220, 28)],
    gear: () => {
      const s = new THREE.Shape(), teeth = 18, r1 = 22, r2 = 26;
      for (let i = 0; i < teeth * 4; i++) { const a = i / (teeth * 4) * Math.PI * 2; const r = (i % 4 < 2) ? r2 : r1; const x = r * Math.cos(a), y = r * Math.sin(a); i ? s.lineTo(x, y) : s.moveTo(x, y); }
      const hole = new THREE.Path(); hole.absarc(0, 0, 8, 0, Math.PI * 2, true); s.holes.push(hole);
      return [new THREE.ExtrudeGeometry(s, {depth: 8, bevelEnabled: false, curveSegments: 24})];
    },
    bridge: () => [new THREE.BoxGeometry(8, 12, 18).translate(-24, 0, 9), new THREE.BoxGeometry(8, 12, 18).translate(24, 0, 9), new THREE.BoxGeometry(56, 12, 3).translate(0, 0, 19.5)],
    plate: () => {
      const s = new THREE.Shape(); s.moveTo(-40, -20); s.lineTo(40, -20); s.lineTo(40, 20); s.lineTo(10, 20); s.lineTo(0, 8); s.lineTo(-10, 20); s.lineTo(-40, 20);
      return [new THREE.ExtrudeGeometry(s, {depth: 3, bevelEnabled: false})];
    }
  };
  function addSample(k) {
    addObject("", SAMPLES[k](), {key: "sm." + k}); setMode("prep");
    if (k === "knot" && !eff().support) toast(t("t.needSup"));
  }
  function renderSamples() {
    const m = $("menuSamples"); m.innerHTML = "";
    for (const k of Object.keys(SAMPLES)) m.append(h("button", {onclick: () => { m.hidden = true; $("btnSamples").setAttribute("aria-expanded", "false"); addSample(k); }}, h("span", {}, t("sm." + k)), h("small", {}, t("sm." + k + ".d"))));
  }
  $("btnSamples").onclick = (e) => { e.stopPropagation(); const m = $("menuSamples"); m.hidden = !m.hidden; $("btnSamples").setAttribute("aria-expanded", String(!m.hidden)); };
  document.addEventListener("click", (e) => { if (!$("menuSamples").contains(e.target)) { $("menuSamples").hidden = true; $("btnSamples").setAttribute("aria-expanded", "false"); } });

  // ================= cięcie i podgląd =================
  let result = null, mode = "prep", prevMesh = null, prevMat = null, travelMesh = null;
  const TYPES = [["outer", "#ff8a3d"], ["inner", "#f2c14e"], ["sparse", "#b5394a"], ["solid", "#9a5ae0"], ["top", "#ef4f6e"], ["bridge", "#4a7fe0"], ["iron", "#e8e2d2"],
    ["support", "#49c06b"], ["iface", "#2fa58e"], ["raft", "#8c8f96"], ["skirt", "#3fc1d6"], ["brim", "#6fb7e8"]];
  const hiddenT = new Set(); let showTravel = false;

  let sliceGen = 0;
  function invalidate() {
    sliceGen++;
    if (result) { result = null; clearPreview(); $("btnExport").disabled = true; if (mode === "prev") setMode("prep"); }
  }
  function clearPreview() { prevGroup.clear(); if (prevMesh) { prevMesh.geometry.dispose(); prevMesh = null; } if (travelMesh) { travelMesh.geometry.dispose(); travelMesh = null; } }

  function buildCfg() {
    const p = P(), f = F(), e = eff();
    return Object.assign({}, e, {
      bedW: p.x, bedD: p.y, center: p.center, filD: p.fd, nozzle: state.nozzle, bedTemp: f.bed, nozzleTemp: Math.min(f.nozzle, p.maxT),
      firstLayerTemp: Math.min(f.nozzle + 5, p.maxT, f.tMax), firstLayerBed: f.bed, chamber: f.chamber, fan: f.fan, maxVol: f.maxVol, maxSpeed: p.maxV,
      matDensity: f.density, price: f.price, printerName: prName(p.name), filamentName: filName(f), travelZ: 10, minSpeed: 10,
      warpProne: f.enc || ["sty", "pc", "pa", "ht"].includes(f.group), previewTravel: true
    });
  }
  async function doSlice() {
    if (!objects.length) { toast(t("t.addFirst")); return; }
    const bad = objects.filter(o => o.oob);
    if (bad.length) { toast(t("t.oob", {n: objName(bad[0])})); return; }
    const parts = [];
    for (const o of objects) for (const m of o.meshes) {
      m.updateMatrixWorld(true);
      const src = m.geometry.attributes.position, arr = new Float32Array(src.count * 3), v = new THREE.Vector3();
      for (let i = 0; i < src.count; i++) { v.fromBufferAttribute(src, i).applyMatrix4(m.matrixWorld); arr[i*3] = v.x; arr[i*3+1] = v.y; arr[i*3+2] = v.z; }
      parts.push(arr);
    }
    $("prog").hidden = false; $("btnSlice").disabled = true;
    const t0 = performance.now();
    try {
      const cfg = buildCfg(), gen = sliceGen;
      const res = await CappyEngine.slice(parts, cfg, (f, key, i, n) => { $("progBar").style.width = Math.round(f * 100) + "%"; $("progS").textContent = t("prog." + key, {i, n}); });
      if (gen !== sliceGen) return; // w trakcie cięcia zmieniono model lub ustawienia – wynik jest nieaktualny
      result = res;
      result.ms = performance.now() - t0;
      result.cfg = cfg;
      $("btnExport").disabled = false;
      buildPreview(); setMode("prev");
      $("layer").value = $("layer").max; updateLayer();
    } catch (e) { console.error(e); toast(t("t.err", {e: e.message})); }
    finally { $("prog").hidden = true; $("btnSlice").disabled = false; }
  }

  function buildPreview() {
    clearPreview(); if (!result) return;
    const pv = result.preview;
    const col = {}; for (const [k, c] of TYPES) col[k] = new THREE.Color(c);
    const pos = [], cols = [], cum = [0];
    for (let L = 0; L < pv.layerStart.length - 1; L++) {
      const shade = L % 2 ? 0.84 : 1;
      for (let s = pv.layerStart[L]; s < pv.layerStart[L + 1]; s++) {
        const ty = pv.types[s]; if (hiddenT.has(ty)) continue;
        const o = s * 6, dz = result.cfg.layerH * 0.25;
        pos.push(pv.segs[o], pv.segs[o+1], pv.segs[o+2] - dz, pv.segs[o+3], pv.segs[o+4], pv.segs[o+5] - dz);
        const c = col[ty] || col.outer; cols.push(c.r * shade, c.g * shade, c.b * shade, c.r * shade, c.g * shade, c.b * shade);
      }
      cum.push(pos.length / 6);
    }
    result.cum = cum;
    if (pos.length) {
      const geo = new THREE.LineSegmentsGeometry();
      geo.setPositions(new Float32Array(pos)); geo.setColors(new Float32Array(cols));
      prevMat = new THREE.LineMaterial({linewidth: result.cfg.lineW * 0.92, worldUnits: true, vertexColors: true});
      const r = view.getBoundingClientRect(); prevMat.resolution.set(r.width, r.height);
      prevMesh = new THREE.LineSegments2(geo, prevMat); prevMesh.frustumCulled = false; prevGroup.add(prevMesh);
    }
    if (showTravel && pv.travel.length) {
      const g = new THREE.BufferGeometry(); g.setAttribute("position", new THREE.Float32BufferAttribute(pv.travel, 3));
      travelMesh = new THREE.LineSegments(g, new THREE.LineBasicMaterial({color: 0x7a8aa0, transparent: true, opacity: 0.55})); prevGroup.add(travelMesh);
    }
    const L = pv.layerStart.length - 1;
    $("layer").max = L - 1; if (+$("layer").value > L - 1) $("layer").value = L - 1;
    renderStats(); renderLegend();
  }
  function updateLayer() {
    if (!result) return;
    const i = +$("layer").value, pv = result.preview;
    if (prevMesh) prevMesh.geometry.instanceCount = result.cum[i + 1];
    if (travelMesh) travelMesh.geometry.setDrawRange(0, pv.travelStart[i + 1] * 2);
    $("lOut").innerHTML = ""; $("lOut").append(String(i + 1), h("small", {}, fmt(pv.z[i], 2) + " mm"));
  }
  function hms(s) { s = Math.round(s); const hh = Math.floor(s / 3600), mm = Math.floor(s % 3600 / 60); return hh ? hh + " h " + mm + " min" : mm ? mm + " min " + (s % 60) + " s" : s + " s"; }
  function renderStats() {
    const st = result.stats, c = result.cfg;
    $("stTime").textContent = hms(st.time);
    const kv = $("stKv"); kv.innerHTML = "";
    const add = (k, v) => kv.append(h("dt", {}, t(k)), h("dd", {}, v));
    add("st.fil", fmt(st.filament / 1000, 2) + " m");
    add("st.mass", fmt(st.grams, 1) + " g");
    add("st.cost", fmt(st.cost, 2) + " " + t("cur"));
    add("st.layers", st.layers + " × " + fmt(c.layerH, 2) + " mm");
    add("st.lines", result.gcode.split("\n").length.toLocaleString(loc()));
    add("st.time", fmt(result.ms / 1000, 1) + " s");
  }
  function renderLegend() {
    const lg = $("legend"); lg.innerHTML = "";
    const st = result.stats, total = Object.values(st.byType).reduce((a, b) => a + b, 0) || 1;
    for (const [k, c] of TYPES) {
      if (!st.byType[k]) continue;
      const pct = st.byType[k] / total * 100;
      lg.append(h("button", {"aria-pressed": String(!hiddenT.has(k)), title: t("lg.toggle"), onclick: () => { hiddenT.has(k) ? hiddenT.delete(k) : hiddenT.add(k); buildPreview(); updateLayer(); }},
        h("i", {style: "background:" + c}), h("span", {}, t("ty." + k)), h("small", {}, Math.round(pct) + "%"), h("span", {class: "bar"}, h("span", {style: "width:" + pct + "%"}))));
    }
    lg.append(h("button", {"aria-pressed": String(showTravel), onclick: () => { showTravel = !showTravel; buildPreview(); updateLayer(); }},
      h("i", {style: "background:#7a8aa0"}), h("span", {}, t("lg.travel")), h("small", {}, ""), h("span", {})));
  }

  function setMode(m) {
    if (m === "prev" && !result) { doSlice(); return; }
    mode = m;
    $("mPrep").setAttribute("aria-pressed", String(m === "prep")); $("mPrev").setAttribute("aria-pressed", String(m === "prev"));
    modelGroup.visible = m === "prep"; prevGroup.visible = m === "prev";
    for (const id of ["stats", "legend", "layerbar"]) $(id).hidden = m !== "prev";
    $("stats").classList.add("withbar");
    $("tbPrep").hidden = m !== "prep";
    if (m !== "prev") $("drawer").hidden = true;
    renderObjects();
  }

  // ---------- eksport ----------
  function crc32(buf) {
    let c, crc = 0xFFFFFFFF; const tb = crc32.t || (crc32.t = Array.from({length: 256}, (_, n) => { c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xEDB88320 ^ (c >>> 1) : c >>> 1; return c >>> 0; }));
    for (let i = 0; i < buf.length; i++) crc = tb[(crc ^ buf[i]) & 0xFF] ^ (crc >>> 8);
    return (crc ^ 0xFFFFFFFF) >>> 0;
  }
  function makeZip(name, text) {
    const data = new TextEncoder().encode(text), fn = new TextEncoder().encode(name), crc = crc32(data);
    const lh = new DataView(new ArrayBuffer(30)); lh.setUint32(0, 0x04034b50, true); lh.setUint16(4, 20, true); lh.setUint32(14, crc, true); lh.setUint32(18, data.length, true); lh.setUint32(22, data.length, true); lh.setUint16(26, fn.length, true);
    const ch = new DataView(new ArrayBuffer(46)); ch.setUint32(0, 0x02014b50, true); ch.setUint16(4, 20, true); ch.setUint16(6, 20, true); ch.setUint32(16, crc, true); ch.setUint32(20, data.length, true); ch.setUint32(24, data.length, true); ch.setUint16(28, fn.length, true);
    const cdOff = 30 + fn.length + data.length;
    const end = new DataView(new ArrayBuffer(22)); end.setUint32(0, 0x06054b50, true); end.setUint16(8, 1, true); end.setUint16(10, 1, true); end.setUint32(12, 46 + fn.length, true); end.setUint32(16, cdOff, true);
    return new Blob([lh.buffer, fn, data, ch.buffer, fn, end.buffer]);
  }
  function gcodeName() {
    const base = (objects[0] ? objName(objects[0]) : "print").normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/ł/g, "l").replace(/[^\w-]+/g, "_").slice(0, 40) || "print";
    const s = result.stats.time;
    return base + "_" + F().mat + "_" + Math.floor(s / 3600) + "h" + Math.floor(s % 3600 / 60) + "m.gcode";
  }
  async function exportGcode() {
    if (!result) return;
    const name = gcodeName(), text = result.gcode;
    if (window.cappyNative && window.cappyNative.saveFile) {
      const r = await window.cappyNative.saveFile(name, text, LANG); if (r) toast(t("t.saved", {n: r})); return;
    }
    if (window.claude && window.claude.use) {
      const dl = await window.claude.use("downloads");
      if (dl) {
        try { await dl.save({filename: name.replace(/\.gcode$/, ".zip"), data: makeZip(name, text)}); toast(t("t.zip", {n: name})); }
        catch (e) { if (e && e.code !== "declined") toast(t("t.saveFail", {e: e.code || e.message})); }
        return;
      }
      toast(t("t.noSave")); openG(); return;
    }
    const a = h("a", {href: URL.createObjectURL(new Blob([text], {type: "text/plain"})), download: name});
    document.body.append(a); a.click(); a.remove(); toast(t("t.dl", {n: name}));
  }
  function openG() {
    if (!result) return;
    const lines = result.gcode.split("\n"); const N = 3000;
    $("gText").textContent = lines.slice(0, N).join("\n") + (lines.length > N ? "\n\n" + t("g.more", {n: (lines.length - N).toLocaleString(loc())}) : "");
    $("gInfo").textContent = t("g.lines", {n: lines.length.toLocaleString(loc())}) + " · " + fmt(result.gcode.length / 1024 / 1024, 2) + " MB";
    $("drawer").hidden = false;
  }
  $("btnGview").onclick = openG;
  $("btnCloseG").onclick = () => $("drawer").hidden = true;
  $("btnCopy").onclick = async () => {
    try { await navigator.clipboard.writeText(result.gcode); toast(t("g.copied")); }
    catch (e) { const r = document.createRange(); r.selectNodeContents($("gText")); const s = getSelection(); s.removeAllRanges(); s.addRange(r); toast(t("g.selected")); }
  };

  // ---------- zdarzenia ----------
  $("selPrinter").onchange = (e) => { state.printer = +e.target.value; state.hard = null; save(); lastBedKey = ""; buildBed(); setView("iso"); objects.forEach(applyXf); renderPrinterInfo(); renderFilament(); renderQuality(); renderSettings(); renderObjects(); invalidate(); };
  $("selNozzle").onchange = (e) => { state.nozzle = +e.target.value; delete state.ov.layerH; delete state.ov.lineW; delete state.ov.firstLayerH; delete state.ov.treeTipD; save(); renderPrinterInfo(); renderQuality(); renderSettings(); renderAlerts(); invalidate(); };
  $("selHard").onchange = (e) => { state.hard = +e.target.value; save(); renderAlerts(); };
  for (const [id, k] of [["cW", "x"], ["cD", "y"], ["cH", "z"]]) $(id).onchange = (e) => { state.custom[k] = Math.max(50, Math.min(1000, +e.target.value || 200)); save(); lastBedKey = ""; buildBed(); setView("iso"); objects.forEach(applyXf); renderPrinterInfo(); renderObjects(); invalidate(); };
  for (const [id, k] of [["fNoz", "nozzle"], ["fBed", "bed"], ["fFan", "fan"], ["fPrice", "price"]]) $(id).onchange = (e) => { state.filOv[k] = +e.target.value; save(); renderAlerts(); invalidate(); };
  $("btnFil").onclick = openPicker;
  $("pClose").onclick = () => $("picker").hidden = true;
  $("picker").addEventListener("click", (e) => { if (e.target.id === "picker") $("picker").hidden = true; });
  $("fSearch").addEventListener("input", renderPicker);
  $("setSearch").addEventListener("input", (e) => { state.q = e.target.value; renderSettings(); });
  $("advMode").checked = state.adv;
  $("advMode").addEventListener("change", (e) => { state.adv = e.target.checked; save(); renderSettings(); });
  $("btnReset").onclick = () => { state.ov = {}; save(); renderQuality(); renderSettings(); renderAlerts(); invalidate(); toast(t("proc.reset.done")); };
  $("btnSlice").onclick = doSlice;
  $("btnExport").onclick = exportGcode;
  $("mPrep").onclick = () => setMode("prep");
  $("mPrev").onclick = () => setMode("prev");
  $("langPl").onclick = () => setLang("pl");
  $("langEn").onclick = () => setLang("en");
  $("layer").addEventListener("input", updateLayer);
  $("lUp").onclick = () => { $("layer").value = +$("layer").value + 1; updateLayer(); };
  $("lDn").onclick = () => { $("layer").value = +$("layer").value - 1; updateLayer(); };
  document.querySelectorAll("[data-view]").forEach(b => b.onclick = () => setView(b.dataset.view));
  document.addEventListener("keydown", (e) => {
    if (e.target.matches("input, textarea, select")) return;
    if (e.key === "Escape") { $("picker").hidden = true; $("drawer").hidden = true; }
    if (mode === "prev" && (e.key === "ArrowUp" || e.key === "ArrowDown")) { e.preventDefault(); $("layer").value = +$("layer").value + (e.key === "ArrowUp" ? 1 : -1); updateLayer(); }
    if (mode === "prep" && (e.key === "Delete" || e.key === "Backspace") && selected) removeSel();
  });
  $("btnTheme").onclick = () => {
    const cur = document.documentElement.getAttribute("data-theme") || (matchMedia("(prefers-color-scheme: light)").matches ? "light" : "dark");
    const nx = cur === "dark" ? "light" : "dark"; document.documentElement.setAttribute("data-theme", nx);
    try { localStorage.setItem("cappy.theme", nx); } catch (e) {}
  };
  try { const th = localStorage.getItem("cappy.theme"); if (th) document.documentElement.setAttribute("data-theme", th); } catch (e) {}
  new MutationObserver(() => { lastBedKey = ""; sceneColors(); }).observe(document.documentElement, {attributes: true, attributeFilter: ["data-theme"]});
  matchMedia("(prefers-color-scheme: light)").addEventListener("change", () => { lastBedKey = ""; sceneColors(); });

  // ---------- start ----------
  $("logo").src = window.CAPPY_ICON || "";
  applyStatic();
  renderPrinterSelect(); renderPrinterInfo(); renderFilament(); renderQuality(); renderSettings(); renderSamples(); bindXf();
  sceneColors(); resize(); setView("iso");
  const p0 = P();
  addObject("", SAMPLES.capy(), {key: "sm.capy", x: p0.x / 2 - 12, y: p0.y / 2 + 6});
  addObject("", SAMPLES.cube(), {key: "sm.cube", x: p0.x / 2 + 36, y: p0.y / 2 - 28});
  select(objects[0]);
  setMode("prep");
  setTimeout(doSlice, 250);
})();
