import {app, BrowserWindow, shell} from "electron";

import initLoggingEventHandlers from "./ipc/LoggingEventHandlers";
import {EventType} from "./enums";
import {attachTitlebarToWindow, setupTitlebar} from "custom-electron-titlebar/main";
import {fileToTab, openInWindow, readEditorState} from "./utils/EditorUtils";
import initIpcMainListeners from "./ipc/IpcMainListener";
import {getThemeBackgroundColor, initApplicationMenu, loadThemeToWindow, refreshTitlebar} from "./utils/ElectronUtils";
import {EditorState} from "./domain/EditorState";
import {SupportedLanguages} from "./domain/SupportedLanguage";
import {documentHash} from "./utils/TextUtils";
import {isFileExists} from "./utils/FileUtils";
import {getSettings} from "./utils/EnvironmentUtils";
import {loadUserPluginManifests, registerUserPluginProtocol, registerUserPluginScheme} from "./utils/UserPlugins";

declare const MAIN_WINDOW_WEBPACK_ENTRY: string;
declare const MAIN_WINDOW_PRELOAD_WEBPACK_ENTRY: string;

setupTitlebar();
registerUserPluginScheme();

if (require("electron-squirrel-startup")) {
    app.quit();
}

const logError = (error: Error | any) => {
    const logMessage = `[${new Date().toISOString()}] ${error.stack || error}\n`;
    console.error(logMessage);
};

process.on("uncaughtException", (error) => {
    logError(error);
});

process.on("unhandledRejection", (reason: any) => {
    logError(reason);
});

let mainWindow: BrowserWindow;

const createWindow = () => {
    mainWindow = new BrowserWindow({
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

    mainWindow.webContents.setWindowOpenHandler(({url}) => {
        openExternalUrl(url);

        return {action: "deny"};
    });

    mainWindow.webContents.on("will-navigate", (event, url) => {
        if (url === mainWindow.webContents.getURL()) return;

        event.preventDefault();
        openExternalUrl(url);
    });

    if (getSettings().ui.startMaximized) mainWindow.maximize();

    initApplicationMenu();

    mainWindow.loadURL(MAIN_WINDOW_WEBPACK_ENTRY);

    attachTitlebarToWindow(mainWindow);

    mainWindow.webContents.on("dom-ready", async () => {
        loadThemeToWindow(mainWindow);
        refreshTitlebar();

        const state = await getEditorState();

        mainWindow.webContents.send(EventType.INIT_WITH_STATE, state);
    });

    mainWindow.on(EventType.CLOSE_WINDOW, (event) => {
        event.preventDefault();

        mainWindow.webContents.send(EventType.CLOSE_WINDOW);
    });
};

async function getEditorState() {
    const fileArg = getFileArgument();

    const tempTabId = crypto.randomUUID();
    let initialState: EditorState = {
        tabs: [{
            id: tempTabId,
            name: "New Document.txt",
            displayName: "New Document.txt",
            content: "",
            hash: await documentHash("", getSettings().files.defaultEncoding, getSettings().files.defaultEol),
            encoding: getSettings().files.defaultEncoding,
            eol: getSettings().files.defaultEol,
            language: SupportedLanguages.text,
        }],
        activeTabId: tempTabId
    };

    const persistentState = await readEditorState();

    if (persistentState) {
        initialState = persistentState;
    }

    if (fileArg && !initialState.tabs.map(t => t.file).includes(fileArg)) {
        const tab = await fileToTab(fileArg);

        initialState.tabs.push(tab);
        initialState.activeTabId = tab.id;
    } else if (fileArg && initialState.tabs.map(t => t.file).includes(fileArg)) {
        initialState.activeTabId = initialState.tabs.find(t => t.file === fileArg)?.id;
    }

    return initialState;
}

if (!app.requestSingleInstanceLock()) {
    app.quit();
} else {
    app.on("second-instance", (_, argv) => {
        if (mainWindow) {
            if (mainWindow.isMinimized()) mainWindow.restore();
            mainWindow.focus();

            const fileArg = getFileArgument(argv);
            if (fileArg) {
                openInWindow(mainWindow, fileArg);
            }
        }
    });

    app.whenReady().then(() => {
        registerUserPluginProtocol();
        loadUserPluginManifests();

        const arg = getFileArgument();

        if (arg && mainWindow) {
            const targetWindow = mainWindow;

            openInWindow(targetWindow, arg);

            targetWindow.moveTop();
            targetWindow.focus();
        } else {
            createWindow();
        }

        app.on("activate", () => {
            if (BrowserWindow.getAllWindows().length === 0) {
                createWindow();
            }
        });
    });
}

app.on("window-all-closed", () => {
    if (process.platform !== "darwin") {
        app.quit();
    }
});

function openExternalUrl(url: string) {
    try {
        const protocol = new URL(url).protocol;

        if (protocol === "http:" || protocol === "https:") shell.openExternal(url);
    } catch (ignored) {
    }
}

function getFileArgument(args?: string[]) {
    let result;

    const processArguments = args || process.argv;

    if (app.isPackaged && processArguments?.length > 1) {
        processArguments?.forEach((arg, idx) => {
            if (idx === 0) return;

            if (arg && arg !== "." && arg !== "./") {
                if (isFileExists(arg)) result = arg;
            }
        });
    }

    return result;
}

initLoggingEventHandlers();
initIpcMainListeners();