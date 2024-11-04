// See the Electron documentation for details on how to use preload scripts:
// https://www.electronjs.org/docs/latest/tutorial/process-model#preload-scripts

import {contextBridge, ipcRenderer} from "electron";

contextBridge.exposeInMainWorld('log', {
    info: (message) => ipcRenderer.invoke('log-info', message),
    error: (message) => ipcRenderer.invoke('log-error', message),
});

contextBridge.exposeInMainWorld('files', {
    readFile: (path) => ipcRenderer.invoke('read-file', path),
    tempPath: () => ipcRenderer.invoke("get-system-path", {name: "tempDir"})
});

contextBridge.exposeInMainWorld("TabsAPI", {
    getTabs: () => ipcRenderer.invoke("get-tabs"),
    getSelectedTab: () => ipcRenderer.invoke("get-selected-tab"),
    addTab: ({isTemp, name, filePath}) => ipcRenderer.invoke("add-tab", {isTemp, name, filePath}),
    selectTab: ({tab}) => ipcRenderer.invoke("select-tab", {tab}),
    removeTab: ({tab}) => ipcRenderer.invoke("remove-tab", {tab})
});
