import * as electron from 'electron';
import {app, BrowserWindow} from 'electron';

import initFileEventHandlers from "./ipc/FileEventHandlers";
import initLoggingEventHandlers from "./ipc/LoggingEventHandlers";
import {SupportedLanguages, SystemPaths} from "./contants/Enums";
import * as path from "node:path";
import {ensureExists, getSystemPath, readDirectory, readFile, writeFile} from "./utils/FileUtils";
import initTabEventHandlers from "./ipc/TabEventHandlers";
import {attachTitlebarToWindow, setupTitlebar} from "custom-electron-titlebar/main";

defineGlobals();

setupTitlebar();

// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (require('electron-squirrel-startup')) {
    app.quit();
}

const createWindow = () => {
    const mainWindow = new BrowserWindow({
        width: 1440,
        height: 860,
        titleBarStyle: "hidden",
        titleBarOverlay: false,
        webPreferences: {
            preload: MAIN_WINDOW_PRELOAD_WEBPACK_ENTRY,
        },
    });

    initApplicationMenu();

    // load index.html.
    mainWindow.loadURL(MAIN_WINDOW_WEBPACK_ENTRY);

    attachTitlebarToWindow(mainWindow);
};

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(() => {
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
                    label: 'Remove',
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
                        ...(buildMenuItemsForThemes()),
                        {
                            type: "separator"
                        },
                        {
                            label: "Reload Themes",
                            click: () => {
                                initApplicationMenu();
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

function buildMenuItemsForThemes() {
    const notifyWindows = (event) => {
        BrowserWindow.getAllWindows().forEach(window => {
            window.webContents.send(event);
        });
    };

    return readDirectory("themes", {extensions: [".css"]}).map(cssFile => {
        return {
            label: cssFile,
            click: () => {
                preferences.theme.name = cssFile;

                updatePreferences();

                initApplicationMenu(); // this is required to update themes menu

                notifyWindows('resetTheme');
            },
            type: "radio",
            checked: preferences.theme.name === cssFile
        }
    });
}

function defineGlobals() {
    const dataPath = getSystemPath(SystemPaths.data);
    const preferencesFileName = "preferences.json";

    ensureExists(dataPath, preferencesFileName);

    global.appRoot = process.cwd();
    global.themesFolder = path.join(appRoot, "themes");
    global.iconsFolder = path.join(appRoot, "icons");
    global.preferencesFile = path.join(dataPath, preferencesFileName);

    global.reloadPreferences = () => {
        console.log("loading preferences..");

        const defaultPreferences = {
            theme: {
                name: "Dark.css"
            }
        }

        try {
            const preferencesContent = readFile(preferencesFile).trim();

            if(!preferencesContent || preferencesContent === "") {
                writeFile(preferencesFile, JSON.stringify(defaultPreferences, null, 2));
                global.preferences = defaultPreferences;
            } else {
                global.preferences = JSON.parse(preferencesContent);
            }
        } catch(error) {
            console.error(error);

            global.preferences = defaultPreferences;
        }
    };

    global.updatePreferences = () => {
        console.log("updating preferences..");
        writeFile(preferencesFile, JSON.stringify(preferences, null, 2));
    };

    reloadPreferences();
}


initLoggingEventHandlers();
initFileEventHandlers();
initTabEventHandlers();