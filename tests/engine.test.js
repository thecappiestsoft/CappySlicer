// Test silnika CappySlicer: node tests/engine.test.js
globalThis.ClipperLib = require("../vendor/clipper.js");
const THREE = require("three");
require("../src/engine.js");

function geo(g) {
  const n = g.index ? g.toNonIndexed() : g; n.computeBoundingBox(); const b = n.boundingBox;
  n.translate(110 - (b.min.x + b.max.x) / 2, 110 - (b.min.y + b.max.y) / 2, -b.min.z);
  return n.attributes.position.array;
}
const knotGeo = () => { const g = new THREE.TorusKnotGeometry(15, 5, 160, 24); g.rotateX(Math.PI / 2); return g; };
const bridgeGeo = () => {
  const parts = [new THREE.BoxGeometry(8, 12, 18).translate(-24, 0, 9), new THREE.BoxGeometry(8, 12, 18).translate(24, 0, 9), new THREE.BoxGeometry(56, 12, 3).translate(0, 0, 19.5)];
  return parts;
};
const gearGeo = () => {
  const s = new THREE.Shape(); s.moveTo(-15, -15); s.lineTo(15, -15); s.lineTo(15, 15); s.lineTo(-15, 15);
  const hole = new THREE.Path(); hole.absarc(0, 0, 6, 0, Math.PI * 2, true); s.holes.push(hole);
  return new THREE.ExtrudeGeometry(s, {depth: 6, bevelEnabled: false});
};
const vaseGeo = () => { const pts = [new THREE.Vector2(0, 0)]; for (let i = 0; i <= 20; i++) pts.push(new THREE.Vector2(12 + 4 * Math.sin(i / 3), i * 2)); const g = new THREE.LatheGeometry(pts, 64); g.rotateX(Math.PI / 2); return g; };

const base = {firstLayerH: 0.2, layerH: 0.2, lineW: 0.45, firstLayerWidth: 1.1, walls: 2, topLayers: 4, bottomLayers: 3, infillOverlap: 0.15, pattern: "grid", density: 15, infillAngle: 45,
  support: false, supType: "normal", supAngle: 40, supZGap: 1, supXY: 0.6, supDensity: 15, supIface: 2, supIfaceDensity: 70, supPattern: "alternate", supExpansion: 0, supBuildplate: false,
  treeAngle: 40, treeBranchDist: 5, treeTipD: 1.2, treeMaxD: 8, treeGrowAngle: 5, treeWalls: 1,
  skirtLoops: 2, skirtDist: 4, skirtLayers: 1, brimType: "none", brimWidth: 5, brimGap: 0.1, earAngle: 125, raftLayers: 0, raftMargin: 3, raftGap: 0.2,
  seam: "aligned", wallOrder: "inner", elephant: 0.1, xyComp: 0, topPattern: "monotonic", ironing: "none", ironFlow: 10, ironSpacing: 0.15, ironSpeed: 30,
  vase: false, fuzzy: "none", fuzzyThick: 0.3, fuzzyDist: 0.8, bridgeDetect: true, bridgeSpeed: 25, bridgeFlow: 0.95, bridgeFan: 100, warpProne: false,
  bedW: 220, bedD: 220, center: false, filD: 1.75, nozzle: 0.4, accel: 2000, bedTemp: 60, nozzleTemp: 210, firstLayerTemp: 215, firstLayerBed: 60,
  startGcode: "G28", endGcode: "M84", retLen: 0.8, retSpeed: 35, retMinTravel: 1.5, zHop: 0.2, travelZ: 10, travel: 200, fan: 100, fanFromLayer: 1,
  speedFirst: 30, speedOuter: 60, speedInner: 100, speedInfill: 150, speedSolid: 120, speedTop: 60, speedSupport: 100,
  maxVol: 15, maxSpeed: 300, minLayerTime: 6, minSpeed: 10, flow: 1, matDensity: 1.24, price: 85, printerName: "Test", filamentName: "PLA"};
const cfgOf = (o) => Object.assign({}, base, o);
const run = async (name, pos, o, check) => {
  const cfg = cfgOf(o);
  const r = await CappyEngine.slice(pos, cfg);
  const bt = Object.fromEntries(Object.entries(r.stats.byType).map(([k, v]) => [k, Math.round(v)]));
  const msg = check(r, bt);
  console.log((msg === true ? "OK  " : "FAIL") + " " + name.padEnd(30) + " " + (r.sliceMs + "ms").padStart(7) + "  layers " + r.stats.layers + "  " + JSON.stringify(bt) + (msg === true ? "" : "  → " + msg));
  if (msg !== true) process.exitCode = 1;
  return r;
};
(async () => {
  const knot = geo(knotGeo()), cube = geo(new THREE.BoxGeometry(20, 20, 20)), plate = geo(gearGeo());
  const bridge = bridgeGeo().map(g => g.translate(110, 110, 0)).map(g => g.toNonIndexed().attributes.position.array);
  await run("kostka – podstawowo", cube, {}, (r, b) => b.outer > 0 && b.sparse > 0 && b.top > 0 || "brak ścieżek");
  await run("węzeł – podpory zwykłe", knot, {support: true}, (r, b) => b.support > 0 || "brak podpór");
  const tr = await run("węzeł – podpory drzewiaste", knot, {support: true, supType: "tree"}, (r, b) => b.support > 0 && b.iface > 0 || "brak drzew");
  await run("węzeł – drzewa tylko od stołu", knot, {support: true, supType: "tree", supBuildplate: true}, (r, b) => b.support > 0 || "brak drzew");
  await run("mostek – wykrywanie mostków", bridge, {}, (r, b) => (b.bridge > 0 && /;TYPE:Bridge/.test(r.gcode)) || "brak mostka");
  await run("płytka z otworem – brim zewn.", plate, {brimType: "outer"}, (r, b) => b.brim > 0 || "brak brimu");
  await run("płytka – brim wewnętrzny", plate, {brimType: "inner"}, (r, b) => b.brim > 0 || "brak brimu");
  await run("płytka – mysie uszy", plate, {brimType: "ears"}, (r, b) => b.brim > 0 || "brak uszu");
  await run("kostka – raft 3 warstwy", cube, {raftLayers: 3}, (r, b) => (b.raft > 0 && r.preview.z[3] > 0.79) || "raft/z: " + r.preview.z.slice(0, 5));
  await run("kostka – prasowanie", cube, {ironing: "top"}, (r, b) => b.iron > 0 || "brak prasowania");
  await run("kostka – fuzzy skin", cube, {fuzzy: "outer"}, (r, b) => b.outer > 0 || "brak");
  await run("wazon – tryb spiralny", geo(vaseGeo()), {vase: true}, (r, b) => (/G1 X[\d.]+ Y[\d.]+ Z[\d.]+ E/.test(r.gcode) && !b.sparse) || "brak spirali");
  await run("kostka – top koncentryczny", cube, {topPattern: "concentric", pattern: "gyroid"}, (r, b) => b.top > 0 || "brak");
  require("fs").writeFileSync(__dirname + "/tree.gcode", tr.gcode);
})();
