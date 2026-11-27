import {contextBridge, ipcRenderer, webUtils} from "electron";
import {Titlebar} from "custom-electron-titlebar";
import {EventType} from "./enums";

const INVOKE_CHANNELS = [
    EventType.FILES_DROPPED,
    EventType.SHOW_SAVE_DIALOG,
    EventType.MESSAGE_DIALOG_RESPONSE,
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
    EventType.CONFIRM_CONVERSION,
    EventType.SHOW_STATUS_MENU,
    EventType.GET_ENCODING_INFO,
    EventType.SEARCH_ON_WEB,
    EventType.SHOW_FOLDER_DIALOG,
    EventType.FIND_IN_FILES,
    EventType.CANCEL_FIND_IN_FILES,
    EventType.DECODE_BASE64_TO_FILE,
    EventType.LOG_INFO,
    EventType.LOG_WARN,
    EventType.LOG_ERROR,
];

let titlebar;
let hasIcon = false;

function createTitlebar(icon) {
    if (titlebar) titlebar.dispose();

    titlebar = new Titlebar({
        titleHorizontalAlignment: "center",
        shadow: true,
        icon,
    });

    titlebar.theme = null;
    titlebar.theming = null;
    hasIcon = !!icon;
}

function buildMenu(data) {
    if (hasIcon) return titlebar.refreshMenu();

    createTitlebar(data?.icon);
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
    createTitlebar();
});

ipcRenderer.on(EventType.BUILD_MENU, (event, data) => buildMenu(data));