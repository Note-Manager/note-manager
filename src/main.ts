import { app, BrowserWindow } from 'electron';

import initLoggingEventHandlers from "./ipc/LoggingEventHandlers";
import { EventType } from "./enums";
import { attachTitlebarToWindow, setupTitlebar } from "custom-electron-titlebar/main";
import * as Environment from "./utils/EnvironmentUtils";
import { fileToTab, readEditorState } from "./utils/EditorUtils";
import initIpcMainListeners from "./ipc/IpcMainListener";
import { initApplicationMenu, loadThemeToWindow, refreshTitlebar } from "./utils/ElectronUtils";
import { EditorState } from "./domain/EditorState";
import { SupportedLanguages } from './domain/SupportedLanguage';

setupTitlebar();

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

const createWindow = () => {
    const mainWindow = new BrowserWindow({
        width: 1440,
        height: 860,
        titleBarStyle: "hidden",
        titleBarOverlay: false,
        webPreferences: {
            // @ts-ignore
            preload: MAIN_WINDOW_PRELOAD_WEBPACK_ENTRY,
            nodeIntegration: true,
            contextIsolation: false,
            sandbox: false,
            plugins: true
        }
    });

    initApplicationMenu();

    // load index.html
    // @ts-ignore
    mainWindow.loadURL(MAIN_WINDOW_WEBPACK_ENTRY);

    attachTitlebarToWindow(mainWindow);

    mainWindow.webContents.on("dom-ready", async () => {
        loadThemeToWindow(mainWindow);
        refreshTitlebar();

        const fileArg = getFileArgument();
        const activeTabId = crypto.randomUUID();
        let initialState: EditorState = {
            tabs: [{
                id: activeTabId,
                name: "New Document.txt",
                displayName: "New Document.txt",
                content: "",
                language: SupportedLanguages.text,
            }], 
            activeTabId: activeTabId
        }

        const persistentState = readEditorState();

        if (persistentState) { // restore the state
            initialState = persistentState;
        }

        if (fileArg && !initialState.tabs.map(t => t.file).includes(fileArg)) {
            const tab = await fileToTab(fileArg);

            initialState.tabs.push(tab);
            initialState.activeTabId = tab.id;
        }

        mainWindow.webContents.send(EventType.INIT_WITH_STATE, initialState);
    });

    mainWindow.on(EventType.CLOSE_WINDOW, (event) => {
        event.preventDefault();

        mainWindow.webContents.send(EventType.CLOSE_WINDOW);
    })
};

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(() => {
    Environment.loadPreferences(); // load user preferences

    createWindow();

    // On OS X it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) {
            createWindow();
        }
    });
});

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

function getFileArgument() {
    if (app.isPackaged && process.argv.length > 1) { // 'open with ...' option
        const file = process.argv[1];

        if (file && file !== "." && file !== "./") return file;
    }
}

initLoggingEventHandlers();
initIpcMainListeners();