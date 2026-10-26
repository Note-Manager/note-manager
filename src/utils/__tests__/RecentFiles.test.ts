import {afterEach, beforeEach, describe, expect, it, vi} from "vitest";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import * as RecentFiles from "../RecentFiles";

const paths = vi.hoisted(() => ({stateFile: ""}));

vi.mock("electron", () => ({
    default: {app: {isPackaged: false}},
    app: {getPath: () => os.tmpdir(), isPackaged: false},
}));

vi.mock("../EnvironmentUtils", () => ({
    getStateFilePath: () => paths.stateFile,
}));

let dir: string;

async function loadModule(): Promise<typeof RecentFiles> {
    vi.resetModules();
    return await vi.importActual("../RecentFiles");
}

beforeEach(() => {
    dir = fs.mkdtempSync(path.join(os.tmpdir(), "note-manager-recent-"));
    paths.stateFile = path.join(dir, "State.json");
});

afterEach(() => {
    fs.rmSync(dir, {recursive: true, force: true});
});

describe("RecentFiles", () => {
    it("adds files to the top without duplicates and persists them", async () => {
        const recent = await loadModule();

        recent.addRecentFile("/a.txt");
        recent.addRecentFile("/b.txt");
        recent.addRecentFile("/a.txt");

        expect(recent.getRecentFiles()).toEqual(["/a.txt", "/b.txt"]);

        const reloaded = await loadModule();
        expect(reloaded.getRecentFiles()).toEqual(["/a.txt", "/b.txt"]);
    });

    it("keeps at most MAX_RECENT_FILES entries", async () => {
        const recent = await loadModule();

        for (let i = 0; i < recent.MAX_RECENT_FILES + 5; i++) recent.addRecentFile(`/f${i}.txt`);

        const files = recent.getRecentFiles();
        expect(files.length).toBe(recent.MAX_RECENT_FILES);
        expect(files[0]).toBe(`/f${recent.MAX_RECENT_FILES + 4}.txt`);
    });

    it("notifies listeners only when the list changes", async () => {
        const recent = await loadModule();
        const listener = vi.fn();
        recent.onRecentFilesChanged(listener);

        recent.addRecentFile("/a.txt");
        recent.addRecentFile("/a.txt");
        recent.removeRecentFile("/missing.txt");
        recent.removeRecentFile("/a.txt");
        recent.clearRecentFiles();

        expect(listener).toHaveBeenCalledTimes(2);
        expect(recent.getRecentFiles()).toEqual([]);
    });

    it("ignores a corrupt file", async () => {
        fs.writeFileSync(path.join(dir, "RecentFiles.json"), "{not json");

        const recent = await loadModule();

        expect(recent.getRecentFiles()).toEqual([]);
        recent.addRecentFile("/a.txt");
        expect(JSON.parse(fs.readFileSync(path.join(dir, "RecentFiles.json"), "utf-8"))).toEqual(["/a.txt"]);
    });
});
