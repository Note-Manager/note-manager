import {contextBridge, ipcRenderer, webUtils} from "electron";
import {Titlebar} from "custom-electron-titlebar";
import {EventType} from "./enums";

const INVOKE_CHANNELS = [
    EventType.FILES_DROPPED,
    EventType.SHOW_SAVE_DIALOG,
    EventType.SHOW_CONFIRMATION,
    EventType.SAVE_STATE,
    EventType.CLOSE_WITH_STATE,
    EventType.WRITE_FILE,
    EventType.SHOW_TAB_CONTEXT_MENU,
    EventType.LOG_INFO,
    EventType.LOG_WARN,
    EventType.LOG_ERROR,
];

let titlebar;

function initCustomTitlebar(event, data) {
    console.log("initializing titlebar..");
    if(titlebar) titlebar.dispose();

    titlebar = new Titlebar({
        titleHorizontalAlignment: 'center',
        shadow: true,
        icon: data?.icon,
    });

    titlebar.theme = null;
    titlebar.theming = null;
}

contextBridge.exposeInMainWorld("noteManager", {
    invoke: (channel, data) => {
        if (!INVOKE_CHANNELS.includes(channel)) {
            return Promise.reject(new Error(`channel is not allowed: ${channel}`));
        }

        return ipcRenderer.invoke(channel, data);
    },
    on: (channel, callback) => {
        const listener = (event, ...args) => callback(undefined, ...args);

        ipcRenderer.on(channel, listener);

        return () => ipcRenderer.off(channel, listener);
    },
    getPathForFile: (file) => webUtils.getPathForFile(file),
});

window.addEventListener('DOMContentLoaded', () => {
    initCustomTitlebar();
});

ipcRenderer.on("buildMenu", initCustomTitlebar);