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
    const labelsOf = (languages: Array<SupportedLanguage>) => languages.map(l => l.label);

    it("sorts languages by label and groups whole initials into ranges covering the alphabet", () => {
        const groups = groupLanguagesByInitial(["Go", "batch", "CSS", "C#", "Java", "JSON", "Rust", "YAML"].map(languageNamed), 3);

        expect(groups.map(g => g.label)).toEqual(["A \u2013 C", "D \u2013 J", "K \u2013 Z"]);
        expect(groups.map(g => labelsOf(g.languages))).toEqual([["batch", "C#", "CSS"], ["Go", "Java", "JSON"], ["Rust", "YAML"]]);
    });

    it("keeps an initial larger than the group size together", () => {
        const groups = groupLanguagesByInitial(["Perl", "PHP", "Python", "Ruby"].map(languageNamed), 2);

        expect(groups.map(g => labelsOf(g.languages))).toEqual([["Perl", "PHP", "Python"], ["Ruby"]]);
        expect(groups.map(g => g.label)).toEqual(["A \u2013 P", "Q \u2013 Z"]);
    });

    it("labels a single group as the whole alphabet and a one-letter range as that letter", () => {
        expect(groupLanguagesByInitial([languageNamed("Go")], 5).map(g => g.label)).toEqual(["A \u2013 Z"]);
        expect(groupLanguagesByInitial(["Ada", "Bash", "Zig"].map(languageNamed), 1).map(g => g.label)).toEqual(["A", "B", "C \u2013 Z"]);
    });

    it("puts every supported language in exactly one group", () => {
        const languages = Object.values(SupportedLanguages);
        const grouped = groupLanguagesByInitial(languages, 7).flatMap(g => g.languages);

        expect(grouped).toHaveLength(languages.length);
        expect(new Set(grouped)).toEqual(new Set(languages));
    });
});
