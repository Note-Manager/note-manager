import fs from "node:fs";
import path from "node:path";
import {
    DetectionSettings,
    FileFilters,
    FileMatches,
    FileSearchProgress,
    FolderSearch,
    isExcludedEntry,
    isIncludedFile,
    parseFileFilters,
    WorkerRequest,
} from "../domain/FindInFiles";
import {SearchQuery} from "../domain/Search";
import {EolType, getEncodingLabel} from "../domain/Encoding";
import {decodeText, encodeText, findUnencodableCharacters, isBinaryContent, setAnsiCodePage} from "./EncodingUtils";
import {createSearchDocument, replaceMatches, SearchResult, searchText, splitLines} from "./TextSearch";
import {compactHits} from "./SearchResults";

type Batch = Pick<FileSearchProgress, "files" | "replaced" | "replacedFiles" | "skipped">;

const FLUSH_INTERVAL = 100;
const FLUSH_SIZE = 200;
const IGNORE_CASE = process.platform === "win32" || process.platform === "darwin";

export async function* listFiles(folder: FolderSearch, filters: FileFilters, isCancelled: () => boolean): AsyncGenerator<string> {
    const pending = [folder.directory];

    while (pending.length > 0 && !isCancelled()) {
        const directory = pending.pop() as string;
        const entries = await fs.promises.readdir(directory, {withFileTypes: true}).catch(() => []);
        const subfolders: Array<string> = [];

        for (const entry of entries.sort((a, b) => a.name.localeCompare(b.name))) {
            if (isExcludedEntry(filters, entry.name, folder.includeHidden)) continue;

            const fullPath = path.join(directory, entry.name);

            if (entry.isDirectory()) {
                if (folder.includeSubfolders) subfolders.push(fullPath);
            } else if (entry.isFile() && isIncludedFile(filters, entry.name)) {
                yield fullPath;
            }
        }

        pending.push(...subfolders.reverse());
    }
}

export function findInContent(file: string, bytes: Uint8Array, query: SearchQuery, detection: DetectionSettings): FileMatches | undefined {
    const result = searchContent(bytes, query, detection)?.result;

    if (!result || result.matches.length === 0) return undefined;

    return {file: file, ...compactHits(result.document, result.matches)};
}

export function replaceInContent(bytes: Uint8Array, query: SearchQuery, template: string, detection: DetectionSettings): {bytes: Buffer, count: number} | {reason: string} | undefined {
    const searched = searchContent(bytes, query, detection);
    const result = searched?.result;
    const replaced = result?.regex && replaceMatches(result.document.text, result.regex, result.matches, template, query.mode);

    if (!searched || !result || !replaced) return undefined;

    const {encoding, eol} = searched;

    if (findUnencodableCharacters(replaced.text, encoding).count > 0) return {reason: `The replacement has characters that ${getEncodingLabel(encoding)} cannot hold`};

    const text = result.document.text;

    return {bytes: encodeText(text.substring(0, replaced.start) + replaced.text + text.substring(replaced.end), encoding, eol), count: result.matches.length};
}

export async function runFileSearch(request: WorkerRequest, emit: (progress: FileSearchProgress) => void, isCancelled: () => boolean) {
    setAnsiCodePage(request.detection.ansiCodePage);

    const skipFiles = new Set(request.skipFiles.map(toFileKey));
    let batch = emptyBatch();
    let scanned = 0;
    let lastFlush = Date.now();

    const flush = (isDone: boolean, error?: string) => {
        emit({id: request.id, ...batch, scanned: scanned, isDone: isDone, isCancelled: isCancelled(), error: error});
        batch = emptyBatch();
        lastFlush = Date.now();
    };

    try {
        for await (const file of listFiles(request.folder, parseFileFilters(request.folder.filters), isCancelled)) {
            if (isCancelled()) break;
            if (skipFiles.has(toFileKey(file))) continue;

            scanned++;
            await processFile(request, file, batch);

            if (batch.files.length >= FLUSH_SIZE || Date.now() - lastFlush >= FLUSH_INTERVAL) flush(false);
        }

        flush(true);
    } catch (error) {
        flush(true, error instanceof Error ? error.message : String(error));
    }
}

async function processFile(request: WorkerRequest, file: string, batch: Batch) {
    const skip = (reason: string) => batch.skipped.push({file: file, reason: reason});

    try {
        const bytes = await fs.promises.readFile(file);

        if (request.replacement === undefined) {
            const matches = findInContent(file, bytes, request.query, request.detection);

            if (matches) batch.files.push(matches);
            return;
        }

        const replaced = replaceInContent(bytes, request.query, request.replacement, request.detection);

        if (!replaced) return;
        if ("reason" in replaced) return skip(replaced.reason);

        await fs.promises.writeFile(file, replaced.bytes);
        batch.replaced += replaced.count;
        batch.replacedFiles++;
    } catch (error) {
        skip(error instanceof Error ? error.message : String(error));
    }
}

function searchContent(bytes: Uint8Array, query: SearchQuery, detection: DetectionSettings): {result: SearchResult, encoding: string, eol: EolType} | undefined {
    if (isBinaryContent(bytes)) return undefined;

    const decoded = decodeText(bytes, detection);

    return {result: searchText(createSearchDocument(splitLines(decoded.content)), query), encoding: decoded.encoding, eol: decoded.eol};
}

function emptyBatch(): Batch {
    return {files: [], replaced: 0, replacedFiles: 0, skipped: []};
}

function toFileKey(file: string): string {
    const resolved = path.resolve(file);

    return IGNORE_CASE ? resolved.toLowerCase() : resolved;
}
