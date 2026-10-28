import {SearchQuery, SearchTarget} from "../domain/Search";
import {offsetToPosition, readLine, SearchDocument, TextPosition, TextSpan} from "./TextSearch";

export interface MatchPreview {
    before: string,
    match: string,
    after: string,
}

export interface HitDetails {
    start: TextPosition,
    end: TextPosition,
    preview: MatchPreview,
}

export interface DocumentHits {
    tabId: string,
    name: string,
    file?: string,
    document: SearchDocument,
    hits: Array<TextSpan>,
}

export interface SearchRun {
    id: number,
    query: SearchQuery,
    target: SearchTarget,
    documents: Array<DocumentHits>,
    hitCount: number,
}

export interface HitAddress {
    runId: number,
    documentIndex: number,
    hitIndex: number,
}

export type ResultRow =
    {kind: "run", key: string, run: SearchRun} |
    {kind: "document", key: string, run: SearchRun, document: DocumentHits} |
    {kind: "hit", key: string, run: SearchRun, document: DocumentHits, hit: TextSpan, address: HitAddress};

export interface ResultRows {
    length: number,
    at: (index: number) => ResultRow | undefined,
    indexOf: (key: string) => number,
}

interface RowBlock {
    start: number,
    run: SearchRun,
    documentIndex?: number,
    size: number,
}

const CONTEXT_BEFORE = 40;
const CONTEXT_AFTER = 200;
const MATCH_LENGTH = 200;
const ELLIPSIS = "…";

export function previewMatch(line: string, start: number, end: number): MatchPreview {
    const matchEnd = Math.min(end, line.length, start + MATCH_LENGTH);
    const beforeStart = Math.max(0, start - CONTEXT_BEFORE);
    const afterEnd = Math.min(line.length, matchEnd + CONTEXT_AFTER);

    return {
        before: (beforeStart > 0 ? ELLIPSIS : "") + line.substring(beforeStart, start).trimStart(),
        match: line.substring(start, matchEnd) + (end > matchEnd ? ELLIPSIS : ""),
        after: line.substring(matchEnd, afterEnd) + (afterEnd < line.length ? ELLIPSIS : ""),
    };
}

export function describeHit(document: SearchDocument, hit: TextSpan): HitDetails {
    const start = offsetToPosition(document.lineStarts, hit.start);
    const end = offsetToPosition(document.lineStarts, hit.end);
    const line = readLine(document, start.row);

    return {start: start, end: end, preview: previewMatch(line, start.column, end.row === start.row ? end.column : line.length + 1)};
}

export function documentKey(runId: number, documentIndex: number): string {
    return `${runId}/${documentIndex}`;
}

export function hitKey(address: HitAddress): string {
    return `${documentKey(address.runId, address.documentIndex)}/${address.hitIndex}`;
}

export function createResultRows(runs: Array<SearchRun>, collapsed: Set<string>): ResultRows {
    const blocks: Array<RowBlock> = [];
    let length = 0;

    const addBlock = (run: SearchRun, size: number, documentIndex?: number) => {
        blocks.push({start: length, run: run, documentIndex: documentIndex, size: size});
        length += size;
    };

    runs.forEach(run => {
        addBlock(run, 1);

        if (collapsed.has(String(run.id))) return;

        run.documents.forEach((document, documentIndex) => addBlock(run, collapsed.has(documentKey(run.id, documentIndex)) ? 1 : 1 + document.hits.length, documentIndex));
    });

    const at = (index: number): ResultRow | undefined => {
        if (index < 0 || index >= length) return undefined;

        const block = blocks[findBlock(blocks, index)];
        const {run, documentIndex} = block;

        if (documentIndex === undefined) return {kind: "run", key: String(run.id), run: run};

        const document = run.documents[documentIndex];
        const hitIndex = index - block.start - 1;

        if (hitIndex < 0) return {kind: "document", key: documentKey(run.id, documentIndex), run: run, document: document};

        const address = {runId: run.id, documentIndex: documentIndex, hitIndex: hitIndex};

        return {kind: "hit", key: hitKey(address), run: run, document: document, hit: document.hits[hitIndex], address: address};
    };

    const indexOf = (key: string): number => {
        const [runId, documentIndex, hitIndex] = key.split("/").map(Number);
        const block = blocks.find(b => b.run.id === runId && b.documentIndex === (Number.isNaN(documentIndex) ? undefined : documentIndex));

        if (!block) return -1;
        if (hitIndex === undefined || Number.isNaN(hitIndex)) return block.start;

        return hitIndex + 1 < block.size ? block.start + 1 + hitIndex : -1;
    };

    return {length: length, at: at, indexOf: indexOf};
}

export function findAdjacentHit(runs: Array<SearchRun>, current: HitAddress | undefined, isBackwards: boolean): HitAddress | undefined {
    const run = runs.find(r => r.id === current?.runId) ?? runs[0];

    if (!run || run.hitCount === 0) return undefined;

    const ordinal = current?.runId === run.id ? toOrdinal(run, current) : -1;
    const next = ordinal < 0 ? (isBackwards ? run.hitCount - 1 : 0) : (ordinal + (isBackwards ? -1 : 1) + run.hitCount) % run.hitCount;

    return fromOrdinal(run, next);
}

export function getHit(runs: Array<SearchRun>, address: HitAddress): {document: DocumentHits, hit: TextSpan} | undefined {
    const document = runs.find(r => r.id === address.runId)?.documents[address.documentIndex];
    const hit = document?.hits[address.hitIndex];

    return document && hit ? {document: document, hit: hit} : undefined;
}

function findBlock(blocks: Array<RowBlock>, index: number): number {
    let low = 0;
    let high = blocks.length - 1;

    while (low < high) {
        const middle = Math.ceil((low + high) / 2);

        if (blocks[middle].start <= index) low = middle;
        else high = middle - 1;
    }

    return low;
}

function toOrdinal(run: SearchRun, address: HitAddress): number {
    return run.documents.slice(0, address.documentIndex).reduce((count, document) => count + document.hits.length, address.hitIndex);
}

function fromOrdinal(run: SearchRun, ordinal: number): HitAddress {
    let remaining = ordinal;
    let documentIndex = 0;

    while (remaining >= run.documents[documentIndex].hits.length) remaining -= run.documents[documentIndex++].hits.length;

    return {runId: run.id, documentIndex: documentIndex, hitIndex: remaining};
}
