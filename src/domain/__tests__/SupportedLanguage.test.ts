import {describe, expect, it} from "vitest";
import {findLanguageByFileName, groupLanguagesByInitial, LanguageName, SupportedLanguage, SupportedLanguages} from "../SupportedLanguage";

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

describe("groupLanguagesByInitial", () => {
    const languageNamed = (label: string): SupportedLanguage => ({name: label.toLowerCase(), label: label, extensions: []});

    it("sorts languages by label and groups them by their first letter", () => {
        const groups = groupLanguagesByInitial(["Go", "CSS", "batch", "C#", "Java", "JSON", "Rust"].map(languageNamed));

        expect(groups.map(g => [g.initial, g.languages.map(l => l.label)])).toEqual([
            ["B", ["batch"]],
            ["C", ["C#", "CSS"]],
            ["G", ["Go"]],
            ["J", ["Java", "JSON"]],
            ["R", ["Rust"]]
        ]);
    });

    it("puts every supported language in exactly one group", () => {
        const languages = Object.values(SupportedLanguages);
        const grouped = groupLanguagesByInitial(languages).flatMap(g => g.languages);

        expect(grouped).toHaveLength(languages.length);
        expect(new Set(grouped)).toEqual(new Set(languages));
    });
});
