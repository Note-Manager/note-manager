import * as electron from 'electron';
import {app, BrowserWindow, ipcMain} from 'electron';

import initLoggingEventHandlers from "./ipc/LoggingEventHandlers";
import {EventType, SystemPaths} from "./enums";
import * as path from "node:path";
import {getSystemPath, isFileExists, readFile, readSync, writeFile} from "./utils/FileUtils";
import {attachTitlebarToWindow, setupTitlebar} from "custom-electron-titlebar/main";
import * as Theme from "./domain/Theme";
import * as Environment from "./utils/EnvironmentUtils";
import {getBundledThemes, getUserThemePath, getUserThemes} from "./utils/EnvironmentUtils";
import {SupportedLanguages} from "./domain/SupportedLanguage";
import {allPlugins} from "./utils/PluginLoader";
import {EditorState} from "./domain/EditorState";
import {hash} from "./utils/TextUtils";

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

ipcMain.handle(EventType.CLOSE_WITH_STATE, (event, data: EditorState) => {
   const sender = BrowserWindow.fromWebContents(event.sender);

   if(sender) {
       const stateFile = Environment.getStateFilePath();

       console.log("saving state to '"+stateFile+"'");

       data.tabs.forEach(t => {
           if(!t.isTemp && t.file) {
               t.content = undefined;
               t.isChanged = false;
           }
       })

       writeFile(stateFile, JSON.stringify(data, null, 4));

       sender.removeAllListeners(EventType.CLOSE_WINDOW);
       sender.close();
   }
});

