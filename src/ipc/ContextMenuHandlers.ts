import {BrowserWindow, clipboard, MenuItemConstructorOptions, WebContents} from "electron";
import {EditorCommand, EventType, TabAction} from "../enums";
import {isKnownEol} from "../domain/Encoding";
import {createEolMenu} from "../utils/EncodingMenu";
import {ShortcutId} from "../utils/Shortcuts";
import {getAccelerator} from "../utils/Accelerators";
import {popupMenu, send, Sender, sendPluginAction} from "../utils/WindowUtils";
import {ContextMenuGroup} from "../react/components/editor/plugins";
import {EditorMenuRequest, TabMenuRequest} from "../domain/IpcContract";
import {handle, optionalFile} from "./IpcMain";

const EDITOR_ACCELERATORS = {
    UNDO: "CmdOrCtrl+Z",
    REDO: "CmdOrCtrl+Shift+Z",
    DELETE: "Delete",
    SELECT_ALL: "CmdOrCtrl+A",
    FIND: "CmdOrCtrl+F",
    REPLACE: process.platform === "darwin" ? "Cmd+Alt+F" : "Ctrl+H",
    GO_TO_LINE: "CmdOrCtrl+L",
};

export function registerContextMenuHandlers() {
    handle(EventType.SHOW_STATUS_MENU, (event, data) => {
        const win = BrowserWindow.fromWebContents(event.sender);

        if (!win) return;

        const sendToSender: Sender = (channel, ...payload) => send(event.sender, channel, ...payload);

        popupMenu(createEolMenu(sendToSender, isKnownEol(data?.eol) ? data.eol : undefined), win, data);
    });

    handle(EventType.SHOW_TAB_CONTEXT_MENU, (event, data) => {
        const win = BrowserWindow.fromWebContents(event.sender);

        if (!win || typeof data?.tabId !== "string") return;

        popupMenu(createTabMenu(event.sender, data), win);
    });

    handle(EventType.SHOW_EDITOR_CONTEXT_MENU, (event, data) => {
        const win = BrowserWindow.fromWebContents(event.sender);

        if (!win) return;

        popupMenu(createEditorMenu(event.sender, data), win, data);
    });
}

function createTabMenu(sender: WebContents, data: TabMenuRequest): Array<MenuItemConstructorOptions> {
    const tabAction = (action: TabAction) => () => send(sender, EventType.TAB_ACTION, {action: action, tabId: data.tabId});

    return [
        {label: "Close Tab", accelerator: getAccelerator(ShortcutId.CLOSE), click: tabAction(TabAction.CLOSE)},
        {label: "Close Other Tabs", enabled: data.hasOtherTabs, click: tabAction(TabAction.CLOSE_OTHERS)},
        {label: "Close Unmodified Tabs", enabled: data.hasUnmodifiedTabs, click: tabAction(TabAction.CLOSE_UNMODIFIED)},
        {label: "Close All Tabs", enabled: data.hasClosableTabs, click: tabAction(TabAction.CLOSE_ALL)},
        {type: "separator"},
        {label: data.isPinned ? "Unpin Tab" : "Pin Tab", click: tabAction(TabAction.TOGGLE_PIN)},
        {type: "separator"},
        {label: "Open Containing Folder", enabled: data.hasFile, click: tabAction(TabAction.REVEAL_IN_FOLDER)},
        {type: "separator"},
        {label: "Reopen Closed Tab", accelerator: getAccelerator(ShortcutId.REOPEN_CLOSED), enabled: data.canReopen, click: tabAction(TabAction.REOPEN_CLOSED)},
    ];
}

function createEditorMenu(sender: WebContents, data: EditorMenuRequest): Array<MenuItemConstructorOptions> {
    const command = (cmd: EditorCommand) => () => send(sender, EventType.EDITOR_COMMAND, {command: cmd});
    const file = optionalFile(data);
    const hasSelection = !!data?.hasSelection;
    const pluginItems = createPluginItems(sender, data?.groups);

    const template: Array<MenuItemConstructorOptions> = [
        {label: "Undo", accelerator: EDITOR_ACCELERATORS.UNDO, enabled: data?.canUndo !== false, click: command(EditorCommand.UNDO)},
        {label: "Redo", accelerator: EDITOR_ACCELERATORS.REDO, enabled: data?.canRedo !== false, click: command(EditorCommand.REDO)},
        {type: "separator"},
        {role: "cut", enabled: hasSelection},
        {role: "copy", enabled: hasSelection},
        {role: "paste"},
        {label: "Delete", accelerator: EDITOR_ACCELERATORS.DELETE, enabled: hasSelection, click: command(EditorCommand.DELETE)},
        {type: "separator"},
        {label: "Select All", accelerator: EDITOR_ACCELERATORS.SELECT_ALL, click: command(EditorCommand.SELECT_ALL)},
    ];

    if (pluginItems.length > 0) template.push({type: "separator"}, ...pluginItems);

    template.push(
        {type: "separator"},
        {label: "Find", accelerator: EDITOR_ACCELERATORS.FIND, click: command(EditorCommand.FIND)},
        {label: "Replace", accelerator: EDITOR_ACCELERATORS.REPLACE, click: command(EditorCommand.REPLACE)},
        {label: "Go to Line", accelerator: EDITOR_ACCELERATORS.GO_TO_LINE, click: command(EditorCommand.GO_TO_LINE)},
    );

    if (data?.canPreview) template.push({label: data.isPreviewOpen ? "Hide Preview" : "Show Preview", click: command(EditorCommand.TOGGLE_PREVIEW)});

    template.push(
        {type: "separator"},
        {label: "Open Containing Folder", enabled: !!file, click: () => send(sender, EventType.TAB_ACTION, {action: TabAction.REVEAL_IN_FOLDER})},
        {label: "Copy File Path", enabled: !!file, click: () => file && clipboard.writeText(file)},
    );

    return template;
}

function createPluginItems(sender: WebContents, groups: unknown): Array<MenuItemConstructorOptions> {
    if (!Array.isArray(groups)) return [];

    return groups
        .filter((group): group is ContextMenuGroup => typeof group?.label === "string" && Array.isArray(group.actions))
        .map(group => {
            const actions: Array<MenuItemConstructorOptions> = group.actions
                .filter(action => typeof action?.label === "string" && typeof action.code === "string")
                .map(action => ({
                    label: action.label,
                    enabled: action.enabled !== false,
                    accelerator: getAccelerator(action.code),
                    click: () => sendPluginAction(sender, action.code)
                }));

            return actions.length === 1 ? actions[0] : {label: group.label, submenu: actions};
        })
        .filter(item => !Array.isArray(item.submenu) || item.submenu.length > 0);
}
