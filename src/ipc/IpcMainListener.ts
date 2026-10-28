import electron, {BrowserWindow, clipboard, ipcMain, Menu, shell} from "electron";
import {EditorCommand, EventType, TabAction, UnencodableChoice, UnsavedChangesChoice} from "../enums";
import {getFocusedWindow, openInWindow, readTextFile, writeEditorState} from "../utils/EditorUtils";
import {EditorState} from "../domain/EditorState";
import * as Environment from "../utils/EnvironmentUtils";
import {isFileExists, readFileBytes, writeFile} from "../utils/FileUtils";
import {addRecentFile} from "../utils/RecentFiles";
import {getUnencodableMessage, getUnsavedChangesMessage, UNENCODABLE_SAVE_BUTTONS, UNSAVED_CHANGES_BUTTONS} from "../utils/DialogUtils";
import {applySettingsToWindows} from "../utils/ElectronUtils";
import {Theme} from "../domain/Theme";
import {resolveAccelerator, Settings} from "../domain/Settings";
import {getDefaultAccelerator, getShortcutDefinitions, ShortcutId} from "../utils/Shortcuts";
import {getUserPluginInfos, getUserPluginManifests} from "../utils/UserPlugins";
import {decodeBuffer, encodeText, findUnencodableCharacters, getAnsiCodePage} from "../utils/EncodingUtils";
import {DEFAULT_ENCODING, detectEol, EncodingId, EolType, getEncodingLabel, isKnownEncoding, isKnownEol, toEditorText} from "../domain/Encoding";
import {createEolMenu} from "../utils/EncodingMenu";
import {ContextMenuGroup} from "../react/components/editor/plugins";

const closingWindows = new Set<number>();
const recordingShortcuts = new Set<number>();
const shortcutListeners = new WeakSet<electron.WebContents>();

