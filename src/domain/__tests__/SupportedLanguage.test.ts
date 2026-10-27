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
        expect(findLanguageByFileName("LICENSE").name).toBe(LanguageName.TEXT);
    });

    it("finds newer languages and ignores extension case", () => {
        expect(findLanguageByFileName("index.ts").name).toBe(LanguageName.TYPESCRIPT);
        expect(findLanguageByFileName("App.tsx").name).toBe(LanguageName.TYPESCRIPT);
        expect(findLanguageByFileName("main.py").name).toBe(LanguageName.PYTHON);
        expect(findLanguageByFileName("NOTES.MD").name).toBe(LanguageName.MARKDOWN);
        expect(findLanguageByFileName("run.CMD").name).toBe(LanguageName.BATCH);
    });

    it("finds languages by file name", () => {
        expect(findLanguageByFileName("Dockerfile").name).toBe(LanguageName.DOCKERFILE);
        expect(findLanguageByFileName("C:\\project\\Makefile").name).toBe(LanguageName.MAKEFILE);
        expect(findLanguageByFileName("/home/user/Gemfile").name).toBe(LanguageName.RUBY);
    });

    it("does not map class files to Java", () => {
        expect(findLanguageByFileName("Main.class").name).toBe(LanguageName.TEXT);
    });
});
