import * as electron from 'electron';
import {app, BrowserWindow, ipcMain} from 'electron';

import initLoggingEventHandlers from "./ipc/LoggingEventHandlers";
import {SupportedLanguages, SystemPaths} from "./contants/Enums";
import * as path from "node:path";
import {getSystemPath, readFile} from "./utils/FileUtils";
import {attachTitlebarToWindow, setupTitlebar} from "custom-electron-titlebar/main";
import * as Theme from "./domain/Theme";
import * as Environment from "./utils/EnvironmentUtils";
import {getBundledThemes, getUserThemePath, getUserThemes} from "./utils/EnvironmentUtils";

setupTitlebar();

// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (require('electron-squirrel-startup')) {
    app.quit();
}

const appIcon = electron.nativeImage.createFromPath(path.join(getSystemPath(SystemPaths.resources), "Icons/note-manager.png"));

const createWindow = () => {
    const mainWindow = new BrowserWindow({
        width: 1440,
        height: 860,
        titleBarStyle: "hidden",
        titleBarOverlay: false,
        webPreferences: {
            preload: MAIN_WINDOW_PRELOAD_WEBPACK_ENTRY,
            nodeIntegration: true,
            contextIsolation: false,
            sandbox: false,
            plugins: true
        }
    });

    initApplicationMenu();

    // load index.html
    mainWindow.loadURL(MAIN_WINDOW_WEBPACK_ENTRY);

    attachTitlebarToWindow(mainWindow);

    mainWindow.webContents.on("dom-ready", () => {
        loadTheme(mainWindow);
        refreshTitlebar();
    });
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

function generateMenu() {
    const menu = electron.Menu.buildFromTemplate([
        {
            label: 'File',
            submenu: [
                {
                    label: 'New',
                    accelerator: 'CmdOrCtrl+N',
                    click: () => {
                        BrowserWindow.getFocusedWindow().webContents.send('newTab');
                    }
                },
                {
                    label: 'Open',
                    accelerator: 'CmdOrCtrl+T',
                    click: () => {
                        const focusedWindow = BrowserWindow.getFocusedWindow();

                        const file = electron.dialog.showOpenDialogSync(BrowserWindow.getFocusedWindow(), {
                            title: "Select file to open",
                            message: "Select file to open",
                            buttonLabel: "Open",
                            filters: [{extensions: ["*"], name: "All Files"}],
                            properties: ['openFile'],
                        });

                        if (file?.length === 1) {
                            focusedWindow.webContents.send('openTab', {
                                name: path.basename(file[0]),
                                file: file[0],
                                content: readFile(file[0])
                            });

                            focusedWindow.moveTop();
                        }
                    }
                },
                {
                    label: 'Save',
                    accelerator: 'CmdOrCtrl+S',
                    click: () => {
                        BrowserWindow.getFocusedWindow().webContents.send('saveTab');
                    }
                },
                {
                    label: 'Close',
                    accelerator: 'CmdOrCtrl+W',
                    click: () => {
                        BrowserWindow.getFocusedWindow().webContents.send('removeTab');
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
                        BrowserWindow.getFocusedWindow().webContents.send('undoTab');
                    }
                },
                {
                    label: 'Redo',
                    accelerator: 'CmdOrCtrl+Y',
                    role: "redo",
                    click: () => {
                        BrowserWindow.getFocusedWindow().webContents.send('redoTab');
                    }
                },
                {
                    label: 'Format',
                    accelerator: 'CmdOrCtrl+Shift+F',
                    click: () => {
                        BrowserWindow.getFocusedWindow().webContents.send('formatTab');
                    }
                }
            ],
        },
        {
            label: 'Language',
            submenu: Object.keys(SupportedLanguages).filter(k => typeof SupportedLanguages[k] === "object").map(key => {
                return {
                    label: SupportedLanguages[key].label,
                    click: () => {
                        BrowserWindow.getFocusedWindow().webContents.send('setTabLanguage', SupportedLanguages[key]);
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
                        }, {
                            label: "Open Themes Folder",
                            click: () => {
                                electron.shell.openPath(getUserThemePath()).then(() => console.log("path opened"))
                            }
                        }
                    ]
                }
            ]
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
                        BrowserWindow.getFocusedWindow().webContents.reload();
                    }
                },
                {
                    label: 'Developer Tools',
                    accelerator: 'F12',
                    click: () => {
                        BrowserWindow.getFocusedWindow().webContents.openDevTools();
                    }
                }
            ]
        });

        menu.append(menuItem);
    }

    return menu;
}

function cssFileToMenuItem(cssFile, isUserTheme) {
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
    }
}

function loadTheme(win) {
    if (global.cssKey) {
        win.webContents.removeInsertedCSS(global.cssKey)
            .catch(err => console.error(err));
    }

    win.webContents.insertCSS(Environment.getPreferences().theme.getCSSContent())
        .then(key => global.cssKey = key);
}

function refreshTitlebar() {
    BrowserWindow.getAllWindows().forEach(win => {
        loadTheme(win);
        win.webContents.send("buildMenu", {
            icon: appIcon
        });
    });
}


initLoggingEventHandlers();

ipcMain.handle("showSaveDialog", (event, opts) => {
    return electron.dialog.showSaveDialogSync(BrowserWindow.getFocusedWindow(), {
        title: opts?.title || "Save",
        defaultPath: opts?.defaultName
    });
});

ipcMain.handle("showConfirmation", async(event, opts) => {
    const result = await electron.dialog.showMessageBox(BrowserWindow.getFocusedWindow(), {
        type: 'question',
        buttons: ['Cancel', 'Yes'],
        defaultId: 1, // Default selected button index
        cancelId: 0, // Button index for cancel action
        title: opts.title || 'Confirmation',
        message: opts.message,
    });

    return result.response === 1; // Return true if "Yes" was clicked
});