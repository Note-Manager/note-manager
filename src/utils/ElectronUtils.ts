import electron, {app, BrowserWindow} from "electron";
import {getFocusedWindow, openInWindow, sendToFocusedWindow} from "./EditorUtils";
import {EventType, SystemPaths, TabAction} from "../enums";
import {SupportedLanguages} from "../domain/SupportedLanguage";
import * as Environment from "./EnvironmentUtils";
import {getBundledThemes, getUserThemePath, getUserThemes} from "./EnvironmentUtils";
import {allPlugins} from "./PluginLoader";
import path from "node:path";
import {getSystemPath, isFileExists} from "./FileUtils";
import {clearRecentFiles, getRecentFiles, onRecentFilesChanged, removeRecentFile} from "./RecentFiles";
import {Theme} from "../domain/Theme";
import {resolveAccelerator, Settings} from "../domain/Settings";
import {getDefaultAccelerator, ShortcutId} from "./Shortcuts";


export const appIcon = electron.nativeImage.createFromPath(path.join(getSystemPath(SystemPaths.resources), "Icons/note-manager.png"));

export function createApplicationMenu() {
    const menu = electron.Menu.buildFromTemplate([
        {
            label: 'File',
            submenu: [
                {
                    label: 'New',
                    accelerator: shortcut(ShortcutId.NEW),
                    click: () => {
                        sendToFocusedWindow(EventType.NEW_TAB);
                    }
                },
                {
                    label: 'Open',
                    accelerator: shortcut(ShortcutId.OPEN),
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
                            openInWindow(focusedWindow, file[0]);

                            focusedWindow.moveTop();
                        }
                    },
                },
                {
                    label: 'Open Recent',
                    submenu: createRecentFilesMenu()
                },
                {
                    label: 'Save',
                    accelerator: shortcut(ShortcutId.SAVE),
                    click: () => {
                        sendToFocusedWindow(EventType.SAVE_TAB);
                    }
                },
                {
                    label: 'Open Containing Folder',
                    click: () => {
                        sendToFocusedWindow(EventType.TAB_ACTION, {action: TabAction.REVEAL_IN_FOLDER});
                    }
                },
                {
                    label: 'Reopen Closed Tab',
                    accelerator: shortcut(ShortcutId.REOPEN_CLOSED),
                    click: () => {
                        sendToFocusedWindow(EventType.TAB_ACTION, {action: TabAction.REOPEN_CLOSED});
                    }
                },
                {
                    label: 'Close',
                    accelerator: shortcut(ShortcutId.CLOSE),
                    click: () => {
                        sendToFocusedWindow(EventType.CLOSE_TAB);
                    }
                }
            ],
        },
        {
            label: 'Edit',
            submenu: [
                {role: 'undo'},
                {role: 'redo'},
                {type: 'separator'},
                {role: 'cut'},
                {role: 'copy'},
                {role: 'paste'},
                {role: 'pasteAndMatchStyle'},
                {role: 'delete'},
                {role: 'selectAll'}
            ]
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
                    label: 'Settings...',
                    accelerator: shortcut(ShortcutId.SETTINGS),
                    click: () => {
                        sendToFocusedWindow(EventType.OPEN_SETTINGS);
                    }
                },
                {
                    type: 'separator'
                },
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
                            accelerator: shortcut(action.code)
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

function createRecentFilesMenu(): Array<Electron.MenuItemConstructorOptions> {
    const files = getRecentFiles();

    const items: Array<Electron.MenuItemConstructorOptions> = files.map((file, index) => ({
        label: (index < 9 ? `&${index + 1} ` : "") + file.replace(/&/g, "&&"),
        click: () => openRecentFile(file)
    }));

    if (items.length === 0) items.push({label: "No Recent Files", enabled: false});

    items.push({type: "separator"});
    items.push({label: "Clear Recently Opened", enabled: files.length > 0, click: () => clearRecentFiles()});

    return items;
}

function openRecentFile(file: string) {
    const focusedWindow = getFocusedWindow() || BrowserWindow.getAllWindows()[0];

    if (!focusedWindow) return;

    if (!isFileExists(file)) {
        electron.dialog.showMessageBox(focusedWindow, {
            type: "warning",
            title: "Open Recent",
            message: "File not found",
            detail: file + "\n\nIt will be removed from the recent files list."
        }).finally(() => removeRecentFile(file));

        return;
    }

    openInWindow(focusedWindow, file);
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

export function rebuildMenus() {
    initApplicationMenu();

    BrowserWindow.getAllWindows().forEach(win => {
        win.webContents.send(EventType.BUILD_MENU, {
            icon: appIcon
        });
    });
}

onRecentFilesChanged(rebuildMenus);

const insertedThemeKeys = new Map<number, string>();

export function loadThemeToWindow(win: BrowserWindow) {
    const contents = win.webContents;
    const previousKey = insertedThemeKeys.get(contents.id);

    contents.insertCSS(Environment.getPreferences().theme.getCSSContent())
        .then(key => {
            insertedThemeKeys.set(contents.id, key);

            if (previousKey) return contents.removeInsertedCSS(previousKey);
        })
        .catch(err => console.error("cannot load theme: " + err));
}

export function applySettingsToWindows(settings: Settings) {
    initApplicationMenu();
    refreshTitlebar();

    BrowserWindow.getAllWindows().forEach(win => win.webContents.send(EventType.SETTINGS_CHANGED, settings));
}

function shortcut(id: string) {
    return resolveAccelerator(Environment.getSettings(), id, getDefaultAccelerator(id));
}

export function initApplicationMenu() {
    electron.Menu.setApplicationMenu(createApplicationMenu());
}