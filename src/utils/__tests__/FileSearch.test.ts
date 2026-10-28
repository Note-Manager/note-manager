import {afterEach, beforeEach, describe, expect, it} from "vitest";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import iconv from "iconv-lite";
import {DEFAULT_FOLDER_SEARCH, FileSearchProgress, parseFileFilters, WorkerRequest} from "../../domain/FindInFiles";
import {DEFAULT_SEARCH_OPTIONS} from "../../domain/Search";
import {findInContent, listFiles, replaceInContent, runFileSearch} from "../FileSearch";
import {setAnsiCodePage} from "../EncodingUtils";

const DETECTION = {asciiAsUtf8: true, autodetect: true, ansiCodePage: "windows-1254"};
const QUERY = {...DEFAULT_SEARCH_OPTIONS, text: "alpha"};

let dir: string;

const write = (relative: string, content: string | Buffer) => {
    const file = path.join(dir, relative);

    fs.mkdirSync(path.dirname(file), {recursive: true});
    fs.writeFileSync(file, content);

    return file;
};

const collect = async (folder = {...DEFAULT_FOLDER_SEARCH, directory: dir}) => {
    const files: Array<string> = [];

    for await (const file of listFiles(folder, parseFileFilters(folder.filters), () => false)) files.push(path.relative(dir, file).replace(/\\/g, "/"));

    return files;
};

const run = async (changes: Partial<WorkerRequest> = {}) => {
    const events: Array<FileSearchProgress> = [];

    await runFileSearch({id: 7, folder: {...DEFAULT_FOLDER_SEARCH, directory: dir}, query: QUERY, skipFiles: [], detection: DETECTION, ...changes}, p => events.push(p), () => false);

    return events;
};

beforeEach(() => {
    setAnsiCodePage(DETECTION.ansiCodePage);
    dir = fs.mkdtempSync(path.join(os.tmpdir(), "note-manager-search-"));
});

afterEach(() => {
    fs.rmSync(dir, {recursive: true, force: true});
});

describe("FileSearch", () => {
    it("lists files with filters, subfolders and hidden entries", async () => {
        write("b.txt", "");
        write("a.md", "");
        write("sub/c.txt", "");
        write("node_modules/d.txt", "");
        write(".git/e.txt", "");
        write(".env", "");

        expect(await collect()).toEqual(["a.md", "b.txt", "node_modules/d.txt", "sub/c.txt"]);
        expect(await collect({...DEFAULT_FOLDER_SEARCH, directory: dir, filters: "*.txt !node_modules"})).toEqual(["b.txt", "sub/c.txt"]);
        expect(await collect({...DEFAULT_FOLDER_SEARCH, directory: dir, includeSubfolders: false})).toEqual(["a.md", "b.txt"]);
        expect(await collect({...DEFAULT_FOLDER_SEARCH, directory: dir, includeHidden: true})).toEqual([".env", "a.md", "b.txt", ".git/e.txt", "node_modules/d.txt", "sub/c.txt"]);
    });

    it("finds matches in decoded text and skips binary files", () => {
        const matches = findInContent("f", iconv.encode("x\r\nçalpha alpha\r\ny", "windows-1254"), {...QUERY, text: "çalpha"}, DETECTION);

        expect(matches).toEqual({file: "f", lines: ["çalpha alpha"], lineNumbers: [1], hits: [{start: 0, end: 6}]});
        expect(findInContent("f", Buffer.from([0x61, 0x6c, 0x70, 0x68, 0x61, 0x00]), QUERY, DETECTION)).toBeUndefined();
        expect(findInContent("f", Buffer.from("nothing"), QUERY, DETECTION)).toBeUndefined();
    });

    it("replaces and keeps the encoding and line endings", () => {
        const original = iconv.encode("şalpha\r\nalpha", "windows-1254");
        const replaced = replaceInContent(original, QUERY, "ğ", DETECTION);

        expect(replaced && "bytes" in replaced && replaced.count).toBe(2);
        expect(replaced && "bytes" in replaced && iconv.decode(replaced.bytes, "windows-1254")).toBe("şğ\r\nğ");
        expect(replaceInContent(original, QUERY, "Ж", DETECTION)).toEqual({reason: "The replacement has characters that ANSI cannot hold"});
        expect(replaceInContent(Buffer.from("none"), QUERY, "x", DETECTION)).toBeUndefined();
    });

    it("streams matches and finishes", async () => {
        write("a.txt", "alpha\nbeta");
        write("b.txt", "beta");
        write("sub/c.txt", "alpha alpha");

        const events = await run({skipFiles: [path.join(dir, "a.txt")]});
        const last = events[events.length - 1];

        expect(last).toMatchObject({id: 7, scanned: 2, isDone: true, isCancelled: false});
        expect(events.flatMap(e => e.files).map(f => [path.basename(f.file), f.hits.length])).toEqual([["c.txt", 2]]);
    });

    it("replaces in files and reports skipped ones", async () => {
        const plain = write("a.txt", "alpha\r\nalpha\r\n");
        const ansi = write("b.txt", iconv.encode("ş alpha", "windows-1254"));

        const events = await run({replacement: "Ж"});

        expect(fs.readFileSync(plain, "utf8")).toBe("Ж\r\nЖ\r\n");
        expect(iconv.decode(fs.readFileSync(ansi), "windows-1254")).toBe("ş alpha");
        expect(events.reduce((sum, e) => sum + e.replaced, 0)).toBe(2);
        expect(events.flatMap(e => e.skipped).map(s => path.basename(s.file))).toEqual(["b.txt"]);
    });

    it("stops when cancelled", async () => {
        write("a.txt", "alpha");

        const events: Array<FileSearchProgress> = [];

        await runFileSearch({id: 1, folder: {...DEFAULT_FOLDER_SEARCH, directory: dir}, query: QUERY, skipFiles: [], detection: DETECTION}, p => events.push(p), () => true);

        expect(events).toEqual([expect.objectContaining({scanned: 0, isDone: true, isCancelled: true})]);
    });
});
