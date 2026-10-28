import {WebContents} from "electron";
import {handle} from "./IpcMain";
import {send} from "../utils/WindowUtils";
import {EventType} from "../enums";
import {getSettings, getTheme, saveSettings, setTheme} from "../utils/EnvironmentUtils";
import {createUserTheme, findTheme, getAllThemes, readThemeVariables, writeThemeVariables} from "../utils/ThemeStore";
import {applySettingsToWindows} from "../utils/ApplicationMenu";
import {getShortcutDefinitions} from "../utils/Shortcuts";
import {getUserPluginInfos, getUserPluginManifests} from "../utils/UserPlugins";

const recordingShortcuts = new Set<number>();
const shortcutListeners = new WeakSet<WebContents>();

export function registerSettingsHandlers() {
    handle(EventType.GET_SETTINGS, () => ({
        settings: getSettings(),
        themes: getAllThemes(),
        themeFile: getTheme().file,
        shortcuts: getShortcutDefinitions(getUserPluginManifests()),
    }));

    handle(EventType.SAVE_SETTINGS, (event, data) => {
        if (data?.themeVariables?.file && data.themeVariables.values) {
            writeThemeVariables(data.themeVariables.file, data.themeVariables.values);
        }

        if (data?.themeFile && findTheme(data.themeFile)) setTheme(data.themeFile);

        const settings = saveSettings(data?.settings);

        applySettingsToWindows(settings);

        return settings;
    });

    handle(EventType.RECORD_SHORTCUT, (event, data) => {
        const contents = event.sender;

        if (!data?.active) {
            recordingShortcuts.delete(contents.id);
            return;
        }

        recordingShortcuts.add(contents.id);

        if (!shortcutListeners.has(contents)) forwardShortcutKeys(contents);
    });

    handle(EventType.GET_USER_PLUGINS, () => getUserPluginInfos());

    handle(EventType.GET_THEME_VARIABLES, (event, data) => readThemeVariables(data?.file));

    handle(EventType.CREATE_THEME, (event, data) => ({
        file: createUserTheme(data?.name, data?.baseFile),
        themes: getAllThemes(),
    }));
}

function forwardShortcutKeys(contents: WebContents) {
    shortcutListeners.add(contents);

    contents.on("before-input-event", (inputEvent, input) => {
        if (!recordingShortcuts.has(contents.id) || input.type !== "keyDown") return;

        inputEvent.preventDefault();

        send(contents, EventType.SHORTCUT_KEY, {
            code: input.code,
            ctrlKey: input.control,
            metaKey: input.meta,
            altKey: input.alt,
            shiftKey: input.shift,
        });
    });
}
