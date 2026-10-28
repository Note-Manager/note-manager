import {describe, expect, it} from "vitest";
import {
    addProgress,
    DEFAULT_FOLDER_SEARCH,
    EMPTY_SEARCH_SUMMARY,
    getParentDirectory,
    isExcludedEntry,
    isIncludedFile,
    isSamePath,
    isSearchedFile,
    normalizeFolderSearch,
    parseFileFilters,
    relativePath,
} from "../FindInFiles";

describe("FindInFiles", () => {
    it("parses include and exclude filters", () => {
        const filters = parseFileFilters("*.ts; *.MD !node_modules, !*.min.js");

        expect(isIncludedFile(filters, "app.ts")).toBe(true);
        expect(isIncludedFile(filters, "README.md")).toBe(true);
        expect(isIncludedFile(filters, "app.tsx")).toBe(false);
        expect(isExcludedEntry(filters, "node_modules", true)).toBe(true);
        expect(isExcludedEntry(filters, "lib.min.js", true)).toBe(true);
        expect(isExcludedEntry(filters, "src", true)).toBe(false);
    });

    it("includes every file without include filters or with *.*", () => {
        expect(isIncludedFile(parseFileFilters(""), "Makefile")).toBe(true);
        expect(isIncludedFile(parseFileFilters("*.*"), "Makefile")).toBe(true);
        expect(isIncludedFile(parseFileFilters("note?.txt"), "note1.txt")).toBe(true);
        expect(isIncludedFile(parseFileFilters("note?.txt"), "note10.txt")).toBe(false);
    });

    it("skips hidden entries unless they are included", () => {
        const filters = parseFileFilters("");

        expect(isExcludedEntry(filters, ".git", false)).toBe(true);
        expect(isExcludedEntry(filters, ".git", true)).toBe(false);
    });

    it("finds paths inside a folder on Windows and POSIX", () => {
        expect(relativePath("C:\\Notes", "c:\\notes\\a\\b.txt")).toBe("a/b.txt");
        expect(relativePath("/home/me/notes/", "/home/me/notes/b.txt")).toBe("b.txt");
        expect(relativePath("/home/me/notes", "/home/me/notes2/b.txt")).toBeUndefined();
        expect(relativePath("/home/me/Notes", "/home/me/notes/b.txt")).toBeUndefined();
        expect(relativePath("", "/b.txt")).toBeUndefined();
        expect(isSamePath("C:/Notes/a.txt", "c:\\notes\\A.txt")).toBe(true);
        expect(isSamePath("/notes/a.txt", "/notes/A.txt")).toBe(false);
        expect(getParentDirectory("C:\\Notes\\a.txt")).toBe("C:\\Notes");
        expect(getParentDirectory("/home/a.txt")).toBe("/home");
        expect(getParentDirectory("a.txt")).toBe("");
    });

    it("decides whether an open file is part of a folder search", () => {
        const folder = {...DEFAULT_FOLDER_SEARCH, directory: "/notes", filters: "*.md !drafts"};
        const filters = parseFileFilters(folder.filters);

        expect(isSearchedFile(folder, filters, "/notes/a.md")).toBe(true);
        expect(isSearchedFile(folder, filters, "/notes/sub/a.md")).toBe(true);
        expect(isSearchedFile(folder, filters, "/notes/drafts/a.md")).toBe(false);
        expect(isSearchedFile(folder, filters, "/notes/.hidden/a.md")).toBe(false);
        expect(isSearchedFile(folder, filters, "/notes/a.txt")).toBe(false);
        expect(isSearchedFile({...folder, includeSubfolders: false}, filters, "/notes/sub/a.md")).toBe(false);
        expect(isSearchedFile(folder, filters, "/other/a.md")).toBe(false);
    });

    it("normalizes stored folder searches", () => {
        expect(normalizeFolderSearch(undefined)).toEqual(DEFAULT_FOLDER_SEARCH);
        expect(normalizeFolderSearch({directory: "/a", filters: 5, includeSubfolders: false, includeHidden: "yes"}))
            .toEqual({...DEFAULT_FOLDER_SEARCH, directory: "/a", includeSubfolders: false});
    });

    it("adds progress to the summary", () => {
        const progress = {id: 1, scanned: 3, replaced: 2, replacedFiles: 1, isDone: false, skipped: [{file: "x", reason: "r"}],
            files: [{file: "a", lines: [], lineNumbers: [], hits: [{start: 0, end: 1}, {start: 2, end: 3}]}]};
        const summary = addProgress(addProgress(EMPTY_SEARCH_SUMMARY, progress), {...progress, scanned: 5, isCancelled: true});

        expect(summary).toEqual({scanned: 5, matched: 2, hitCount: 4, replaced: 4, replacedFiles: 2, skipped: progress.skipped.concat(progress.skipped), isCancelled: true, error: undefined});
    });
});