export default function initIpcMainListeners() {
    ipcMain.handle(EventType.FILES_DROPPED, (event, data: any) => {
        if(!data?.files || !Array.isArray(data.files)) return;

        try {
            for (const file of data.files) {
                try {
                    const win = BrowserWindow.fromWebContents(event.sender);
                    if(win) openInWindow(win, file);
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

    ipcMain.handle(EventType.SHOW_UNSAVED_CHANGES_DIALOG, (event, opts: {names?: Array<string>}) => {
        const focusedWindow = getFocusedWindow();
        if (!focusedWindow) return UnsavedChangesChoice.CANCEL;

        const {message, detail} = getUnsavedChangesMessage(Array.isArray(opts?.names) ? opts.names : []);

        const result = electron.dialog.showMessageBoxSync(focusedWindow, {
            type: "warning",
            buttons: UNSAVED_CHANGES_BUTTONS.map(b => b.label),
            defaultId: 0,
            cancelId: UNSAVED_CHANGES_BUTTONS.length - 1,
            noLink: true,
            title: "Unsaved changes",
            message: message,
            detail: detail,
        });

        return UNSAVED_CHANGES_BUTTONS[result]?.choice ?? UnsavedChangesChoice.CANCEL;
    });

    ipcMain.handle(EventType.WRITE_FILE, (event, data: {file: string, content: string, encoding?: string, eol?: EolType}) => {
        if (typeof data?.file !== "string" || !data.file) throw new Error("file is required");

        const content = typeof data.content === "string" ? data.content : "";
        const eol = isKnownEol(data.eol) ? data.eol : EolType.LF;
        let encoding = isKnownEncoding(data.encoding) ? data.encoding : DEFAULT_ENCODING;

        const unencodable = findUnencodableCharacters(content, encoding);

        if (unencodable.count > 0) {
            const win = BrowserWindow.fromWebContents(event.sender);
            const options: Electron.MessageBoxSyncOptions = {
                type: "warning",
                buttons: UNENCODABLE_SAVE_BUTTONS.map(b => b.label),
                defaultId: 0,
                cancelId: UNENCODABLE_SAVE_BUTTONS.length - 1,
                noLink: true,
                title: "Save",
                message: getUnencodableMessage(getEncodingLabel(encoding), unencodable.count, unencodable.samples),
                detail: data.file,
            };
            const choice = UNENCODABLE_SAVE_BUTTONS[win ? electron.dialog.showMessageBoxSync(win, options) : electron.dialog.showMessageBoxSync(options)]?.choice;

            if (choice === UnencodableChoice.CANCEL || choice === undefined) return {saved: false, encoding: encoding};
            if (choice === UnencodableChoice.CONVERT_TO_UTF8) encoding = EncodingId.UTF8;
        }

        writeFile(data.file, encodeText(content, encoding, eol));

        addRecentFile(data.file);

        return {saved: true, encoding: encoding};
    });

    ipcMain.handle(EventType.READ_FILE_AS, async (event, data: {file: string, encoding?: string, fallbackEol?: EolType}) => {
        if (typeof data?.file !== "string" || !data.file) throw new Error("file is required");

        if (!isKnownEncoding(data.encoding)) return readTextFile(data.file);

        const text = decodeBuffer(await readFileBytes(data.file), data.encoding);
        const eol = detectEol(text, isKnownEol(data.fallbackEol) ? data.fallbackEol : EolType.LF);

        return {content: toEditorText(text, eol), encoding: data.encoding, eol: eol};
    });

    ipcMain.handle(EventType.GET_ENCODING_INFO, () => ({ansiCodePage: getAnsiCodePage()}));

    ipcMain.handle(EventType.CONFIRM_REINTERPRET, (event, data: {name?: string, encoding?: string}) => {
        const win = BrowserWindow.fromWebContents(event.sender);
        const target = isKnownEncoding(data?.encoding) ? getEncodingLabel(data.encoding) : "the detected encoding";
        const options: Electron.MessageBoxSyncOptions = {
            type: "question",
            buttons: ["Reopen", "Cancel"],
            defaultId: 1,
            cancelId: 1,
            noLink: true,
            title: "Reopen with Encoding",
            message: `Reopen ${data?.name || "this file"} with ${target}?`,
            detail: "The file is read again from disk. Your unsaved changes in this tab will be lost.",
        };

        return (win ? electron.dialog.showMessageBoxSync(win, options) : electron.dialog.showMessageBoxSync(options)) === 0;
    });

    ipcMain.handle(EventType.CONFIRM_CONVERSION, (event, data: {content: string, encoding: string}) => {
        if (!isKnownEncoding(data?.encoding)) return false;

        const unencodable = findUnencodableCharacters(typeof data.content === "string" ? data.content : "", data.encoding);

        if (unencodable.count === 0) return true;

        const win = BrowserWindow.fromWebContents(event.sender);
        const options: Electron.MessageBoxSyncOptions = {
            type: "warning",
            buttons: ["Convert", "Cancel"],
            defaultId: 1,
            cancelId: 1,
            noLink: true,
            title: "Convert to " + getEncodingLabel(data.encoding),
            message: getUnencodableMessage(getEncodingLabel(data.encoding), unencodable.count, unencodable.samples),
            detail: "Do you want to convert anyway?",
        };

        return (win ? electron.dialog.showMessageBoxSync(win, options) : electron.dialog.showMessageBoxSync(options)) === 0;
    });

    ipcMain.handle(EventType.SHOW_STATUS_MENU, (event, data: {eol?: EolType, x?: number, y?: number}) => {
        const win = BrowserWindow.fromWebContents(event.sender);
        if (!win) return;

        const send = (channel: string, payload: any) => event.sender.send(channel, payload);

        Menu.buildFromTemplate(createEolMenu(send, isKnownEol(data?.eol) ? data.eol : undefined)).popup({
            window: win,
            x: Number.isFinite(data?.x) ? Math.round(data.x as number) : undefined,
            y: Number.isFinite(data?.y) ? Math.round(data.y as number) : undefined,
        });
    });

    ipcMain.handle(EventType.SHOW_TAB_CONTEXT_MENU, (event, data: {
        tabId: string,
        isPinned: boolean,
        hasOtherTabs: boolean,
        hasUnmodifiedTabs: boolean,
        hasClosableTabs: boolean,
        hasFile: boolean,
        canReopen: boolean
    }) => {
        const win = BrowserWindow.fromWebContents(event.sender);
        if (!win || typeof data?.tabId !== "string") return;

        const send = (action: TabAction) => () => event.sender.send(EventType.TAB_ACTION, {action: action, tabId: data.tabId});

        Menu.buildFromTemplate([
            {label: "Close Tab", accelerator: resolveAccelerator(Environment.getSettings(), ShortcutId.CLOSE, "CmdOrCtrl+W"), click: send(TabAction.CLOSE)},
            {label: "Close Other Tabs", enabled: data.hasOtherTabs, click: send(TabAction.CLOSE_OTHERS)},
            {label: "Close Unmodified Tabs", enabled: data.hasUnmodifiedTabs, click: send(TabAction.CLOSE_UNMODIFIED)},
            {label: "Close All Tabs", enabled: data.hasClosableTabs, click: send(TabAction.CLOSE_ALL)},
            {type: "separator"},
            {label: data.isPinned ? "Unpin Tab" : "Pin Tab", click: send(TabAction.TOGGLE_PIN)},
            {type: "separator"},
            {label: "Open Containing Folder", enabled: data.hasFile, click: send(TabAction.REVEAL_IN_FOLDER)},
            {type: "separator"},
            {label: "Reopen Closed Tab", accelerator: resolveAccelerator(Environment.getSettings(), ShortcutId.REOPEN_CLOSED, "CmdOrCtrl+Shift+T"), enabled: data.canReopen, click: send(TabAction.REOPEN_CLOSED)},
        ]).popup({window: win});
    });

    ipcMain.handle(EventType.SHOW_EDITOR_CONTEXT_MENU, (event, data: {
        hasSelection: boolean,
        canUndo: boolean,
        canRedo: boolean,
        file?: string,
        canPreview: boolean,
        isPreviewOpen: boolean,
        groups: Array<ContextMenuGroup>,
        x?: number,
        y?: number
    }) => {
        const win = BrowserWindow.fromWebContents(event.sender);
        if (!win) return;

        const command = (cmd: EditorCommand) => () => event.sender.send(EventType.EDITOR_COMMAND, {command: cmd});
        const file = typeof data?.file === "string" && data.file ? data.file : undefined;

        const pluginItems = (Array.isArray(data?.groups) ? data.groups : [])
            .filter(group => typeof group?.label === "string" && Array.isArray(group.actions))
            .map(group => {
                const actions = group.actions.filter(a => typeof a?.label === "string" && typeof a.code === "string").map(action => ({
                    label: action.label,
                    enabled: action.enabled !== false,
                    accelerator: resolveAccelerator(Environment.getSettings(), action.code, getDefaultAccelerator(action.code, getUserPluginManifests())),
                    click: () => event.sender.send(action.code)
                } as Electron.MenuItemConstructorOptions));

                return actions.length === 1 ? actions[0] : {label: group.label, submenu: actions} as Electron.MenuItemConstructorOptions;
            })
            .filter(item => !Array.isArray(item.submenu) || item.submenu.length > 0);

        const template: Array<Electron.MenuItemConstructorOptions> = [
            {label: "Undo", accelerator: "CmdOrCtrl+Z", enabled: data?.canUndo !== false, click: command(EditorCommand.UNDO)},
            {label: "Redo", accelerator: "CmdOrCtrl+Shift+Z", enabled: data?.canRedo !== false, click: command(EditorCommand.REDO)},
            {type: "separator"},
            {role: "cut", enabled: !!data?.hasSelection},
            {role: "copy", enabled: !!data?.hasSelection},
            {role: "paste"},
            {label: "Delete", accelerator: "Delete", enabled: !!data?.hasSelection, click: command(EditorCommand.DELETE)},
            {type: "separator"},
            {label: "Select All", accelerator: "CmdOrCtrl+A", click: command(EditorCommand.SELECT_ALL)},
        ];

        if (pluginItems.length > 0) template.push({type: "separator"}, ...pluginItems);

        template.push(
            {type: "separator"},
            {label: "Find", accelerator: "CmdOrCtrl+F", click: command(EditorCommand.FIND)},
            {label: "Replace", accelerator: process.platform === "darwin" ? "Cmd+Alt+F" : "Ctrl+H", click: command(EditorCommand.REPLACE)},
            {label: "Go to Line", accelerator: "CmdOrCtrl+L", click: command(EditorCommand.GO_TO_LINE)},
        );

        if (data?.canPreview) template.push({label: data.isPreviewOpen ? "Hide Preview" : "Show Preview", click: command(EditorCommand.TOGGLE_PREVIEW)});

        template.push(
            {type: "separator"},
            {label: "Open Containing Folder", enabled: !!file, click: () => event.sender.send(EventType.TAB_ACTION, {action: TabAction.REVEAL_IN_FOLDER})},
            {label: "Copy File Path", enabled: !!file, click: () => file && clipboard.writeText(file)},
        );

        Menu.buildFromTemplate(template).popup({
            window: win,
            x: Number.isFinite(data?.x) ? Math.round(data.x as number) : undefined,
            y: Number.isFinite(data?.y) ? Math.round(data.y as number) : undefined,
        });
    });

    ipcMain.handle(EventType.REVEAL_FILE, (event, data: {file: string}) => {
        if (typeof data?.file !== "string" || !data.file || !isFileExists(data.file)) return false;

        shell.showItemInFolder(data.file);

        return true;
    });

    ipcMain.handle(EventType.GET_SETTINGS, () => {
        return {
            settings: Environment.getSettings(),
            themes: Environment.getAllThemes(),
            themeFile: Environment.getPreferences().theme.file,
            shortcuts: getShortcutDefinitions(getUserPluginManifests()),
        };
    });

    ipcMain.handle(EventType.SAVE_SETTINGS, (event, data: {settings: Settings, themeFile?: string, themeVariables?: {file: string, values: Record<string, string>}}) => {
        if (data?.themeVariables?.file && data.themeVariables.values) {
            Environment.writeThemeVariables(data.themeVariables.file, data.themeVariables.values);
        }

        if (data?.themeFile && Environment.findTheme(data.themeFile)) {
            Environment.getPreferences().theme = new Theme(data.themeFile);
        }

        const settings = Environment.saveSettings(data?.settings);

        applySettingsToWindows(settings);

        return settings;
    });

    ipcMain.handle(EventType.RECORD_SHORTCUT, (event, data: {active: boolean}) => {
        const contents = event.sender;

        if (!data?.active) {
            recordingShortcuts.delete(contents.id);
            return;
        }

        recordingShortcuts.add(contents.id);

        if (shortcutListeners.has(contents)) return;

        shortcutListeners.add(contents);

        contents.on("before-input-event", (inputEvent, input) => {
            if (!recordingShortcuts.has(contents.id) || input.type !== "keyDown") return;

            inputEvent.preventDefault();

            contents.send(EventType.SHORTCUT_KEY, {
                code: input.code,
                ctrlKey: input.control,
                metaKey: input.meta,
                altKey: input.alt,
                shiftKey: input.shift,
            });
        });
    });

    ipcMain.handle(EventType.GET_USER_PLUGINS, () => getUserPluginInfos());

    ipcMain.handle(EventType.GET_THEME_VARIABLES, (event, data: {file: string}) => {
        return Environment.readThemeVariables(data?.file);
    });

    ipcMain.handle(EventType.CREATE_THEME, (event, data: {name: string, baseFile: string}) => {
        const file = Environment.createUserTheme(data?.name, data?.baseFile);

        return {file: file, themes: Environment.getAllThemes()};
    });

    ipcMain.handle(EventType.SAVE_STATE, (event, data: EditorState) => {
        if (closingWindows.has(event.sender.id) || !Array.isArray(data?.tabs)) return;

        try {
            writeEditorState(data, false);
        } catch (err) {
            console.error(err);
        }
    });

    ipcMain.handle(EventType.CLOSE_WITH_STATE, (event, data: EditorState) => {
        const sender = BrowserWindow.fromWebContents(event.sender);

        if(sender) {
            closingWindows.add(event.sender.id);

            console.log("saving state to '" + Environment.getStateFilePath() + "'");

            try {
                writeEditorState(data, true);
            } catch (err) {
                console.error(err);
            }

            sender.removeAllListeners(EventType.CLOSE_WINDOW);
            sender.close();
        }
    });
}
