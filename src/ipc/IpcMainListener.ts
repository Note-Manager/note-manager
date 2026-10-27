import electron, {BrowserWindow, ipcMain, Menu, shell} from "electron";
import {EventType, TabAction, UnsavedChangesChoice} from "../enums";
import {getFocusedWindow, openInWindow, writeEditorState} from "../utils/EditorUtils";
import {EditorState} from "../domain/EditorState";
import * as Environment from "../utils/EnvironmentUtils";
import {isFileExists, writeFile} from "../utils/FileUtils";
import {addRecentFile} from "../utils/RecentFiles";
import {getUnsavedChangesMessage, UNSAVED_CHANGES_BUTTONS} from "../utils/DialogUtils";
import {applySettingsToWindows} from "../utils/ElectronUtils";
import {Theme} from "../domain/Theme";
import {resolveAccelerator, Settings} from "../domain/Settings";
import {ShortcutId} from "../utils/Shortcuts";

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

    ipcMain.handle(EventType.WRITE_FILE, (event, data: {file: string, content: string}) => {
        if (typeof data?.file !== "string" || !data.file) throw new Error("file is required");

        writeFile(data.file, typeof data.content === "string" ? data.content : "");

        addRecentFile(data.file);
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
