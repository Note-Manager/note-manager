import * as path from "node:path";
import * as fs from "node:fs";
import {ensureExists, getSystemPath, writeFile} from "./FileUtils";
import {SystemPaths} from "../contants/Enums";
import * as Preferences from "../domain/Preferences";
import * as electron from "electron";
import * as Theme from "../domain/Theme";

const _ENV = {
    preferences: new Preferences.Preferences(new Theme.Theme(path.join(getBundledThemePath(), "Dark.css")))
}

export function getBundledThemes() {
    const folder = getBundledThemePath();

    return fs.readdirSync(folder).map(file => path.join(folder, file));
}

export function getUserThemes() {
    const folder = getUserThemePath();

    return fs.readdirSync(folder).map(file => path.join(folder, file));
}

export function getBundledThemePath() {
    const appRoot = process.cwd();

    const themesFolder = path.join(appRoot, "Themes");

    if (!fs.existsSync(themesFolder)) throw new Error("'Themes' folder is missing in app root directory (" + appRoot + ")");

    return themesFolder;
}

export function getUserThemePath() {
    const themesFolder = path.join(getSystemPath(SystemPaths.data), "Themes");

    ensureExists(themesFolder);

    return themesFolder;
}

export function getPreferencesFilePath() {
    ensureExists(getSystemPath(SystemPaths.data), "preferences.json", JSON.stringify(_ENV.preferences, null, 2));

    return path.join(getSystemPath(SystemPaths.data), "preferences.json");
}

export function savePreferences() {
    writeFile(getPreferencesFilePath(), JSON.stringify(_ENV.preferences, null, 2));
}

export function loadPreferences() {
    try {
        _ENV.preferences = Preferences.from(getPreferencesFilePath());
    } catch (error) {
        console.error(error);
        electron.dialog.showErrorBox("Error!", "An error is ocurred while loading your preferences:\n\n" + error);
    }
}

export function getPreferences() {
    return _ENV.preferences;
}

export function setPreferences(newPrefs) {
    return _ENV.preferences = newPrefs;
}

loadPreferences();