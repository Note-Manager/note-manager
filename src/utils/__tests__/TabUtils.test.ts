import {describe, expect, it} from "vitest";
import {applySavedFile} from "../TabUtils";
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
