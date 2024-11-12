// See the Electron documentation for details on how to use preload scripts:
// https://www.electronjs.org/docs/latest/tutorial/process-model#preload-scripts

import {contextBridge, ipcRenderer} from "electron";

contextBridge.exposeInMainWorld('log', {
    info: (message) => ipcRenderer.invoke('log-info', message),
    error: (message) => ipcRenderer.invoke('log-error', message),
});

contextBridge.exposeInMainWorld('FileAPI', {
    readFile: (path) => ipcRenderer.invoke('read-file', path),
    tempPath: () => ipcRenderer.invoke("get-system-path", {name: "tempDir"})
});

contextBridge.exposeInMainWorld("ApplicationEvents", {
    onTabOpen: (callback) => ipcRenderer.on("openTab", callback),
    onTabFormat: (callback) => ipcRenderer.on("formatTab", callback),
    removeListeners: (channel, listener) => ipcRenderer.removeListener(channel, listener),
});

contextBridge.exposeInMainWorld("StringUtils", {
    format: (data) => ipcRenderer.invoke("formatText", data),
});

