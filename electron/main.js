// CappySlicer – wersja desktop (Electron)
const {app, BrowserWindow, ipcMain, dialog, Menu, shell} = require("electron");
const path = require("path");
const fs = require("fs");

function createWindow() {
  const win = new BrowserWindow({
    width: 1440, height: 900, minWidth: 900, minHeight: 600,
    title: "CappySlicer", backgroundColor: "#0f1114",
    icon: path.join(__dirname, "..", "assets", "icon.png"),
    webPreferences: {preload: path.join(__dirname, "preload.js"), contextIsolation: true, nodeIntegration: false}
  });
  win.loadFile(path.join(__dirname, "..", "app", "index.html"));
  win.webContents.setWindowOpenHandler(({url}) => { shell.openExternal(url); return {action: "deny"}; });
  if (process.env.CAPPY_SHOT) {
    win.webContents.on("console-message", (e, lvl, msg) => console.log("[console]", msg));
    setTimeout(async () => {
      const info = await win.webContents.executeJavaScript(process.env.CAPPY_JS || "document.title");
      console.log("[info]", JSON.stringify(info));
      await new Promise(r => setTimeout(r, 4000));
      win.webContents.invalidate();
      await new Promise(r => setTimeout(r, 1500));
      const img = await win.webContents.capturePage();
      fs.writeFileSync(process.env.CAPPY_SHOT, img.toPNG());
      app.quit();
    }, +(process.env.CAPPY_WAIT || 9000));
  }
}

const TXT = {
  pl: {save: "Zapisz G-code", all: "Wszystkie pliki", file: "Plik", quit: "Zakończ", edit: "Edycja", undo: "Cofnij", redo: "Ponów", cut: "Wytnij", copy: "Kopiuj", paste: "Wklej",
    selectAll: "Zaznacz wszystko", view: "Widok", reload: "Odśwież", dev: "Narzędzia deweloperskie", zoom0: "Rzeczywisty rozmiar", zoomIn: "Powiększ", zoomOut: "Pomniejsz", full: "Pełny ekran"},
  en: {save: "Save G-code", all: "All files", file: "File", quit: "Quit", edit: "Edit", undo: "Undo", redo: "Redo", cut: "Cut", copy: "Copy", paste: "Paste",
    selectAll: "Select all", view: "View", reload: "Reload", dev: "Developer tools", zoom0: "Actual size", zoomIn: "Zoom in", zoomOut: "Zoom out", full: "Full screen"}
};
let lang = "pl";

ipcMain.handle("save-file", async (e, name, text, l) => {
  const T = TXT[l === "en" ? "en" : "pl"];
  const win = BrowserWindow.fromWebContents(e.sender);
  const r = await dialog.showSaveDialog(win, {title: T.save, defaultPath: name, filters: [{name: "G-code", extensions: ["gcode"]}, {name: T.all, extensions: ["*"]}]});
  if (r.canceled || !r.filePath) return null;
  await fs.promises.writeFile(r.filePath, text, "utf8");
  return r.filePath;
});
ipcMain.on("set-lang", (e, l) => { if ((l === "en" ? "en" : "pl") !== lang) { lang = l === "en" ? "en" : "pl"; buildMenu(); } });

function buildMenu() {
  const T = TXT[lang];
  Menu.setApplicationMenu(Menu.buildFromTemplate([
    ...(process.platform === "darwin" ? [{role: "appMenu"}] : []),
    {label: T.file, submenu: [{role: process.platform === "darwin" ? "close" : "quit", label: T.quit}]},
    {label: T.edit, submenu: [{role: "undo", label: T.undo}, {role: "redo", label: T.redo}, {type: "separator"}, {role: "cut", label: T.cut}, {role: "copy", label: T.copy}, {role: "paste", label: T.paste}, {role: "selectAll", label: T.selectAll}]},
    {label: T.view, submenu: [{role: "reload", label: T.reload}, {role: "toggleDevTools", label: T.dev}, {type: "separator"}, {role: "resetZoom", label: T.zoom0}, {role: "zoomIn", label: T.zoomIn}, {role: "zoomOut", label: T.zoomOut}, {type: "separator"}, {role: "togglefullscreen", label: T.full}]}
  ]));
}

app.whenReady().then(() => {
  lang = app.getLocale().toLowerCase().startsWith("pl") ? "pl" : "en";
  buildMenu();
  createWindow();
  app.on("activate", () => { if (BrowserWindow.getAllWindows().length === 0) createWindow(); });
});
app.on("window-all-closed", () => { if (process.platform !== "darwin") app.quit(); });
