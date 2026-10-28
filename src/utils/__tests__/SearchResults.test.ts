import {describe, expect, it} from "vitest";
import {DEFAULT_SEARCH_OPTIONS, SearchTarget} from "../../domain/Search";
import {createResultRows, describeHit, findAdjacentHit, getHit, hitKey, previewMatch, SearchRun} from "../SearchResults";
import {createSearchDocument} from "../TextSearch";

const DOCUMENT = createSearchDocument(["a", "a", "a"]);

const run = (id: number, hitsPerDocument: Array<number>): SearchRun => ({
    id: id,
    query: {...DEFAULT_SEARCH_OPTIONS, text: "a"},
    target: SearchTarget.OPEN_DOCUMENTS,
    documents: hitsPerDocument.map((count, i) => ({
        tabId: "t" + i,
        name: "doc" + i,
        document: DOCUMENT,
        hits: Array.from({length: count}, (_, row) => ({start: row * 2, end: row * 2 + 1})),
    })),
    hitCount: hitsPerDocument.reduce((a, b) => a + b, 0),
});

describe("SearchResults", () => {
    it("previews a match with bounded context", () => {
        expect(previewMatch("  say hello world", 6, 11)).toEqual({before: "say ", match: "hello", after: " world"});

        const long = "x".repeat(100) + "hit" + "y".repeat(300);
        const preview = previewMatch(long, 100, 103);

        expect(preview.before).toBe("…" + "x".repeat(40));
        expect(preview.match).toBe("hit");
        expect(preview.after).toBe("y".repeat(200) + "…");
    });

    it("marks matches that continue on the next line", () => {
        expect(previewMatch("ab", 1, 3)).toEqual({before: "a", match: "b…", after: ""});
    });

    it("describes a hit with its positions and the line preview", () => {
        const document = createSearchDocument(["one", "two hello", "hello"]);

        expect(describeHit(document, {start: 8, end: 13})).toEqual({start: {row: 1, column: 4}, end: {row: 1, column: 9}, preview: {before: "two ", match: "hello", after: ""}});
        expect(describeHit(document, {start: 14, end: 19})).toEqual({start: {row: 2, column: 0}, end: {row: 2, column: 5}, preview: {before: "", match: "hello", after: ""}});
    });

    it("lists the rows of runs and skips collapsed parts", () => {
        const runs = [run(2, [2, 1]), run(1, [1])];
        const keys = (collapsed: Set<string>) => {
            const rows = createResultRows(runs, collapsed);

            return Array.from({length: rows.length}, (_, index) => rows.at(index)?.key);
        };

        expect(keys(new Set())).toEqual(["2", "2/0", "2/0/0", "2/0/1", "2/1", "2/1/0", "1", "1/0", "1/0/0"]);
        expect(keys(new Set(["2/0", "1"]))).toEqual(["2", "2/0", "2/1", "2/1/0", "1"]);
    });

    it("finds the index of a row by its key", () => {
        const rows = createResultRows([run(2, [2, 1]), run(1, [1])], new Set(["2/1"]));

        expect(rows.indexOf("2")).toBe(0);
        expect(rows.indexOf(hitKey({runId: 2, documentIndex: 0, hitIndex: 1}))).toBe(3);
        expect(rows.indexOf("2/1")).toBe(4);
        expect(rows.indexOf("2/1/0")).toBe(-1);
        expect(rows.indexOf("1/0/0")).toBe(7);
        expect(rows.indexOf("3")).toBe(-1);
        expect(rows.at(9)).toBeUndefined();
    });

    it("steps through the hits of a run across documents and wraps", () => {
        const runs = [run(2, [2, 1]), run(1, [1])];

        expect(findAdjacentHit(runs, undefined, false)).toEqual({runId: 2, documentIndex: 0, hitIndex: 0});
        expect(findAdjacentHit(runs, undefined, true)).toEqual({runId: 2, documentIndex: 1, hitIndex: 0});
        expect(findAdjacentHit(runs, {runId: 2, documentIndex: 0, hitIndex: 1}, false)).toEqual({runId: 2, documentIndex: 1, hitIndex: 0});
        expect(findAdjacentHit(runs, {runId: 2, documentIndex: 1, hitIndex: 0}, false)).toEqual({runId: 2, documentIndex: 0, hitIndex: 0});
        expect(findAdjacentHit(runs, {runId: 1, documentIndex: 0, hitIndex: 0}, true)).toEqual({runId: 1, documentIndex: 0, hitIndex: 0});
        expect(findAdjacentHit([], undefined, false)).toBeUndefined();
    });

    it("gets a hit by its address", () => {
        const runs = [run(2, [2])];

        expect(getHit(runs, {runId: 2, documentIndex: 0, hitIndex: 1})?.hit).toEqual({start: 2, end: 3});
        expect(getHit(runs, {runId: 3, documentIndex: 0, hitIndex: 0})).toBeUndefined();
    });
});
