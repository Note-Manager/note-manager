import {app, BrowserWindow, dialog, Menu, MenuItemConstructorOptions, nativeImage, shell} from "electron";
import path from "node:path";
import {EventType, SystemPaths, TabAction} from "../enums";
import {Settings} from "../domain/Settings";
import {getSystemPath, isFileExists} from "./FileUtils";
import {openInWindow} from "./EditorUtils";
import {getTheme, savePreferences, setTheme} from "./EnvironmentUtils";
import {getAllThemes, getUserThemePath} from "./ThemeStore";
import {ThemeInfo} from "../domain/ThemeInfo";
import {loadThemeToWindow} from "./ThemeLoader";
import {bundledPlugins} from "./PluginLoader";
import {clearRecentFiles, getRecentFiles, onRecentFilesChanged, removeRecentFile} from "./RecentFiles";
import {ShortcutId} from "./Shortcuts";
import {getAccelerator} from "./Accelerators";
import {getUserPluginManifests, getUserPluginPath, loadUserPluginManifests} from "./UserPlugins";
import {createEncodingMenu} from "./EncodingMenu";
import {createLanguageMenu} from "./LanguageMenu";
import {createSearchMenu} from "./SearchMenu";
import {missingRecentFileNotice} from "./DialogUtils";
import {broadcast, notify, sendPluginAction, sendToFocusedWindow} from "./WindowUtils";
import {RendererChannel, RendererPayload} from "../domain/IpcContract";
import {logError} from "./Log";

const appIcon = nativeImage.createFromPath(path.join(getSystemPath(SystemPaths.resources), "Icons/note-manager.png"));

function sendAction<C extends RendererChannel>(channel: C, ...data: RendererPayload<C>) {
    return () => sendToFocusedWindow(channel, ...data);
}

export function initApplicationMenu() {
    Menu.setApplicationMenu(createApplicationMenu());
}

export function rebuildMenus() {
    initApplicationMenu();
    broadcast(EventType.BUILD_MENU, {icon: appIcon});
}

export function refreshTitlebar() {
    BrowserWindow.getAllWindows().forEach(loadThemeToWindow);
    broadcast(EventType.BUILD_MENU, {icon: appIcon});
}

export function applySettingsToWindows(settings: Settings) {
    initApplicationMenu();
    refreshTitlebar();
    broadcast(EventType.SETTINGS_CHANGED, settings);
}

export function reloadUserPlugins() {
    loadUserPluginManifests();
    rebuildMenus();
    broadcast(EventType.USER_PLUGINS_CHANGED);
}

onRecentFilesChanged(rebuildMenus);

function createApplicationMenu() {
    const template: Array<MenuItemConstructorOptions> = [
        {label: "File", submenu: createFileMenu()},
        {
            label: "Edit",
            submenu: [
                {role: "undo"},
                {role: "redo"},
                {type: "separator"},
                {role: "cut"},
                {role: "copy"},
                {role: "paste"},
                {role: "pasteAndMatchStyle"},
                {role: "delete"},
                {role: "selectAll"}
            ]
        },
        {label: "Search", submenu: createSearchMenu(command => sendToFocusedWindow(EventType.EDITOR_COMMAND, {command: command}))},
        {label: "Encoding", submenu: createEncodingMenu(sendToFocusedWindow)},
        {label: "Language", submenu: createLanguageMenu(sendToFocusedWindow)},
        {
            label: "Preferences",
            submenu: [
                {label: "Settings...", accelerator: getAccelerator(ShortcutId.SETTINGS), click: sendAction(EventType.OPEN_SETTINGS)},
                {type: "separator"},
                {label: "Theme", submenu: createThemeMenu()}
            ]
        },
        {label: "Plugins", submenu: createPluginsMenu()},
    ];

    if (!app.isPackaged) template.push({label: "Developer", submenu: createDeveloperMenu()});

    return Menu.buildFromTemplate(template);
}

