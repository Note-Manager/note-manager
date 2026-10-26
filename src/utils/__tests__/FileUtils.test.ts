import {afterEach, beforeEach, describe, expect, it, vi} from "vitest";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

vi.mock("electron", () => ({
    default: {app: {isPackaged: false}},
    app: {getPath: () => os.tmpdir(), isPackaged: false},
}));

import {backupFile, getFileSize, isBinaryFile, readFileAsync, writeFileAtomic} from "../FileUtils";

let dir: string;

beforeEach(() => {
    dir = fs.mkdtempSync(path.join(os.tmpdir(), "note-manager-"));
});

afterEach(() => {
    fs.rmSync(dir, {recursive: true, force: true});
});

describe("FileUtils", () => {
    it("writes atomically and leaves no temp file", () => {
        const file = path.join(dir, "state.json");

        writeFileAtomic(file, "first");
        writeFileAtomic(file, "second");

        expect(fs.readFileSync(file, "utf8")).toBe("second");
        expect(fs.readdirSync(dir)).toEqual(["state.json"]);
    });

    it("backs up an existing file", () => {
        const file = path.join(dir, "State.json");
        fs.writeFileSync(file, "{broken");

        backupFile(file, "corrupt");
        backupFile(path.join(dir, "missing.json"), "corrupt");

        expect(fs.readFileSync(file + ".corrupt", "utf8")).toBe("{broken");
        expect(fs.existsSync(path.join(dir, "missing.json.corrupt"))).toBe(false);
    });

    it("reads files and their size asynchronously", async () => {
        const file = path.join(dir, "note.txt");
        fs.writeFileSync(file, "merhaba dünya");

        expect(await readFileAsync(file)).toBe("merhaba dünya");
        expect(await getFileSize(file)).toBe(Buffer.byteLength("merhaba dünya"));
    });

    it("detects binary files", async () => {
        const text = path.join(dir, "note.txt");
        const binary = path.join(dir, "image.bin");
        fs.writeFileSync(text, "plain text ğüşiöç");
        fs.writeFileSync(binary, Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x00, 0x01]));

        expect(await isBinaryFile(text)).toBe(false);
        expect(await isBinaryFile(binary)).toBe(true);
    });
});
