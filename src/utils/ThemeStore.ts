import * as path from "node:path";
import * as fs from "node:fs";
import {getSystemPath, readSync, writeFileAtomic} from "./FileUtils";
import {SystemPaths} from "../enums";
import {isValidThemeName, parseThemeVariables, ThemeVariable, updateThemeVariables} from "./ThemeVariables";

export interface ThemeInfo {
    name: string,
    file: string,
    isUser: boolean,
}

const THEMES_FOLDER = "Themes";

export function getBundledThemePath() {
    const folder = path.join(getSystemPath(SystemPaths.resources), THEMES_FOLDER);

    if (!fs.existsSync(folder)) throw new Error(`'${THEMES_FOLDER}' folder is missing in app root directory (${process.cwd()})`);

    return folder;
}

export function getUserThemePath() {
    return path.join(getSystemPath(SystemPaths.data), THEMES_FOLDER);
}

export function getAllThemes(): Array<ThemeInfo> {
    return [
        ...listThemes(getBundledThemePath(), false),
        ...listThemes(getUserThemePath(), true),
    ];
}

export function findTheme(file: string) {
    return getAllThemes().find(t => t.file === file);
}

export function createUserTheme(name: string, baseFile: string): string {
    const base = findTheme(baseFile);

    if (!base) throw new Error("unknown theme: " + baseFile);
    if (!isValidThemeName(name)) throw new Error("invalid theme name: " + name);
    if (getAllThemes().some(t => t.name.toLowerCase() === name.toLowerCase())) throw new Error(`a theme named '${name}' already exists`);

    const target = path.join(getUserThemePath(), name + ".css");

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

function listThemes(folder: string, isUser: boolean): Array<ThemeInfo> {
    if (!fs.existsSync(folder)) return [];

    return fs.readdirSync(folder)
        .filter(file => file.toLowerCase().endsWith(".css"))
        .map(file => ({name: path.parse(file).name, file: path.join(folder, file), isUser: isUser}));
}
