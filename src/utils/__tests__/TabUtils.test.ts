import {describe, expect, it} from "vitest";
import {applySavedFile, createEmptyTab, generateUniqueName, moveTab} from "../TabUtils";
import {EolType} from "../../domain/Encoding";
import {LanguageName, SupportedLanguages} from "../../domain/SupportedLanguage";
import {EditorTab} from "../../domain/EditorTab";

describe("applySavedFile", () => {
    it("detects the language of a new tab saved with a known extension", () => {
        const tab: EditorTab = {name: "new 1", isTemp: true};

        applySavedFile(tab, "C:\\notes\\page.html");

        expect(tab.language).toBe(SupportedLanguages[LanguageName.HTML]);
        expect(tab.file).toBe("C:\\notes\\page.html");
        expect(tab.name).toBe("page.html");
        expect(tab.displayName).toBe("page.html");
        expect(tab.isTemp).toBe(false);
    });

    it("replaces the language chosen before saving when the extension is known", () => {
        const tab: EditorTab = {name: "new 1.json", isTemp: true, language: SupportedLanguages[LanguageName.JSON]};

        applySavedFile(tab, "/home/me/page.html");

        expect(tab.language).toBe(SupportedLanguages[LanguageName.HTML]);
    });

    it("keeps the chosen language when the extension is unknown", () => {
        const tab: EditorTab = {name: "new 1", isTemp: true, language: SupportedLanguages[LanguageName.JSON]};

        applySavedFile(tab, "/home/me/data.unknownext");

        expect(tab.language).toBe(SupportedLanguages[LanguageName.JSON]);
    });

    it("falls back to text when no language is set and the extension is unknown", () => {
        const tab: EditorTab = {name: "new 1", isTemp: true};

        applySavedFile(tab, "/home/me/notes");

        expect(tab.language).toBe(SupportedLanguages[LanguageName.TEXT]);
    });

    it("shortens long file names for display", () => {
        const tab: EditorTab = {name: "new 1", isTemp: true};

        applySavedFile(tab, "/home/me/" + "a".repeat(40) + ".md");

        expect(tab.displayName).toBe("a".repeat(25) + "...");
    });
});

describe("moveTab", () => {
    const tabs = (...ids: Array<string>): Array<EditorTab> => ids.map(id => ({id: id, isPinned: id.startsWith("p")}));
    const ids = (list: Array<EditorTab>) => list.map(t => t.id);

    it("moves a tab before the target", () => {
        expect(ids(moveTab(tabs("a", "b", "c"), "c", "a", false))).toEqual(["c", "a", "b"]);
    });

    it("moves a tab after the target", () => {
        expect(ids(moveTab(tabs("a", "b", "c"), "a", "b", true))).toEqual(["b", "a", "c"]);
        expect(ids(moveTab(tabs("a", "b", "c"), "a", "c", true))).toEqual(["b", "c", "a"]);
    });

    it("returns the same list when nothing moves", () => {
        const list = tabs("a", "b");

        expect(moveTab(list, "a", "a", true)).toBe(list);
        expect(moveTab(list, "x", "a", true)).toBe(list);
        expect(moveTab(list, "a", "x", true)).toBe(list);
    });

    it("keeps pinned tabs before unpinned tabs", () => {
        expect(ids(moveTab(tabs("p1", "p2", "a", "b"), "b", "p1", false))).toEqual(["p1", "p2", "b", "a"]);
        expect(ids(moveTab(tabs("p1", "p2", "a", "b"), "p1", "b", true))).toEqual(["p2", "p1", "a", "b"]);
        expect(ids(moveTab(tabs("p1", "p2", "a"), "p2", "p1", false))).toEqual(["p2", "p1", "a"]);
    });
});

describe("createEmptyTab", () => {
    it("creates a temporary text tab with a shortened display name", () => {
        const tab = createEmptyTab("A very long document name for testing.txt", "utf-8", EolType.LF);

        expect(tab.isTemp).toBe(true);
        expect(tab.content).toBe("");
        expect(tab.language).toBe(SupportedLanguages[LanguageName.TEXT]);
        expect(tab.displayName).toBe("A very long document name...");
    });
});

describe("generateUniqueName", () => {
    it("adds a counter until the name is free", () => {
        const tabs: Array<EditorTab> = [{name: "a.txt"}, {name: "a.txt (1)"}];

        expect(generateUniqueName(tabs, "a.txt")).toBe("a.txt (2)");
        expect(generateUniqueName(tabs, "b.txt")).toBe("b.txt");
    });
});
