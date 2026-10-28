import * as path from "node:path";
import {dialog} from "electron";
import {ensureExists, getSystemPath, writeFileAtomic} from "./FileUtils";
import {Preferences, readPreferences} from "../domain/Preferences";
import {Theme} from "../domain/Theme";
import {SystemPaths} from "../enums";
import {normalizeSettings, Settings} from "../domain/Settings";
import {getBundledThemePath, getUserThemePath} from "./ThemeStore";

const PREFERENCES_FILE = "preferences.json";
const STATE_FILE = "State.json";

let preferences = new Preferences(new Theme(path.join(getBundledThemePath(), "Dark.css")));

export function getPreferencesFilePath() {
    return path.join(getSystemPath(SystemPaths.data), PREFERENCES_FILE);
}

export function getStateFilePath() {
    return path.join(getSystemPath(SystemPaths.data), STATE_FILE);
}

export function loadPreferences() {
    try {
        ensureExists(getSystemPath(SystemPaths.data), PREFERENCES_FILE, serializePreferences());
        ensureExists(getUserThemePath());

        preferences = readPreferences(getPreferencesFilePath());
    } catch (error) {
        console.error(error);
        dialog.showErrorBox("Error!", "An error occurred while loading your preferences:\n\n" + error);
    }
}

export function savePreferences() {
    writeFileAtomic(getPreferencesFilePath(), serializePreferences());
}

export function getTheme() {
    return preferences.theme;
}

export function setTheme(file: string) {
    preferences.theme = new Theme(file);
}

export function getSettings(): Settings {
    return preferences.settings;
}

export function saveSettings(settings: Settings): Settings {
    preferences.settings = normalizeSettings(settings);

    savePreferences();

    return preferences.settings;
}

function serializePreferences() {
    return JSON.stringify(preferences, null, 2);
}
