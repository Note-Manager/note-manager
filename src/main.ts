import {app, BrowserWindow, shell} from 'electron';

import initLoggingEventHandlers from "./ipc/LoggingEventHandlers";
import {EventType} from "./enums";
import {attachTitlebarToWindow, setupTitlebar} from "custom-electron-titlebar/main";
import {fileToTab, openInWindow, readEditorState} from "./utils/EditorUtils";
import initIpcMainListeners from "./ipc/IpcMainListener";
import {initApplicationMenu, loadThemeToWindow, refreshTitlebar} from "./utils/ElectronUtils";
import {EditorState} from "./domain/EditorState";
import {SupportedLanguages} from './domain/SupportedLanguage';
import {hash} from "./utils/TextUtils";
import {isFileExists} from "./utils/FileUtils";
import {getSettings} from "./utils/EnvironmentUtils";
import {loadUserPluginManifests, registerUserPluginProtocol, registerUserPluginScheme} from "./utils/UserPlugins";


setupTitlebar();
registerUserPluginScheme();

// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (require('electron-squirrel-startup')) {
    app.quit();
}

const logError = (error: Error | any) => {
    const logMessage = `[${new Date().toISOString()}] ${error.stack || error}\n`;
    console.error(logMessage);
};

// Catch uncaught exceptions
process.on('uncaughtException', (error) => {
    logError(error);
});

// Catch unhandled promise rejections
process.on('unhandledRejection', (reason: any) => {
    logError(reason);
});

let mainWindow: BrowserWindow;

const createWindow = () => {
    mainWindow = new BrowserWindow({
        width: 1440,
        height: 860,
        titleBarStyle: "hidden",
        titleBarOverlay: false,
        webPreferences: {
            // @ts-ignore
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

    // load index.html
    // @ts-ignore
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
    })
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
            hash: await hash(""),
            language: SupportedLanguages.text,
        }],
        activeTabId: tempTabId
    }

        const persistentState = await readEditorState();

    if (persistentState) { // restore the state
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
    app.quit(); // Quit if another instance is already running
} else {
    app.on('second-instance', (_, argv) => {
        // When a second instance is launched
        if (mainWindow) {
            // Focus the existing window
            if (mainWindow.isMinimized()) mainWindow.restore();
            mainWindow.focus();

            // Pass the file argument (e.g., argv[2] on Windows, argv[1] on macOS)
            const fileArg = getFileArgument(argv);
            if (fileArg) {
                openInWindow(mainWindow, fileArg);
            }
        }
    });

    // This method will be called when Electron has finished
    // initialization and is ready to create browser windows.
    // Some APIs can only be used after this event occurs.
    app.whenReady().then(() => {
        registerUserPluginProtocol();
        loadUserPluginManifests();

        const arg = getFileArgument(); // open with...

        if(arg && mainWindow) {
            const targetWindow = mainWindow;

            openInWindow(targetWindow, arg);

            targetWindow.moveTop();
            targetWindow.focus();
        } else {
            createWindow();
        }

        // On OS X it's common to re-create a window in the app when the
        // dock icon is clicked and there are no other windows open.
        app.on('activate', () => {
            if (BrowserWindow.getAllWindows().length === 0) {
                createWindow();
            }
        });
    });
}

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
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

    if (app.isPackaged && processArguments?.length > 1) { // 'open with ...' option
        processArguments?.forEach((arg, idx) => {
            if(idx === 0) return; // pass the first argument, it is the working directory

            if(arg && arg !== "." && arg !== "./") {
                if(isFileExists(arg)) result = arg;
            }
        });
    }

    return result;
}

initLoggingEventHandlers();
initIpcMainListeners();