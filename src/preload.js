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

contextBridge.exposeInMainWorld("TabsAPI", {
    getTabs: () => ipcRenderer.invoke("getTabs"),
    addTab: ({isTemp, name, filePath}) => ipcRenderer.invoke("tabAdded", {isTemp, name, filePath}),
    selectTab: ({tab}) => ipcRenderer.invoke("tabSelected", {tab}),
    removeTab: ({tab}) => ipcRenderer.invoke("tabRemoved", {tab}),
    onTabSelected: (callback) => ipcRenderer.on("tabSelected", (_event, value) => callback(value)),
    onTabRemoved: (callback) => ipcRenderer.on("tabRemoved", (_event, value) => callback(value)),
    onTabAdded: (callback) => ipcRenderer.on("tabAdded", (_event, value) => callback(value)),
    onTabsChanged: (callback) => ipcRenderer.on("tabsChanged", (_event, value) => callback(value)),
});
