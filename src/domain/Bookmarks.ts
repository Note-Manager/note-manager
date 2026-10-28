export interface LineChange {
    action: "insert" | "remove",
    start: {row: number, column: number},
    end: {row: number, column: number},
}

export function toggleRow(rows: Array<number>, row: number): Array<number> {
    return rows.includes(row) ? rows.filter(r => r !== row) : sortRows([...rows, row]);
}

export function findAdjacentRow(rows: Array<number>, current: number, isBackwards: boolean): number | undefined {
    if (rows.length === 0) return undefined;

    if (isBackwards) return [...rows].reverse().find(row => row < current) ?? rows[rows.length - 1];

    return rows.find(row => row > current) ?? rows[0];
}

export function shiftRows(rows: Array<number>, change: LineChange): Array<number> {
    const {start, end} = change;
    const lineCount = end.row - start.row;

    if (lineCount === 0 || rows.length === 0) return rows;

    if (change.action === "insert") return rows.map(row => row > start.row || (row === start.row && start.column === 0) ? row + lineCount : row);

    const removesWholeLines = start.column === 0 && end.column === 0;

    return sortRows(rows.flatMap(row => {
        if (row > end.row || (removesWholeLines && row === end.row)) return [row - lineCount];
        if (row < start.row || (!removesWholeLines && row === start.row)) return [row];

        return removesWholeLines ? [] : [start.row];
    }));
}

export function invertRows(rows: Array<number>, lineCount: number): Array<number> {
    const marked = new Set(rows);

    return Array.from({length: lineCount}, (_, row) => row).filter(row => !marked.has(row));
}

export function pickLines(lines: Array<string>, rows: Array<number>, isMarked: boolean): Array<string> {
    const marked = new Set(rows);

    return lines.filter((line, row) => marked.has(row) === isMarked);
}

export function groupConsecutiveRows(rows: Array<number>): Array<[number, number]> {
    return rows.reduce<Array<[number, number]>>((blocks, row) => {
        const last = blocks[blocks.length - 1];

        if (last && last[1] === row - 1) last[1] = row;
        else blocks.push([row, row]);

        return blocks;
    }, []);
}

export function normalizeRows(raw: unknown): Array<number> {
    return Array.isArray(raw) ? sortRows(raw.filter((row): row is number => Number.isInteger(row) && row >= 0)) : [];
}

function sortRows(rows: Array<number>): Array<number> {
    return [...new Set(rows)].sort((a, b) => a - b);
}
