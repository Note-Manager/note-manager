import {splitLines, TextPosition} from "./TextSearch";

interface UndoDelta {
    action: "insert" | "remove",
    start: TextPosition,
    end: TextPosition,
    lines: Array<string>,
    id?: number,
}

export interface UndoHistory {
    $undoStack: Array<Array<UndoDelta>>,
    $redoStack: Array<Array<UndoDelta>>,
}

export function appendReplacement(history: unknown, start: TextPosition, removed: string, inserted: string): UndoHistory {
    const undoStack = readUndoStack(history);
    const [removal, insertion] = createReplacementDeltas(start, removed, inserted);
    const id = undoStack.flat().reduce((max, delta) => Math.max(max, delta.id ?? 0), 0) + 1;

    return {
        $undoStack: [...undoStack, [{...removal, id: id}, insertion]],
        $redoStack: [],
    };
}

export function createReplacementDeltas(start: TextPosition, removed: string, inserted: string): [UndoDelta, UndoDelta] {
    const removedLines = splitLines(removed);
    const insertedLines = splitLines(inserted);

    return [
        {action: "remove", start: start, end: endOf(start, removedLines), lines: removedLines},
        {action: "insert", start: start, end: endOf(start, insertedLines), lines: insertedLines},
    ];
}

function readUndoStack(history: unknown): Array<Array<UndoDelta>> {
    const stack = (history as Partial<UndoHistory> | undefined)?.$undoStack;

    return Array.isArray(stack) ? stack : [];
}

function endOf(start: TextPosition, lines: Array<string>): TextPosition {
    const lastLine = lines[lines.length - 1];

    return lines.length === 1
        ? {row: start.row, column: start.column + lastLine.length}
        : {row: start.row + lines.length - 1, column: lastLine.length};
}
