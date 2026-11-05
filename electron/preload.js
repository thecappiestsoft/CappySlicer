const {contextBridge, ipcRenderer} = require("electron");
contextBridge.exposeInMainWorld("cappyNative", {
  platform: process.platform,
  saveFile: (name, text, lang) => ipcRenderer.invoke("save-file", name, text, lang),
  setLanguage: (lang) => ipcRenderer.send("set-lang", lang)
});
