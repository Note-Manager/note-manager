import {describe, expect, it} from "vitest";
import {findLanguageByFileName, LanguageName} from "../SupportedLanguage";

describe("findLanguageByFileName", () => {
    it("finds the language by extension", () => {
        expect(findLanguageByFileName("data.json").name).toBe(LanguageName.JSON);
        expect(findLanguageByFileName("page.xsd").name).toBe(LanguageName.XML);
        expect(findLanguageByFileName("README.md").name).toBe(LanguageName.MARKDOWN);
    });

    it("falls back to text", () => {
        expect(findLanguageByFileName(undefined).name).toBe(LanguageName.TEXT);
        expect(findLanguageByFileName("file.unknown").name).toBe(LanguageName.TEXT);
        expect(findLanguageByFileName("Makefile").name).toBe(LanguageName.TEXT);
    });
});
