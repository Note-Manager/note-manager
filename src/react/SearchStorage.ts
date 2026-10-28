import {normalizeSearchHistory, normalizeSearchOptions, SearchHistory, SearchOptions} from "../domain/Search";
import {FolderSearch, normalizeFolderSearch} from "../domain/FindInFiles";

const OPTIONS_KEY = "searchOptions";
const HISTORY_KEY = "searchHistory";
const FOLDER_KEY = "folderSearch";

export function readSearchOptions(): SearchOptions {
    return normalizeSearchOptions(readJson(OPTIONS_KEY));
}

export function readSearchHistory(): SearchHistory {
    return normalizeSearchHistory(readJson(HISTORY_KEY));
}

export function readFolderSearch(): FolderSearch {
    return normalizeFolderSearch(readJson(FOLDER_KEY));
}

export function storeFolderSearch(folder: FolderSearch) {
    writeJson(FOLDER_KEY, folder);
}

export function storeSearchOptions(options: SearchOptions) {
    writeJson(OPTIONS_KEY, options);
}

export function storeSearchHistory(history: SearchHistory) {
    writeJson(HISTORY_KEY, history);
}

function readJson(key: string): unknown {
    try {
        return JSON.parse(localStorage.getItem(key) || "null");
    } catch {
        return undefined;
    }
}

function writeJson(key: string, value: unknown) {
    try {
        localStorage.setItem(key, JSON.stringify(value));
    } catch {
        return;
    }
}
