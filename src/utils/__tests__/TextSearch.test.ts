import {describe, expect, it} from "vitest";
import {DEFAULT_SEARCH_OPTIONS, SearchMode, SearchQuery} from "../../domain/Search";
import {
    buildMatcher,
    createLineStarts,
    createSearchDocument,
    execAt,
    expandReplacement,
    findAll,
    findMatchIndex,
    findNextIndex,
    offsetToPosition,
    positionToOffset,
    readLine,
    replaceMatches,
    searchText,
    splitLines,
    unescapeExtended,
} from "../TextSearch";

const query = (text: string, options: Partial<SearchQuery> = {}): SearchQuery => ({...DEFAULT_SEARCH_OPTIONS, text: text, ...options});

const regexOf = (searchQuery: SearchQuery) => {
    const result = buildMatcher(searchQuery);

    if (!result || !("regex" in result)) throw new Error("no matcher");

    return result.regex;
};

const spansOf = (text: string, searchQuery: SearchQuery) => findAll(text, regexOf(searchQuery));

describe("TextSearch", () => {
    it("unescapes extended sequences", () => {
        expect(unescapeExtended("a\\tb\\nc\\r\\0\\\\")).toBe("a\tb\nc\r\0\\");
        expect(unescapeExtended("\\x41\\u00e7\\d065\\o101\\b01000001")).toBe("AçAAA");
        expect(unescapeExtended("\\q \\x4 end\\")).toBe("\\q \\x4 end\\");
    });

    it("returns nothing for an empty query", () => {
        expect(buildMatcher(query(""))).toBeUndefined();
    });

    it("searches normal text literally and ignores case by default", () => {
        expect(spansOf("a.b A.B axb", query("a.b"))).toEqual([{start: 0, end: 3}, {start: 4, end: 7}]);
        expect(spansOf("a.b A.B", query("a.b", {matchCase: true}))).toEqual([{start: 0, end: 3}]);
    });

    it("matches whole words including non-ASCII letters", () => {
        expect(spansOf("şiş iş işçi iş", query("iş", {wholeWord: true}))).toEqual([{start: 4, end: 6}, {start: 12, end: 14}]);
    });

    it("searches extended text with line breaks", () => {
        expect(spansOf("a\nb\na b", query("a\\nb", {mode: SearchMode.EXTENDED}))).toEqual([{start: 0, end: 3}]);
    });

    it("searches regular expressions per line and across lines with dot all", () => {
        expect(spansOf("ab\ncd", query("^\\w", {mode: SearchMode.REGEX}))).toEqual([{start: 0, end: 1}, {start: 3, end: 4}]);
        expect(spansOf("ab\ncd", query("b.c", {mode: SearchMode.REGEX}))).toEqual([]);
        expect(spansOf("ab\ncd", query("b.c", {mode: SearchMode.REGEX, dotAll: true}))).toEqual([{start: 1, end: 4}]);
    });

    it("falls back to non-unicode regular expressions", () => {
        expect(spansOf("a-b", query("a\\-b", {mode: SearchMode.REGEX}))).toEqual([{start: 0, end: 3}]);
    });

    it("reports invalid regular expressions", () => {
        expect(buildMatcher(query("(a", {mode: SearchMode.REGEX}))).toEqual({error: expect.stringContaining("Unterminated group")});
    });

    it("advances over empty matches", () => {
        expect(spansOf("ab", query("x*", {mode: SearchMode.REGEX}))).toEqual([{start: 0, end: 0}, {start: 1, end: 1}, {start: 2, end: 2}]);
    });

    it("limits matches to a scope", () => {
        expect(findAll("aaaa", regexOf(query("aa")), {start: 1, end: 4})).toEqual([{start: 1, end: 3}]);
    });

    it("finds the match equal to the selection", () => {
        const matches = [{start: 0, end: 2}, {start: 5, end: 7}];

        expect(findMatchIndex(matches, {start: 5, end: 7})).toBe(1);
        expect(findMatchIndex(matches, {start: 5, end: 6})).toBe(-1);
    });

    it("finds the next and previous match with and without wrapping", () => {
        const matches = [{start: 0, end: 2}, {start: 5, end: 7}, {start: 10, end: 12}];

        expect(findNextIndex(matches, {start: 3, end: 3}, false, true)).toBe(1);
        expect(findNextIndex(matches, {start: 5, end: 7}, false, true)).toBe(2);
        expect(findNextIndex(matches, {start: 10, end: 12}, false, true)).toBe(0);
        expect(findNextIndex(matches, {start: 10, end: 12}, false, false)).toBe(-1);
        expect(findNextIndex(matches, {start: 5, end: 7}, true, true)).toBe(0);
        expect(findNextIndex(matches, {start: 6, end: 6}, true, true)).toBe(0);
        expect(findNextIndex(matches, {start: 0, end: 2}, true, true)).toBe(2);
        expect(findNextIndex(matches, {start: 0, end: 2}, true, false)).toBe(-1);
        expect(findNextIndex([], {start: 0, end: 0}, false, true)).toBe(-1);
    });

    it("skips an empty match at the caret", () => {
        expect(findNextIndex([{start: 3, end: 3}, {start: 6, end: 6}], {start: 3, end: 3}, false, true)).toBe(1);
    });

    it("expands replacement templates by mode", () => {
        const match = execAt("John Smith", /(?<first>\w+) (\w+)/g, 0)!;

        expect(expandReplacement("$2 $1", SearchMode.NORMAL, match)).toBe("$2 $1");
        expect(expandReplacement("a\\tb", SearchMode.EXTENDED, match)).toBe("a\tb");
        expect(expandReplacement("$2, $<first> ($&) $$ \\1\\n$9", SearchMode.REGEX, match)).toBe("Smith, John (John Smith) $ John\n$9");
    });

    it("replaces matches inside one span", () => {
        const text = "a1 b2 c3";
        const regex = regexOf(query("(\\w)(\\d)", {mode: SearchMode.REGEX}));
        const matches = findAll(text, regex);

        expect(replaceMatches(text, regex, matches, "$2$1", SearchMode.REGEX)).toEqual({start: 0, end: 8, text: "1a 2b 3c"});
        expect(replaceMatches(text, regex, matches.slice(1, 2), "-", SearchMode.REGEX)).toEqual({start: 3, end: 5, text: "-"});
        expect(replaceMatches(text, regex, [], "-", SearchMode.REGEX)).toBeUndefined();
    });

    it("keeps lookbehind context when replacing", () => {
        const text = "xa ya";
        const regex = regexOf(query("(?<=x)a", {mode: SearchMode.REGEX}));

        expect(replaceMatches(text, regex, findAll(text, regex), "b", SearchMode.REGEX)).toEqual({start: 1, end: 2, text: "b"});
    });

    it("maps offsets to positions and back", () => {
        const starts = createLineStarts(["ab", "", "cde"]);

        expect(starts).toEqual([0, 3, 4]);
        expect(offsetToPosition(starts, 0)).toEqual({row: 0, column: 0});
        expect(offsetToPosition(starts, 2)).toEqual({row: 0, column: 2});
        expect(offsetToPosition(starts, 3)).toEqual({row: 1, column: 0});
        expect(offsetToPosition(starts, 6)).toEqual({row: 2, column: 2});
        expect(positionToOffset(starts, {row: 2, column: 1})).toBe(5);
    });

    it("builds a search document from lines of any line ending", () => {
        const document = createSearchDocument(splitLines("ab\r\ncd\re\n"));

        expect(document.text).toBe("ab\ncd\ne\n");
        expect(readLine(document, 1)).toBe("cd");
        expect(readLine(document, 3)).toBe("");
    });

    it("searches a document and reports errors", () => {
        const document = createSearchDocument(["a b", "b"]);

        expect(searchText(document, query("b")).matches).toEqual([{start: 2, end: 3}, {start: 4, end: 5}]);
        expect(searchText(document, query("b"), {start: 0, end: 3}).matches).toEqual([{start: 2, end: 3}]);
        expect(searchText(document, query("(", {mode: SearchMode.REGEX})).error).toBeTruthy();
        expect(searchText(document, query("")).matches).toEqual([]);
    });
});
