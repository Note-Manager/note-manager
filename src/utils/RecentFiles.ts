import path from "node:path";
import {isFileExists, readSync, writeFileAtomic} from "./FileUtils";
import * as Environment from "./EnvironmentUtils";

export const MAX_RECENT_FILES = 10;

let recentFiles: Array<string> | undefined;
const listeners: Array<() => void> = [];

export function getRecentFilesPath() {
    return path.join(path.dirname(Environment.getStateFilePath()), "RecentFiles.json");
}

function load(): Array<string> {
    if (recentFiles) return recentFiles;

    recentFiles = [];

    try {
        const file = getRecentFilesPath();

        if (isFileExists(file)) {
            const parsed = JSON.parse(readSync(file));

            if (Array.isArray(parsed)) {
                recentFiles = parsed.filter(f => typeof f === "string" && f.length > 0).slice(0, MAX_RECENT_FILES);
            }
        }
    } catch (err) {
        console.error(`cannot read recent files: ${err}`);
    }

    return recentFiles;
}

function isSamePath(a: string, b: string) {
    return process.platform === "win32" || process.platform === "darwin"
        ? a.toLowerCase() === b.toLowerCase()
        : a === b;
}

function update(files: Array<string>) {
    recentFiles = files;

    try {
        writeFileAtomic(getRecentFilesPath(), JSON.stringify(files, null, 2));
    } catch (err) {
        console.error(`cannot write recent files: ${err}`);
    }

    listeners.forEach(l => l());
}

export function getRecentFiles(): Array<string> {
    return [...load()];
}

export function addRecentFile(file: string) {
    if (!file) return;

    const current = load();

    if (current.length > 0 && isSamePath(current[0], file)) return;

    update([file, ...current.filter(f => !isSamePath(f, file))].slice(0, MAX_RECENT_FILES));
}

export function removeRecentFile(file: string) {
    const current = load();
    const next = current.filter(f => !isSamePath(f, file));

    if (next.length !== current.length) update(next);
}

export function clearRecentFiles() {
    if (load().length > 0) update([]);
}

export function onRecentFilesChanged(listener: () => void) {
    listeners.push(listener);
}
