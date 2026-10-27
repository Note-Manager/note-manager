import * as path from "node:path";
import * as fs from "node:fs";
import {ensureExists, getSystemPath, readSync, writeFileAtomic} from "./FileUtils";
import * as Preferences from "../domain/Preferences";
import * as electron from "electron";
import * as Theme from "../domain/Theme";
import {SystemPaths} from "../enums";
import {normalizeSettings, Settings} from "../domain/Settings";
import {isValidThemeName, parseThemeVariables, ThemeVariable, updateThemeVariables} from "./ThemeVariables";

const _ENV = {
    preferences: new Preferences.Preferences(new Theme.Theme(path.join(getBundledThemePath(), "Dark.css")))
}

export function init() {
    ensureExists(getSystemPath(SystemPaths.data), "preferences.json", JSON.stringify(_ENV.preferences, null, 2));
    ensureExists(path.join(getSystemPath(SystemPaths.data), "Themes"));
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
    const themesFolder = path.join(getSystemPath(SystemPaths.resources), "Themes");

    if (!fs.existsSync(themesFolder)) throw new Error("'Themes' folder is missing in app root directory (" + process.cwd() + ")");

    return themesFolder;
}

export function getUserThemePath() {
    return path.join(getSystemPath(SystemPaths.data), "Themes");
}

export function getPreferencesFilePath() {
    return path.join(getSystemPath(SystemPaths.data), "preferences.json");
}

export function getStateFilePath() {
    return path.join(getSystemPath(SystemPaths.data), "State.json");
}

export function savePreferences() {
    writeFileAtomic(getPreferencesFilePath(), JSON.stringify(_ENV.preferences, null, 2));
}

export function loadPreferences() {
    try {
        init();
        _ENV.preferences = Preferences.from(getPreferencesFilePath());
    } catch (error) {
        console.error(error);
        electron.dialog.showErrorBox("Error!", "An error is ocurred while loading your preferences:\n\n" + error);
    }
}

export function getPreferences() {
    return _ENV.preferences;
}

export function setPreferences(preferences:Preferences.IPreferences) {
    return _ENV.preferences = preferences;
}

export function getSettings(): Settings {
    return _ENV.preferences.settings;
}

export function saveSettings(settings: Settings): Settings {
    _ENV.preferences.settings = normalizeSettings(settings);

    savePreferences();

    return _ENV.preferences.settings;
}

export function getAllThemes(): Array<{name: string, file: string, isUser: boolean}> {
    return [
        ...getBundledThemes().map(file => ({name: path.parse(file).name, file: file, isUser: false})),
        ...getUserThemes().map(file => ({name: path.parse(file).name, file: file, isUser: true})),
    ].filter(t => t.file.toLowerCase().endsWith(".css"));
}

export function findTheme(file: string) {
    return getAllThemes().find(t => t.file === file);
}

export function createUserTheme(name: string, baseFile: string): string {
    const base = findTheme(baseFile);

    if (!base) throw new Error("unknown theme: " + baseFile);
    if (!isValidThemeName(name)) throw new Error("invalid theme name: " + name);

    const target = path.join(getUserThemePath(), name + ".css");

    if (getAllThemes().some(t => t.name.toLowerCase() === name.toLowerCase())) throw new Error("a theme named '" + name + "' already exists");

    writeFileAtomic(target, readSync(base.file));

    return target;
}

export function readThemeVariables(file: string): Array<ThemeVariable> {
    const theme = findTheme(file);

    if (!theme) throw new Error("unknown theme: " + file);

    return parseThemeVariables(readSync(theme.file));
}

export function writeThemeVariables(file: string, values: Record<string, string>) {
    const theme = findTheme(file);

    if (!theme?.isUser) throw new Error("only user themes can be changed: " + file);

    writeFileAtomic(theme.file, updateThemeVariables(readSync(theme.file), values));
}

loadPreferences();