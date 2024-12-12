import electron, {app, BrowserWindow} from "electron";
import {getFocusedWindow, openInFocusedWindow, sendToFocusedWindow} from "./EditorUtils";
import {EventType, SystemPaths} from "../enums";
import {SupportedLanguages} from "../domain/SupportedLanguage";
import * as Environment from "./EnvironmentUtils";
import {getBundledThemes, getUserThemePath, getUserThemes} from "./EnvironmentUtils";
import {allPlugins} from "./PluginLoader";
import path from "node:path";
import {getSystemPath} from "./FileUtils";
import {Theme} from "../domain/Theme";


export const appIcon = electron.nativeImage.createFromPath(path.join(getSystemPath(SystemPaths.resources), "Icons/note-manager.png"));

export function createApplicationMenu() {
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
                            openInFocusedWindow(file[0]);

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
            Environment.getPreferences().theme = new Theme(cssFile);

            Environment.savePreferences();

            refreshTitlebar();
        },
        type: "radio",
        sublabel: isUserTheme ? "User Theme" : "Bundled Theme",
        checked: Environment.getPreferences().theme.file === cssFile
    } as Electron.MenuItemConstructorOptions
}

export function refreshTitlebar() {
    BrowserWindow.getAllWindows().forEach(win => {
        loadThemeToWindow(win);
        win.webContents.send(EventType.BUILD_MENU, {
            icon: appIcon
        });
    });
}

export function loadThemeToWindow(win: Electron.BrowserWindow) {
    win.webContents.insertCSS(Environment.getPreferences().theme.getCSSContent());
}

export function initApplicationMenu() {
    electron.Menu.setApplicationMenu(createApplicationMenu());
}