function createFileMenu(): Array<MenuItemConstructorOptions> {
    return [
        {label: "New", accelerator: getAccelerator(ShortcutId.NEW), click: sendAction(EventType.NEW_TAB)},
        {label: "Open", accelerator: getAccelerator(ShortcutId.OPEN), click: openFileFromDialog},
        {label: "Open Recent", submenu: createRecentFilesMenu()},
        {label: "Save", accelerator: getAccelerator(ShortcutId.SAVE), click: sendAction(EventType.SAVE_TAB)},
        {label: "Open Containing Folder", click: sendAction(EventType.TAB_ACTION, {action: TabAction.REVEAL_IN_FOLDER})},
        {label: "Reopen Closed Tab", accelerator: getAccelerator(ShortcutId.REOPEN_CLOSED), click: sendAction(EventType.TAB_ACTION, {action: TabAction.REOPEN_CLOSED})},
        {label: "Close", accelerator: getAccelerator(ShortcutId.CLOSE), click: sendAction(EventType.CLOSE_TAB)}
    ];
}

function createThemeMenu(): Array<MenuItemConstructorOptions> {
    return [
        ...getAllThemes().map(createThemeMenuItem),
        {type: "separator"},
        {label: "Reload Themes", click: () => {
            initApplicationMenu();
            refreshTitlebar();
        }},
        {label: "Open Themes Folder", click: () => shell.openPath(getUserThemePath()).catch(logError("cannot open the themes folder"))}
    ];
}

function createThemeMenuItem(theme: ThemeInfo): MenuItemConstructorOptions {
    return {
        label: theme.name,
        type: "radio",
        sublabel: theme.isUser ? "User Theme" : "Bundled Theme",
        checked: getTheme().file === theme.file,
        click: () => {
            setTheme(theme.file);
            savePreferences();
            refreshTitlebar();
        }
    };
}

function createPluginsMenu(): Array<MenuItemConstructorOptions> {
    const bundledItems = bundledPlugins.flatMap(plugin => plugin.applicationMenuItems || []).map(menuItem => ({
        label: menuItem.label,
        submenu: menuItem.actions.map(action => createPluginActionItem(action.label, action.code))
    }));

    const userItems = getUserPluginManifests().map(plugin => ({
        label: plugin.name,
        sublabel: "User Plugin",
        submenu: plugin.actions.map(action => createPluginActionItem(action.label, action.code))
    }));

    return [
        ...bundledItems,
        ...userItems,
        {type: "separator"},
        {label: "Reload User Plugins", click: reloadUserPlugins},
        {label: "Open Plugins Folder", click: () => shell.openPath(getUserPluginPath()).catch(logError("cannot open the plugins folder"))}
    ];
}

function createPluginActionItem(label: string, code: string): MenuItemConstructorOptions {
    return {label: label, accelerator: getAccelerator(code), click: () => sendPluginAction(BrowserWindow.getFocusedWindow()?.webContents, code)};
}

function createDeveloperMenu(): Array<MenuItemConstructorOptions> {
    return [
        {label: "Reload", accelerator: "CmdOrCtrl+R", click: () => BrowserWindow.getFocusedWindow()?.webContents.reload()},
        {label: "Developer Tools", accelerator: "F12", click: () => BrowserWindow.getFocusedWindow()?.webContents.toggleDevTools()}
    ];
}

function createRecentFilesMenu(): Array<MenuItemConstructorOptions> {
    const files = getRecentFiles();

    const items: Array<MenuItemConstructorOptions> = files.map((file, index) => ({
        label: (index < 9 ? `&${index + 1} ` : "") + file.replace(/&/g, "&&"),
        click: () => openRecentFile(file)
    }));

    if (items.length === 0) items.push({label: "No Recent Files", enabled: false});

    items.push({type: "separator"});
    items.push({label: "Clear Recently Opened", enabled: files.length > 0, click: clearRecentFiles});

    return items;
}

function openFileFromDialog() {
    const focusedWindow = BrowserWindow.getFocusedWindow();

    if (!focusedWindow) return;

    const files = dialog.showOpenDialogSync(focusedWindow, {
        title: "Select file to open",
        message: "Select file to open",
        buttonLabel: "Open",
        filters: [{extensions: ["*"], name: "All Files"}],
        properties: ["openFile"],
    });

    if (files?.length !== 1) return;

    openInWindow(focusedWindow, files[0]);
    focusedWindow.moveTop();
}

function openRecentFile(file: string) {
    const targetWindow = BrowserWindow.getFocusedWindow() || BrowserWindow.getAllWindows()[0];

    if (!targetWindow) return;

    if (isFileExists(file)) {
        openInWindow(targetWindow, file);
        return;
    }

    removeRecentFile(file);
    notify(targetWindow.webContents, missingRecentFileNotice(file));
}
