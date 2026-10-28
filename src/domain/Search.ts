export enum SearchMode {
    NORMAL = "normal",
    EXTENDED = "extended",
    REGEX = "regex",
}

export enum SearchTarget {
    DOCUMENT = "document",
    OPEN_DOCUMENTS = "open-documents",
    FOLDER = "folder",
}

export interface SearchOptions {
    mode: SearchMode,
    matchCase: boolean,
    wholeWord: boolean,
    dotAll: boolean,
    wrap: boolean,
}

export interface SearchQuery extends SearchOptions {
    text: string,
}

export interface SearchHistory {
    find: Array<string>,
    replace: Array<string>,
}

export type GoToTarget = {line: number, column: number} | {offset: number};

export const DEFAULT_SEARCH_OPTIONS: SearchOptions = {
    mode: SearchMode.NORMAL,
    matchCase: false,
    wholeWord: false,
    dotAll: false,
    wrap: true,
};

export const SEARCH_HISTORY_SIZE = 20;
export const DEFAULT_WEB_SEARCH_URL = "https://www.google.com/search?q=%s";

const WEB_SEARCH_PLACEHOLDER = "%s";
const GO_TO_LINE = /^(\d+)(?::(\d+))?$/;
const GO_TO_OFFSET = /^#(\d+)$/;

export function addToHistory(history: Array<string>, term: string): Array<string> {
    if (!term) return history;

    return [term, ...history.filter(entry => entry !== term)].slice(0, SEARCH_HISTORY_SIZE);
}

export function normalizeSearchOptions(raw: any): SearchOptions {
    const toBoolean = (key: "matchCase" | "wholeWord" | "dotAll" | "wrap") => typeof raw?.[key] === "boolean" ? raw[key] : DEFAULT_SEARCH_OPTIONS[key];

    return {
        mode: Object.values(SearchMode).includes(raw?.mode) ? raw.mode : DEFAULT_SEARCH_OPTIONS.mode,
        matchCase: toBoolean("matchCase"),
        wholeWord: toBoolean("wholeWord"),
        dotAll: toBoolean("dotAll"),
        wrap: toBoolean("wrap"),
    };
}

export function normalizeSearchHistory(raw: any): SearchHistory {
    const toTerms = (list: unknown) => Array.isArray(list)
        ? list.filter((term): term is string => typeof term === "string" && term !== "").slice(0, SEARCH_HISTORY_SIZE)
        : [];

    return {find: toTerms(raw?.find), replace: toTerms(raw?.replace)};
}

export function parseGoToTarget(input: string): GoToTarget | undefined {
    const text = input.replace(/\s/g, "");
    const offset = GO_TO_OFFSET.exec(text);

    if (offset) return {offset: Number(offset[1])};

    const position = GO_TO_LINE.exec(text);

    if (!position) return undefined;

    return {line: Number(position[1]), column: Number(position[2] || 1)};
}

export function isWebSearchTemplate(template: unknown): template is string {
    return typeof template === "string" && /^https?:\/\/\S+$/i.test(template) && template.includes(WEB_SEARCH_PLACEHOLDER);
}

export function buildWebSearchUrl(template: string, text: string): string | undefined {
    const term = text.trim();

    if (!term || !isWebSearchTemplate(template)) return undefined;

    return template.split(WEB_SEARCH_PLACEHOLDER).join(encodeURIComponent(term));
}
