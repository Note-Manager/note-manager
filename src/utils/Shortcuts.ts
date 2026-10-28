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
    SETTINGS = "preferences.settings",
}

const BUILT_IN_SHORTCUTS: Array<ShortcutDefinition> = [
    {id: ShortcutId.NEW, label: "File > New", defaultAccelerator: "CmdOrCtrl+N"},
    {id: ShortcutId.OPEN, label: "File > Open", defaultAccelerator: "CmdOrCtrl+T"},
    {id: ShortcutId.SAVE, label: "File > Save", defaultAccelerator: "CmdOrCtrl+S"},
    {id: ShortcutId.REOPEN_CLOSED, label: "File > Reopen Closed Tab", defaultAccelerator: "CmdOrCtrl+Shift+T"},
    {id: ShortcutId.CLOSE, label: "File > Close", defaultAccelerator: "CmdOrCtrl+W"},
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
