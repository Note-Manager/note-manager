import {describe, expect, it} from "vitest";
import {findAdjacentRow, groupConsecutiveRows, invertRows, normalizeRows, pickLines, shiftRows, toggleRow} from "../Bookmarks";

const change = (action: "insert" | "remove", startRow: number, startColumn: number, endRow: number, endColumn: number) =>
    ({action: action, start: {row: startRow, column: startColumn}, end: {row: endRow, column: endColumn}});

describe("Bookmarks", () => {
    it("toggles rows and keeps them sorted", () => {
        expect(toggleRow([5, 1], 3)).toEqual([1, 3, 5]);
        expect(toggleRow([1, 3], 3)).toEqual([1]);
    });

    it("finds the next and previous bookmark and wraps", () => {
        expect(findAdjacentRow([2, 8], 2, false)).toBe(8);
        expect(findAdjacentRow([2, 8], 8, false)).toBe(2);
        expect(findAdjacentRow([2, 8], 5, true)).toBe(2);
        expect(findAdjacentRow([2, 8], 2, true)).toBe(8);
        expect(findAdjacentRow([], 0, false)).toBeUndefined();
    });

    it("moves bookmarks when lines are inserted", () => {
        expect(shiftRows([1, 4, 6], change("insert", 4, 3, 6, 0))).toEqual([1, 4, 8]);
        expect(shiftRows([1, 4, 6], change("insert", 4, 0, 5, 0))).toEqual([1, 5, 7]);
        expect(shiftRows([1, 4], change("insert", 4, 2, 4, 5))).toEqual([1, 4]);
    });

    it("moves and merges bookmarks when text is removed", () => {
        expect(shiftRows([1, 4, 5, 9], change("remove", 3, 2, 5, 1))).toEqual([1, 3, 7]);
        expect(shiftRows([1, 4, 5, 9], change("remove", 4, 0, 6, 0))).toEqual([1, 7]);
        expect(shiftRows([1, 4, 6], change("remove", 4, 0, 6, 0))).toEqual([1, 4]);
    });

    it("inverts, picks lines and normalizes stored rows", () => {
        expect(invertRows([0, 2], 4)).toEqual([1, 3]);
        expect(pickLines(["a", "b", "c"], [1], true)).toEqual(["b"]);
        expect(pickLines(["a", "b", "c"], [1], false)).toEqual(["a", "c"]);
        expect(normalizeRows([3, "x", -1, 1.5, 0, 3])).toEqual([0, 3]);
        expect(normalizeRows(undefined)).toEqual([]);
    });

    it("groups consecutive rows into blocks", () => {
        expect(groupConsecutiveRows([0, 1, 2, 5, 7, 8])).toEqual([[0, 2], [5, 5], [7, 8]]);
        expect(groupConsecutiveRows([])).toEqual([]);
    });
});
