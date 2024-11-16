// See the Electron documentation for details on how to use preload scripts:
// https://www.electronjs.org/docs/latest/tutorial/process-model#preload-scripts

import {contextBridge, ipcRenderer} from "electron";
import {Titlebar} from "custom-electron-titlebar";

let titlebar;

function initCustomTitlebar() {
    if(titlebar) titlebar.dispose();

    titlebar = new Titlebar({
        titleHorizontalAlignment: 'center',
        shadow: true,
    });

    titlebar.theme = null;
    titlebar.theming = null;
}

window.addEventListener('DOMContentLoaded', () => {
    initCustomTitlebar();
});

ipcRenderer.on("resetTheme", () => {
    initCustomTitlebar();
})

contextBridge.exposeInMainWorld('log', {
    info: (message) => ipcRenderer.invoke('log-info', message),
    error: (message) => ipcRenderer.invoke('log-error', message),
});

contextBridge.exposeInMainWorld('FileAPI', {
    getThemeContent: () => ipcRenderer.invoke('getThemeContent'),
});

contextBridge.exposeInMainWorld("ApplicationEvents", {
    onTabOpen: (callback) => ipcRenderer.on("openTab", callback),
    onNewTab: (callback) => ipcRenderer.on("newTab", callback),
    onTabFormat: (callback) => ipcRenderer.on("formatTab", callback),
    onRemoveTab: (callback) => ipcRenderer.on("removeTab", callback),
    onSaveTab: (callback) => ipcRenderer.on("saveTab", callback),
    onSetTabLanguage: (callback) => ipcRenderer.on("setTabLanguage", callback),
    onThemeReset: (callback) => ipcRenderer.on("resetTheme", callback),
    removeListeners: (channel, listener) => ipcRenderer.removeListener(channel, listener),
});

contextBridge.exposeInMainWorld("StringUtils", {
    format: (data) => ipcRenderer.invoke("formatText", data),
});

