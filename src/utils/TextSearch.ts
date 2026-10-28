import {SearchMode, SearchQuery} from "../domain/Search";

export interface TextSpan {
    start: number,
    end: number,
}

export interface TextPosition {
    row: number,
    column: number,
}

export type MatcherResult = {regex: RegExp} | {error: string};

export interface SpanReplacement extends TextSpan {
    text: string,
}

const SIMPLE_ESCAPES: Record<string, string> = {n: "\n", r: "\r", t: "\t", "0": "\0", "\\": "\\"};
const NUMERIC_ESCAPES: Record<string, {radix: number, pattern: RegExp}> = {
    x: {radix: 16, pattern: /^[0-9a-fA-F]{2}/},
    u: {radix: 16, pattern: /^[0-9a-fA-F]{4}/},
    d: {radix: 10, pattern: /^[0-9]{3}/},
    o: {radix: 8, pattern: /^[0-7]{3}/},
    b: {radix: 2, pattern: /^[01]{8}/},
};
const REGEX_SPECIAL_CHARACTERS = /[.*+?^${}()|[\]\\]/g;
const UNICODE_WORD_BOUNDARY = {before: "(?<![\\p{L}\\p{N}_])", after: "(?![\\p{L}\\p{N}_])"};
const ASCII_WORD_BOUNDARY = {before: "(?<!\\w)", after: "(?!\\w)"};
const REPLACEMENT_TOKEN = /\$(\$|&|\d{1,2}|<([^>]+)>)|\\(\d|[nrt\\])/g;

export function unescapeExtended(text: string): string {
    let result = "";

    for (let i = 0; i < text.length; i++) {
        const next = text[i + 1];

        if (text[i] !== "\\" || next === undefined) {
            result += text[i];
            continue;
        }

        if (SIMPLE_ESCAPES[next] !== undefined) {
            result += SIMPLE_ESCAPES[next];
            i++;
            continue;
        }

        const numeric = NUMERIC_ESCAPES[next];
        const digits = numeric?.pattern.exec(text.substring(i + 2))?.[0];

        if (!numeric || !digits) {
            result += text[i];
            continue;
        }

        result += String.fromCharCode(parseInt(digits, numeric.radix));
        i += 1 + digits.length;
    }

    return result;
}

export function buildMatcher(query: SearchQuery): MatcherResult | undefined {
    if (!query.text) return undefined;

    const isRegex = query.mode === SearchMode.REGEX;
    const literal = query.mode === SearchMode.EXTENDED ? unescapeExtended(query.text) : query.text;
    const source = isRegex ? query.text : literal.replace(REGEX_SPECIAL_CHARACTERS, "\\$&");
    const flags = "g" + (query.matchCase ? "" : "i") + (isRegex ? "m" : "") + (isRegex && query.dotAll ? "s" : "");

    try {
        return {regex: compile(source, flags + "u", query.wholeWord ? UNICODE_WORD_BOUNDARY : undefined)};
    } catch (unicodeError) {
        if (!isRegex) return {error: errorMessage(unicodeError)};
    }

    try {
        return {regex: compile(source, flags, query.wholeWord ? ASCII_WORD_BOUNDARY : undefined)};
    } catch (error) {
        return {error: errorMessage(error)};
    }
}

export function findAll(text: string, regex: RegExp, scope?: TextSpan): Array<TextSpan> {
    const matches: Array<TextSpan> = [];
    const end = scope?.end ?? text.length;

    regex.lastIndex = scope?.start ?? 0;

    for (let match = regex.exec(text); match && match.index <= end; match = regex.exec(text)) {
        const matchEnd = match.index + match[0].length;

        if (matchEnd <= end) matches.push({start: match.index, end: matchEnd});
        if (match[0].length === 0) regex.lastIndex++;
    }

    return matches;
}

