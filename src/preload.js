import {contextBridge, ipcRenderer, webUtils} from "electron";
import {Titlebar} from "custom-electron-titlebar";
import {EventType} from "./enums";

const INVOKE_CHANNELS = [
    EventType.FILES_DROPPED,
    EventType.SHOW_SAVE_DIALOG,
    EventType.SHOW_UNSAVED_CHANGES_DIALOG,
    EventType.SAVE_STATE,
    EventType.CLOSE_WITH_STATE,
    EventType.WRITE_FILE,
    EventType.SHOW_TAB_CONTEXT_MENU,
    EventType.SHOW_EDITOR_CONTEXT_MENU,
    EventType.REVEAL_FILE,
    EventType.GET_SETTINGS,
    EventType.SAVE_SETTINGS,
    EventType.GET_THEME_VARIABLES,
    EventType.CREATE_THEME,
    EventType.RECORD_SHORTCUT,
    EventType.GET_USER_PLUGINS,
    EventType.READ_FILE_AS,
    EventType.CONFIRM_REINTERPRET,
    EventType.CONFIRM_CONVERSION,
    EventType.SHOW_STATUS_MENU,
    EventType.GET_ENCODING_INFO,
    EventType.LOG_INFO,
    EventType.LOG_WARN,
    EventType.LOG_ERROR,
];

let titlebar;

function initCustomTitlebar(data) {
    if (titlebar) titlebar.dispose();

    titlebar = new Titlebar({
        titleHorizontalAlignment: "center",
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
        const listener = (event, ...args) => callback(...args);

        ipcRenderer.on(channel, listener);

        return () => ipcRenderer.off(channel, listener);
    },
    getPathForFile: (file) => webUtils.getPathForFile(file),
});

window.addEventListener("DOMContentLoaded", () => {
    initCustomTitlebar();
});

ipcRenderer.on(EventType.BUILD_MENU, (event, data) => initCustomTitlebar(data));