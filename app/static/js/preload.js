const { ipcRenderer, remote } = require("electron");

window.ipcRenderer = ipcRenderer;
window.channels = remote.getGlobal("channels");