export function findMatchIndex(matches: Array<TextSpan>, selection: TextSpan): number {
    const index = findFirstAtOrAfter(matches, selection.start);
    const match = matches[index];

    return match && match.start === selection.start && match.end === selection.end ? index : -1;
}

export function findNextIndex(matches: Array<TextSpan>, selection: TextSpan, isBackwards: boolean, canWrap: boolean): number {
    if (matches.length === 0) return -1;

    if (isBackwards) {
        let index = findFirstAtOrAfter(matches, selection.start) - 1;

        while (index >= 0 && matches[index].end > selection.start) index--;

        return index >= 0 ? index : canWrap ? matches.length - 1 : -1;
    }

    let index = findFirstAtOrAfter(matches, selection.end);

    while (index < matches.length && matches[index].start === selection.start && matches[index].end === selection.end) index++;

    return index < matches.length ? index : canWrap ? 0 : -1;
}

export function expandReplacement(template: string, mode: SearchMode, match: RegExpExecArray): string {
    if (mode === SearchMode.NORMAL) return template;
    if (mode === SearchMode.EXTENDED) return unescapeExtended(template);

    return template.replace(REPLACEMENT_TOKEN, (token, dollar: string | undefined, name: string | undefined, escaped: string | undefined) => {
        if (escaped !== undefined) return /\d/.test(escaped) ? match[Number(escaped)] ?? "" : SIMPLE_ESCAPES[escaped];
        if (dollar === "$") return "$";
        if (dollar === "&") return match[0];
        if (name !== undefined) return match.groups?.[name] ?? "";

        return Number(dollar) < match.length ? match[Number(dollar)] ?? "" : token;
    });
}

export function execAt(text: string, regex: RegExp, start: number): RegExpExecArray | undefined {
    regex.lastIndex = start;

    const match = regex.exec(text);

    return match?.index === start ? match : undefined;
}

export function replaceMatches(text: string, regex: RegExp, matches: Array<TextSpan>, template: string, mode: SearchMode): SpanReplacement | undefined {
    if (matches.length === 0) return undefined;

    const start = matches[0].start;
    const parts: Array<string> = [];
    let cursor = start;

    matches.forEach(match => {
        const exec = execAt(text, regex, match.start);

        parts.push(text.substring(cursor, match.start), exec ? expandReplacement(template, mode, exec) : text.substring(match.start, match.end));
        cursor = match.end;
    });

    return {start: start, end: cursor, text: parts.join("")};
}

export function createLineStarts(lines: Array<string>): Array<number> {
    const starts = new Array<number>(lines.length);
    let offset = 0;

    lines.forEach((line, row) => {
        starts[row] = offset;
        offset += line.length + 1;
    });

    return starts;
}

export function offsetToPosition(lineStarts: Array<number>, offset: number): TextPosition {
    const row = Math.max(0, lastIndexAtOrBefore(lineStarts, offset));

    return {row: row, column: offset - lineStarts[row]};
}

export function positionToOffset(lineStarts: Array<number>, position: TextPosition): number {
    return lineStarts[position.row] + position.column;
}

function compile(source: string, flags: string, boundary?: {before: string, after: string}): RegExp {
    return new RegExp(boundary ? `${boundary.before}(?:${source})${boundary.after}` : source, flags);
}

function errorMessage(error: unknown): string {
    return (error instanceof Error ? error.message : String(error)).replace(/^Invalid regular expression: \/.*\/[a-z]*: /, "");
}

export function findFirstAtOrAfter(spans: Array<TextSpan>, offset: number): number {
    let low = 0;
    let high = spans.length;

    while (low < high) {
        const middle = (low + high) >>> 1;

        if (spans[middle].start < offset) low = middle + 1;
        else high = middle;
    }

    return low;
}

function lastIndexAtOrBefore(values: Array<number>, value: number): number {
    let low = 0;
    let high = values.length;

    while (low < high) {
        const middle = (low + high) >>> 1;

        if (values[middle] <= value) low = middle + 1;
        else high = middle;
    }

    return low - 1;
}
