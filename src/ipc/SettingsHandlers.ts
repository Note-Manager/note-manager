import {ipcMain, WebContents} from "electron";
import {EventType} from "../enums";
import {getSettings, getTheme, saveSettings, setTheme} from "../utils/EnvironmentUtils";
import {createUserTheme, findTheme, getAllThemes, readThemeVariables, writeThemeVariables} from "../utils/ThemeStore";
import {applySettingsToWindows} from "../utils/ApplicationMenu";
import {Settings} from "../domain/Settings";
import {getShortcutDefinitions} from "../utils/Shortcuts";
import {getUserPluginInfos, getUserPluginManifests} from "../utils/UserPlugins";

const recordingShortcuts = new Set<number>();
const shortcutListeners = new WeakSet<WebContents>();

export function registerSettingsHandlers() {
    ipcMain.handle(EventType.GET_SETTINGS, () => ({
        settings: getSettings(),
        themes: getAllThemes(),
        themeFile: getTheme().file,
        shortcuts: getShortcutDefinitions(getUserPluginManifests()),
    }));

    ipcMain.handle(EventType.SAVE_SETTINGS, (event, data: {settings: Settings, themeFile?: string, themeVariables?: {file: string, values: Record<string, string>}}) => {
        if (data?.themeVariables?.file && data.themeVariables.values) {
            writeThemeVariables(data.themeVariables.file, data.themeVariables.values);
        }

        if (data?.themeFile && findTheme(data.themeFile)) setTheme(data.themeFile);

        const settings = saveSettings(data?.settings);

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

        if (!shortcutListeners.has(contents)) forwardShortcutKeys(contents);
    });

    ipcMain.handle(EventType.GET_USER_PLUGINS, () => getUserPluginInfos());

    ipcMain.handle(EventType.GET_THEME_VARIABLES, (event, data: {file: string}) => readThemeVariables(data?.file));

    ipcMain.handle(EventType.CREATE_THEME, (event, data: {name: string, baseFile: string}) => ({
        file: createUserTheme(data?.name, data?.baseFile),
        themes: getAllThemes(),
    }));
}

function forwardShortcutKeys(contents: WebContents) {
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
}
