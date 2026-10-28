import {bundledPlugins} from "./PluginLoader";
import {PluginManifest} from "../domain/PluginManifest";

export interface ShortcutDefinition {
    id: string,
    label: string,
    defaultAccelerator?: string,
}

export enum ShortcutId {
    NEW = "file.new",
    OPEN = "file.open",
    SAVE = "file.save",
    REOPEN_CLOSED = "file.reopenClosed",
    CLOSE = "file.close",
    FIND = "search.find",
    REPLACE = "search.replace",
    FIND_NEXT = "search.findNext",
    FIND_PREVIOUS = "search.findPrevious",
    SELECT_AND_FIND_NEXT = "search.selectAndFindNext",
    SELECT_AND_FIND_PREVIOUS = "search.selectAndFindPrevious",
    GO_TO = "search.goTo",
    GO_TO_MATCHING_BRACE = "search.goToMatchingBrace",
    SEARCH_ON_WEB = "search.searchOnWeb",
    SETTINGS = "preferences.settings",
}

const IS_MAC = typeof process !== "undefined" && process.platform === "darwin";

const BUILT_IN_SHORTCUTS: Array<ShortcutDefinition> = [
    {id: ShortcutId.NEW, label: "File > New", defaultAccelerator: "CmdOrCtrl+N"},
    {id: ShortcutId.OPEN, label: "File > Open", defaultAccelerator: "CmdOrCtrl+T"},
    {id: ShortcutId.SAVE, label: "File > Save", defaultAccelerator: "CmdOrCtrl+S"},
    {id: ShortcutId.REOPEN_CLOSED, label: "File > Reopen Closed Tab", defaultAccelerator: "CmdOrCtrl+Shift+T"},
    {id: ShortcutId.CLOSE, label: "File > Close", defaultAccelerator: "CmdOrCtrl+W"},
    {id: ShortcutId.FIND, label: "Search > Find", defaultAccelerator: "CmdOrCtrl+F"},
    {id: ShortcutId.REPLACE, label: "Search > Replace", defaultAccelerator: IS_MAC ? "Cmd+Alt+F" : "Ctrl+H"},
    {id: ShortcutId.FIND_NEXT, label: "Search > Find Next", defaultAccelerator: "F3"},
    {id: ShortcutId.FIND_PREVIOUS, label: "Search > Find Previous", defaultAccelerator: "Shift+F3"},
    {id: ShortcutId.SELECT_AND_FIND_NEXT, label: "Search > Select and Find Next", defaultAccelerator: "CmdOrCtrl+F3"},
    {id: ShortcutId.SELECT_AND_FIND_PREVIOUS, label: "Search > Select and Find Previous", defaultAccelerator: "CmdOrCtrl+Shift+F3"},
    {id: ShortcutId.GO_TO, label: "Search > Go To", defaultAccelerator: "CmdOrCtrl+G"},
    {id: ShortcutId.GO_TO_MATCHING_BRACE, label: "Search > Go to Matching Brace", defaultAccelerator: "CmdOrCtrl+B"},
    {id: ShortcutId.SEARCH_ON_WEB, label: "Search > Search on the Web"},
    {id: ShortcutId.SETTINGS, label: "Preferences > Settings", defaultAccelerator: "CmdOrCtrl+,"},
];

export function getShortcutDefinitions(userPlugins: Array<PluginManifest> = []): Array<ShortcutDefinition> {
    const pluginShortcuts = bundledPlugins.flatMap(plugin => (plugin.applicationMenuItems || []).flatMap(item => item.actions.map(action => ({
        id: action.code,
        label: `Plugins > ${item.label} > ${action.label}`,
        defaultAccelerator: action.accelerator,
    }))));

    const userPluginShortcuts = userPlugins.flatMap(plugin => plugin.actions.map(action => ({
        id: action.code,
        label: `Plugins > ${plugin.name} > ${action.label}`,
        defaultAccelerator: action.accelerator,
    })));

    return [...BUILT_IN_SHORTCUTS, ...pluginShortcuts, ...userPluginShortcuts];
}

export function getDefaultAccelerator(id: string, userPlugins: Array<PluginManifest> = []): string | undefined {
    return getShortcutDefinitions(userPlugins).find(s => s.id === id)?.defaultAccelerator;
}
