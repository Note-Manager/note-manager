import {describe, expect, it} from "vitest";
import {appendReplacement} from "../UndoHistory";

describe("UndoHistory", () => {
    it("adds a replacement as one undo group after the existing ones and clears redo", () => {
        const history = {
            $undoStack: [[{action: "insert", start: {row: 0, column: 0}, end: {row: 0, column: 1}, lines: ["a"], id: 4}]],
            $redoStack: [[{action: "insert", start: {row: 0, column: 0}, end: {row: 0, column: 1}, lines: ["b"], id: 5}]],
        };

        const next = appendReplacement(history, {row: 1, column: 2}, "ab\ncd", "x");

        expect(next.$redoStack).toEqual([]);
        expect(next.$undoStack).toHaveLength(2);
        expect(next.$undoStack[1]).toEqual([
            {action: "remove", start: {row: 1, column: 2}, end: {row: 2, column: 2}, lines: ["ab", "cd"], id: 5},
            {action: "insert", start: {row: 1, column: 2}, end: {row: 1, column: 3}, lines: ["x"]},
        ]);
    });

    it("starts a history when there is none", () => {
        expect(appendReplacement(undefined, {row: 0, column: 0}, "a", "b\nc").$undoStack).toEqual([[
            {action: "remove", start: {row: 0, column: 0}, end: {row: 0, column: 1}, lines: ["a"], id: 1},
            {action: "insert", start: {row: 0, column: 0}, end: {row: 1, column: 1}, lines: ["b", "c"]},
        ]]);
    });
});
