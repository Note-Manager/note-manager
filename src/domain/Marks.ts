import {normalizeSearchOptions, SearchMode, SearchQuery} from "./Search";

export enum MarkStyle {
    FOUND = "found",
    STYLE_1 = "style-1",
    STYLE_2 = "style-2",
    STYLE_3 = "style-3",
    STYLE_4 = "style-4",
    STYLE_5 = "style-5",
}

export interface MarkRule {
    style: MarkStyle,
    query: SearchQuery,
}

export const TOKEN_STYLES = [MarkStyle.STYLE_1, MarkStyle.STYLE_2, MarkStyle.STYLE_3, MarkStyle.STYLE_4, MarkStyle.STYLE_5];

export function createTokenQuery(text: string): SearchQuery {
    return {mode: SearchMode.NORMAL, matchCase: true, wholeWord: false, dotAll: false, wrap: true, text: text};
}

export function createSmartHighlightQuery(text: string): SearchQuery {
    return {...createTokenQuery(text), matchCase: false, wholeWord: true};
}

export function addMarkRule(rules: Array<MarkRule>, rule: MarkRule): Array<MarkRule> {
    const key = JSON.stringify(rule);

    return [...rules.filter(existing => JSON.stringify(existing) !== key), rule];
}

export function clearMarkStyles(rules: Array<MarkRule>, styles: Array<MarkStyle>): Array<MarkRule> {
    return rules.filter(rule => !styles.includes(rule.style));
}

export function normalizeMarkRules(raw: unknown): Array<MarkRule> {
    if (!Array.isArray(raw)) return [];

    return raw
        .filter(rule => Object.values(MarkStyle).includes(rule?.style) && typeof rule?.query?.text === "string" && rule.query.text !== "")
        .map(rule => ({style: rule.style, query: {...normalizeSearchOptions(rule.query), text: rule.query.text}}));
}

const WORD_CHARACTER = /[\p{L}\p{N}_]/u;
const WORD = /^[\p{L}\p{N}_]+$/u;

export function readWholeWord(line: string, start: number, end: number): string | undefined {
    const text = line.substring(start, end);
    const isBoundary = (character: string | undefined) => !character || !WORD_CHARACTER.test(character);

    return WORD.test(text) && isBoundary(line[start - 1]) && isBoundary(line[end]) ? text : undefined;
}

export function getMarkClassName(style: MarkStyle): string {
    return "mark " + style;
}
