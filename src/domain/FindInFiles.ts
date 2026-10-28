import {SearchQuery} from "./Search";
import type {TextSpan} from "../utils/TextSearch";

export interface FolderSearch {
    directory: string,
    filters: string,
    includeSubfolders: boolean,
    includeHidden: boolean,
}

export interface FileFilters {
    include: Array<RegExp>,
    exclude: Array<RegExp>,
}

export interface DetectionSettings {
    asciiAsUtf8: boolean,
    autodetect: boolean,
    ansiCodePage: string,
}

export interface FileSearchRequest {
    id: number,
    folder: FolderSearch,
    query: SearchQuery,
    replacement?: string,
    skipFiles: Array<string>,
}

export interface WorkerRequest extends FileSearchRequest {
    detection: DetectionSettings,
}

export interface FileMatches {
    file: string,
    lines: Array<string>,
    lineNumbers: Array<number>,
    hits: Array<TextSpan>,
}

export interface SkippedFile {
    file: string,
    reason: string,
}

export interface FileSearchProgress {
    id: number,
    files: Array<FileMatches>,
    scanned: number,
    replaced: number,
    replacedFiles: number,
    skipped: Array<SkippedFile>,
    isDone: boolean,
    isCancelled?: boolean,
    error?: string,
}

export interface FileSearchSummary {
    scanned: number,
    matched: number,
    hitCount: number,
    replaced: number,
    replacedFiles: number,
    skipped: Array<SkippedFile>,
    isCancelled: boolean,
    error?: string,
}

export const EMPTY_SEARCH_SUMMARY: FileSearchSummary = {
    scanned: 0,
    matched: 0,
    hitCount: 0,
    replaced: 0,
    replacedFiles: 0,
    skipped: [],
    isCancelled: false,
};

export const DEFAULT_FOLDER_SEARCH: FolderSearch = {
    directory: "",
    filters: "",
    includeSubfolders: true,
    includeHidden: false,
};

const FILTER_SEPARATOR = /[\s;,]+/;
const EXCLUDE_PREFIX = "!";
const ALL_FILES = "*.*";
const GLOB_SPECIAL_CHARACTERS = /[.+^${}()|[\]\\]/g;
const PATH_SEPARATOR = /[\\/]+/g;
const WINDOWS_PATH = /^[a-z]:|\\/i;

export function parseFileFilters(text: string): FileFilters {
    const patterns = text.split(FILTER_SEPARATOR).filter(Boolean);

    return {
        include: patterns.filter(p => !p.startsWith(EXCLUDE_PREFIX)).map(globToRegex),
        exclude: patterns.filter(p => p.startsWith(EXCLUDE_PREFIX) && p.length > 1).map(p => globToRegex(p.substring(1))),
    };
}

export function isExcludedEntry(filters: FileFilters, name: string, includeHidden: boolean): boolean {
    return (!includeHidden && isHiddenName(name)) || filters.exclude.some(pattern => pattern.test(name));
}

export function isIncludedFile(filters: FileFilters, name: string): boolean {
    return filters.include.length === 0 || filters.include.some(pattern => pattern.test(name));
}

export function isHiddenName(name: string): boolean {
    return name.startsWith(".") && name !== "." && name !== "..";
}

export function isSearchedFile(folder: FolderSearch, filters: FileFilters, file: string): boolean {
    const relative = relativePath(folder.directory, file);

    if (relative === undefined) return false;

    const parts = relative.split("/");
    const folders = parts.slice(0, -1);
    const name = parts[parts.length - 1];

    if (!folder.includeSubfolders && folders.length > 0) return false;

    return [...folders, name].every(part => !isExcludedEntry(filters, part, folder.includeHidden)) && isIncludedFile(filters, name);
}

export function relativePath(directory: string, file: string): string | undefined {
    if (!directory) return undefined;

    const ignoreCase = isWindowsPath(directory, file);
    const prefix = normalizePath(directory).replace(/\/$/, "") + "/";
    const target = normalizePath(file);
    const startsWith = ignoreCase ? target.toLowerCase().startsWith(prefix.toLowerCase()) : target.startsWith(prefix);

    return startsWith && target.length > prefix.length ? target.substring(prefix.length) : undefined;
}

export function isSamePath(a: string, b: string): boolean {
    const [first, second] = [normalizePath(a), normalizePath(b)];

    return isWindowsPath(a, b) ? first.toLowerCase() === second.toLowerCase() : first === second;
}

export function getParentDirectory(file: string): string {
    const index = Math.max(file.lastIndexOf("/"), file.lastIndexOf("\\"));

    return index > 0 ? file.substring(0, index) : "";
}

export function normalizeFolderSearch(raw: any): FolderSearch {
    const toBoolean = (key: "includeSubfolders" | "includeHidden") => typeof raw?.[key] === "boolean" ? raw[key] : DEFAULT_FOLDER_SEARCH[key];
    const toText = (key: "directory" | "filters") => typeof raw?.[key] === "string" ? raw[key] : DEFAULT_FOLDER_SEARCH[key];

    return {
        directory: toText("directory"),
        filters: toText("filters"),
        includeSubfolders: toBoolean("includeSubfolders"),
        includeHidden: toBoolean("includeHidden"),
    };
}

export function addProgress(summary: FileSearchSummary, progress: FileSearchProgress): FileSearchSummary {
    return {
        scanned: progress.scanned,
        matched: summary.matched + progress.files.length,
        hitCount: summary.hitCount + progress.files.reduce((count, file) => count + file.hits.length, 0),
        replaced: summary.replaced + progress.replaced,
        replacedFiles: summary.replacedFiles + progress.replacedFiles,
        skipped: [...summary.skipped, ...progress.skipped],
        isCancelled: summary.isCancelled || !!progress.isCancelled,
        error: summary.error ?? progress.error,
    };
}

function globToRegex(glob: string): RegExp {
    const source = (glob === ALL_FILES ? "*" : glob).replace(GLOB_SPECIAL_CHARACTERS, "\\$&").replace(/\*/g, ".*").replace(/\?/g, ".");

    return new RegExp(`^${source}$`, "i");
}

function isWindowsPath(...paths: Array<string>): boolean {
    return paths.some(path => WINDOWS_PATH.test(path));
}

function normalizePath(path: string): string {
    return path.replace(PATH_SEPARATOR, "/");
}