const appIcon = electron.nativeImage.createFromPath(path.join(getSystemPath(SystemPaths.resources), "Icons/note-manager.png"));

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

    const stateFile = Environment.getStateFilePath();

    mainWindow.webContents.on("dom-ready", () => {
        loadTheme(mainWindow);
        refreshTitlebar();

        if (app.isPackaged && process.argv.length > 1) { // 'open with ...' option
            const file = process.argv[1];

            if(file && file !== "." && file !== "./") handleOpenTab(mainWindow, file);
        } else if(isFileExists(stateFile)) { // restore the state
            const initialState: EditorState = JSON.parse(readSync(stateFile));
            initialState.tabs.forEach(async (t) => {
               if(!t.isTemp && t.file) {
                   try {
                       t.content = readFile(t.file);

                       const fileHash = await hash(t.content);

                       if(t.hash !== fileHash) { // if the file is changed while app is closed, update the tab's hash and unset the state to prevent unwanted undo/redo behaviors
                           t.hash = fileHash;
                           t.isChanged = false;
                           t.state = undefined;
                       }
                   } catch(ignored) { // if cannot read the file that was opened in the previous session
                       console.warn(`expected file '${t.file}' is not found on the system.`);
                       t.isTemp = true;
                       t.content = "";
                   }
               }
            });

            mainWindow.webContents.send(EventType.INIT_WITH_STATE, initialState);
        }
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

function initApplicationMenu() {
    electron.Menu.setApplicationMenu(generateMenu());
}

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

const getFocusedWindow = () => BrowserWindow.getFocusedWindow();

const sendToFocusedWindow = (channel: string, data?: any) => {
    getFocusedWindow()?.webContents.send(channel, data);
};

function generateMenu() {
    const menu = electron.Menu.buildFromTemplate([
        {
            label: 'File',
            submenu: [
                {
                    label: 'New',
                    accelerator: 'CmdOrCtrl+N',
                    click: () => {
                        sendToFocusedWindow(EventType.NEW_TAB);
                    }
                },
                {
                    label: 'Open',
                    accelerator: 'CmdOrCtrl+T',
                    click: () => {
                        const focusedWindow = getFocusedWindow();

                        if (!focusedWindow) return;

                        const file = electron.dialog.showOpenDialogSync(focusedWindow, {
                            title: "Select file to open",
                            message: "Select file to open",
                            buttonLabel: "Open",
                            filters: [{extensions: ["*"], name: "All Files"}],
                            properties: ['openFile'],
                        });

                        if (file?.length === 1) {
                            handleOpenTab(focusedWindow, file[0]);

                            focusedWindow.moveTop();
                        }
                    }
                },
                {
                    label: 'Save',
                    accelerator: 'CmdOrCtrl+S',
                    click: () => {
                        sendToFocusedWindow(EventType.SAVE_TAB);
                    }
                },
                {
                    label: 'Close',
                    accelerator: 'CmdOrCtrl+W',
                    click: () => {
                        sendToFocusedWindow(EventType.CLOSE_TAB);
                    }
                }
            ],
        },
        {
            label: 'Edit',
            submenu: [
                {
                    label: 'Undo',
                    accelerator: 'CmdOrCtrl+Z',
                    role: "undo",
                    click: () => {
                        sendToFocusedWindow(EventType.UNDO_TAB);
                    }
                },
                {
                    label: 'Redo',
                    accelerator: 'CmdOrCtrl+Y',
                    role: "redo",
                    click: () => {
                        sendToFocusedWindow(EventType.REDO_TAB);
                    }
                }
            ],
        },
        {
            label: 'Language',
            submenu: Object.entries(SupportedLanguages).map(([, value]) => {
                return {
                    label: value.label,
                    click: () => {
                        sendToFocusedWindow(EventType.SET_TAB_LANGUAGE, value);
                    }
                };
            })
        },
        {
            label: 'Preferences',
            submenu: [
                {
                    label: 'Theme',
                    submenu: [
                        ...getBundledThemes().map(css => cssFileToMenuItem(css, false)), // bundled themes
                        ...getUserThemes().map(css => cssFileToMenuItem(css, true)), // user themes
                        {
                            type: "separator"
                        },
                        {
                            label: "Reload Themes",
                            click: () => {
                                initApplicationMenu();
                                refreshTitlebar();
                            }
                        },
                        {
                            label: "Open Themes Folder",
                            click: () => {
                                electron.shell.openPath(getUserThemePath()).then(() => console.log("path opened"))
                            }
                        }
                    ]
                }
            ]
        },
        {
            label: "Plugins",
            submenu: allPlugins.filter(p => (p.applicationMenuItems?.length || 0) > 0).flatMap(plugin => plugin.applicationMenuItems).filter(el => el !== undefined).map(menuItem => {
                return {
                    label: menuItem.label,
                    submenu: menuItem.actions.map(action => {
                        return {
                            label: action.label,
                            click: () => {
                                sendToFocusedWindow(action.code)
                            },
                            accelerator: action.accelerator
                        }
                    })
                }
            })
        }
    ]);

    if (!app.isPackaged) {
        const menuItem = new electron.MenuItem({
            label: 'Developer',
            submenu: [
                {
                    label: 'Reload',
                    accelerator: 'CmdOrCtrl+R',
                    click: () => {
                        getFocusedWindow()?.webContents.reload();
                    }
                },
                {
                    label: 'Developer Tools',
                    accelerator: 'F12',
                    click: () => {
                        getFocusedWindow()?.webContents.toggleDevTools();
                    }
                }
            ]
        });

        menu.append(menuItem);
    }

    return menu;
}

function cssFileToMenuItem(cssFile: string, isUserTheme: boolean) {
    return {
        label: path.parse(cssFile).name,
        click: () => {
            Environment.getPreferences().theme = new Theme.Theme(cssFile);

            Environment.savePreferences();

            refreshTitlebar();
        },
        type: "radio",
        sublabel: isUserTheme ? "User Theme" : "Bundled Theme",
        checked: Environment.getPreferences().theme.file === cssFile
    } as Electron.MenuItemConstructorOptions
}

function loadTheme(win: Electron.BrowserWindow) {
    win.webContents.insertCSS(Environment.getPreferences().theme.getCSSContent());
}

function refreshTitlebar() {
    BrowserWindow.getAllWindows().forEach(win => {
        loadTheme(win);
        win.webContents.send(EventType.BUILD_MENU, {
            icon: appIcon
        });
    });
}


initLoggingEventHandlers();

ipcMain.handle(EventType.FILES_DROPPED, (event, data: any) => {
    if(!data?.files || !Array.isArray(data.files)) return;

    try {
        for (let file of data.files) {
            try {
                const win = BrowserWindow.fromWebContents(event.sender);
                if(win) handleOpenTab(win, file);
            } catch(err) {
                console.error(err);
            }
        }
    } catch (ignored) {
    }
});

ipcMain.handle(EventType.SHOW_SAVE_DIALOG, (event, opts) => {
    const focusedWindow = getFocusedWindow();
    if (!focusedWindow) return;

    return electron.dialog.showSaveDialogSync(focusedWindow, {
        title: opts?.title || "Save",
        defaultPath: opts?.defaultName
    });
});

ipcMain.handle(EventType.SHOW_CONFIRMATION, async (event, opts) => {
    const focusedWindow = getFocusedWindow();
    if (!focusedWindow) return;

    const result = electron.dialog.showMessageBoxSync(focusedWindow, {
        type: 'question',
        buttons: ['Cancel', 'Yes'],
        defaultId: 1, // Default selected button index
        cancelId: 0, // Button index for cancel action
        title: opts.title || 'Confirmation',
        message: opts.message,
    });

    return result === 1; // Return true if "Yes" was clicked
});

function handleOpenTab(window: electron.BrowserWindow, file: string) {
    console.log("opening file: " + file);
    window.webContents.send(EventType.OPEN_TAB, {
        name: path.basename(file),
        file: file,
        content: readFile(file)
    });
}