import {app, BrowserWindow, shell} from "electron";
import {attachTitlebarToWindow, setupTitlebar} from "custom-electron-titlebar/main";
import {EventType} from "./enums";
import {EditorState} from "./domain/EditorState";
import initIpcMainListeners from "./ipc/IpcMainListener";
import {fileToTab, openInWindow, readEditorState} from "./utils/EditorUtils";
import {initApplicationMenu, refreshTitlebar} from "./utils/ApplicationMenu";
import {getThemeBackgroundColor, loadThemeToWindow} from "./utils/ThemeLoader";
import {getSettings, loadPreferences} from "./utils/EnvironmentUtils";
import {isFileExists} from "./utils/FileUtils";
import {createEmptyTab, DEFAULT_TAB_NAME, hashTab} from "./utils/TabUtils";
import {loadUserPluginManifests, registerUserPluginProtocol, registerUserPluginScheme} from "./utils/UserPlugins";

declare const MAIN_WINDOW_WEBPACK_ENTRY: string;
declare const MAIN_WINDOW_PRELOAD_WEBPACK_ENTRY: string;

if (require("electron-squirrel-startup")) app.quit();

process.on("uncaughtException", logError);
process.on("unhandledRejection", logError);

loadPreferences();
setupTitlebar();
registerUserPluginScheme();
initIpcMainListeners();

let mainWindow: BrowserWindow | undefined;

if (!app.requestSingleInstanceLock()) {
    app.quit();
} else {
    app.on("second-instance", (event, argv) => {
        if (!mainWindow) return;

        if (mainWindow.isMinimized()) mainWindow.restore();
        mainWindow.focus();

        const file = getFileArgument(argv);

        if (file) openInWindow(mainWindow, file);
    });

    app.whenReady().then(() => {
        registerUserPluginProtocol();
        loadUserPluginManifests();
        createWindow();

        app.on("activate", () => {
            if (BrowserWindow.getAllWindows().length === 0) createWindow();
        });
    });
}

app.on("window-all-closed", () => {
    if (process.platform !== "darwin") app.quit();
});

function createWindow() {
    const win = new BrowserWindow({
        width: 1440,
        height: 860,
        titleBarStyle: "hidden",
        titleBarOverlay: false,
        backgroundColor: getThemeBackgroundColor(),
        webPreferences: {
            preload: MAIN_WINDOW_PRELOAD_WEBPACK_ENTRY,
            nodeIntegration: false,
            contextIsolation: true,
            sandbox: false,
        }
    });

    mainWindow = win;

    win.webContents.setWindowOpenHandler(({url}) => {
        openExternalUrl(url);

        return {action: "deny"};
    });

    win.webContents.on("will-navigate", (event, url) => {
        if (url === win.webContents.getURL()) return;

        event.preventDefault();
        openExternalUrl(url);
    });

    if (getSettings().ui.startMaximized) win.maximize();

    initApplicationMenu();

    win.loadURL(MAIN_WINDOW_WEBPACK_ENTRY);

    attachTitlebarToWindow(win);

    win.webContents.on("dom-ready", async () => {
        loadThemeToWindow(win);
        refreshTitlebar();

        win.webContents.send(EventType.INIT_WITH_STATE, await getInitialState());
    });

    win.on(EventType.CLOSE_WINDOW, (event) => {
        event.preventDefault();

        win.webContents.send(EventType.CLOSE_WINDOW);
    });
}

async function getInitialState(): Promise<EditorState> {
    const state = await readEditorState() ?? await createEmptyState();
    const file = getFileArgument();

    if (!file) return state;

    const openTab = state.tabs.find(t => t.file === file);

    if (openTab) {
        state.activeTabId = openTab.id;
        return state;
    }

    const tab = await fileToTab(file);

    state.tabs.push(tab);
    state.activeTabId = tab.id;

    return state;
}

async function createEmptyState(): Promise<EditorState> {
    const {defaultEncoding, defaultEol} = getSettings().files;
    const tab = createEmptyTab(DEFAULT_TAB_NAME, defaultEncoding, defaultEol);

    tab.hash = await hashTab(tab);

    return {tabs: [tab], activeTabId: tab.id};
}

function getFileArgument(args: Array<string> = process.argv) {
    if (!app.isPackaged) return undefined;

    return args.slice(1).filter(arg => arg && arg !== "." && arg !== "./" && isFileExists(arg)).pop();
}

function openExternalUrl(url: string) {
    try {
        const protocol = new URL(url).protocol;

        if (protocol === "http:" || protocol === "https:") shell.openExternal(url);
    } catch {
        console.warn("ignored invalid url: " + url);
    }
}

function logError(error: unknown) {
    console.error(`[${new Date().toISOString()}] ${error instanceof Error ? error.stack : error}`);
}
