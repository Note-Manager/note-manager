import {describe, expect, it} from "vitest";
import {
    addToHistory,
    buildWebSearchUrl,
    DEFAULT_SEARCH_OPTIONS,
    isWebSearchTemplate,
    normalizeSearchHistory,
    normalizeSearchOptions,
    parseGoToTarget,
    SEARCH_HISTORY_SIZE,
    SearchMode,
} from "../Search";

describe("Search", () => {
    it("keeps history unique, newest first and bounded", () => {
        expect(addToHistory(["b", "a"], "a")).toEqual(["a", "b"]);
        expect(addToHistory(["a"], "")).toEqual(["a"]);

        const full = Array.from({length: SEARCH_HISTORY_SIZE}, (_, i) => String(i));

        expect(addToHistory(full, "new")).toHaveLength(SEARCH_HISTORY_SIZE);
        expect(addToHistory(full, "new")[0]).toBe("new");
    });

    it("normalizes stored options and history", () => {
        expect(normalizeSearchOptions(undefined)).toEqual(DEFAULT_SEARCH_OPTIONS);
        expect(normalizeSearchOptions({mode: "regex", matchCase: true, wrap: "no"})).toEqual({...DEFAULT_SEARCH_OPTIONS, mode: SearchMode.REGEX, matchCase: true});
        expect(normalizeSearchOptions({mode: "fuzzy"}).mode).toBe(SearchMode.NORMAL);
        expect(normalizeSearchHistory({find: ["a", 1, ""], replace: "x"})).toEqual({find: ["a"], replace: []});
    });

    it("parses go to targets", () => {
        expect(parseGoToTarget("12")).toEqual({line: 12, column: 1});
        expect(parseGoToTarget(" 12 : 5 ")).toEqual({line: 12, column: 5});
        expect(parseGoToTarget("#340")).toEqual({offset: 340});
        expect(parseGoToTarget(":5")).toBeUndefined();
        expect(parseGoToTarget("abc")).toBeUndefined();
        expect(parseGoToTarget("")).toBeUndefined();
    });

    it("builds web search urls from a template", () => {
        expect(buildWebSearchUrl("https://duckduckgo.com/?q=%s", " çay & kahve ")).toBe("https://duckduckgo.com/?q=%C3%A7ay%20%26%20kahve");
        expect(buildWebSearchUrl("https://example.com/?q=%s", "  ")).toBeUndefined();
        expect(isWebSearchTemplate("file:///etc/%s")).toBe(false);
        expect(isWebSearchTemplate("https://example.com/")).toBe(false);
    });
});
