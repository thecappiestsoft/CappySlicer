// Budowanie CappySlicer.
//   node build.js            → dist/web/CappySlicer.html (samodzielny plik, działa offline)
//                              + app/index.html (dla wersji desktop / Electron)
//   node build.js --cdn      → dist/artifact.html (biblioteki z CDN, bez znaczników html/head/body)
const fs = require("fs");
const path = require("path");
const R = (p) => fs.readFileSync(path.join(__dirname, p), "utf8");
const cdn = process.argv.includes("--cdn");

const VENDOR = [
  ["three.min.js", "https://cdn.jsdelivr.net/npm/three@0.147.0/build/three.min.js"],
  ["OrbitControls.js", "https://cdn.jsdelivr.net/npm/three@0.147.0/examples/js/controls/OrbitControls.js"],
  ["STLLoader.js", "https://cdn.jsdelivr.net/npm/three@0.147.0/examples/js/loaders/STLLoader.js"],
  ["OBJLoader.js", "https://cdn.jsdelivr.net/npm/three@0.147.0/examples/js/loaders/OBJLoader.js"],
  ["LineSegmentsGeometry.js", "https://cdn.jsdelivr.net/npm/three@0.147.0/examples/js/lines/LineSegmentsGeometry.js"],
  ["LineMaterial.js", "https://cdn.jsdelivr.net/npm/three@0.147.0/examples/js/lines/LineMaterial.js"],
  ["LineSegments2.js", "https://cdn.jsdelivr.net/npm/three@0.147.0/examples/js/lines/LineSegments2.js"],
  ["clipper.js", "https://cdn.jsdelivr.net/npm/clipper-lib@6.4.2/clipper.js"]
];

const iconUri = "data:image/svg+xml;base64," + Buffer.from(R("src/icon.svg")).toString("base64");
const fonts = '<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>' +
  '<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Chakra+Petch:wght@500;600&family=IBM+Plex+Mono:wght@400;500;600&family=IBM+Plex+Sans:wght@400;500;600&display=swap">';
const inline = (code) => "<script>\n" + code.replace(/<\/script/gi, "<\\/script") + "\n</script>";

const head = `<title>CappySlicer</title>\n<link rel="icon" href="${iconUri}">\n${fonts}\n<style>\n${R("src/app.css")}\n</style>`;
const libs = cdn ? VENDOR.map(([, url]) => `<script src="${url}"></script>`).join("\n")
                 : VENDOR.map(([f]) => inline(R("vendor/" + f))).join("\n");
const app = [inline(`window.CAPPY_ICON = "${iconUri}";`), inline(R("src/data.js")), inline(R("src/i18n.js")), inline(R("src/engine.js")), inline(R("src/app.js"))].join("\n");
const body = R("src/body.html");

if (cdn) {
  fs.mkdirSync(path.join(__dirname, "dist"), {recursive: true});
  fs.writeFileSync(path.join(__dirname, "dist/artifact.html"), head + "\n" + body + "\n" + libs + "\n" + app + "\n");
  console.log("dist/artifact.html");
} else {
  const full = `<!doctype html>\n<html lang="pl">\n<head>\n<meta charset="utf-8">\n<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">\n${head}\n</head>\n<body>\n${body}\n${libs}\n${app}\n</body>\n</html>\n`;
  for (const out of ["dist/web/CappySlicer.html", "app/index.html"]) {
    fs.mkdirSync(path.dirname(path.join(__dirname, out)), {recursive: true});
    fs.writeFileSync(path.join(__dirname, out), full);
    console.log(out, (full.length / 1024).toFixed(0) + " KB");
  }
}
