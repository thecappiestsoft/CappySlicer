// Pakowanie wersji desktop bez podpisu (Windows x64, macOS x64/arm64, Linux x64)
const {packager} = require("@electron/packager");
const path = require("path");
(async () => {
  const targets = (process.argv[2] || "win32-x64,darwin-x64,darwin-arm64,linux-x64").split(",");
  for (const t of targets) {
    const [platform, arch] = t.split("-");
    const icon = platform === "win32" ? "assets/icon.ico" : platform === "darwin" ? "assets/icon.icns" : "assets/icon.png";
    const out = await packager({
      dir: ".", name: "CappySlicer", executableName: platform === "linux" ? "cappyslicer" : "CappySlicer",
      platform, arch, electronVersion: "33.2.1", out: "release", overwrite: true, icon, asar: true, prune: false,
      appBundleId: "pl.infotech.cappyslicer", appCategoryType: "public.app-category.graphics-design",
      appCopyright: "© 2026 CappySoft.pl", appVersion: "1.1.0",
      win32metadata: {CompanyName: "CappySoft", ProductName: "CappySlicer", FileDescription: "CappySlicer – 3D printing slicer", LegalCopyright: "© 2026 CappySoft.pl"},
      ignore: [/^\/(src|vendor|dist|tests|tools|release|node_modules|build\.js|README\.md)(\/|$)/, /^\/assets\/icon\.(ico|icns)$/, /^\/assets\/icon-\d+\.png$/]
    });
    console.log("OK", t, out.join(", "));
  }
})().catch(e => { console.error("FAIL", e.message); process.exit(1); });
