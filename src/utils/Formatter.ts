import xmlFormat from "xml-formatter";
import {format as sqlFormat} from "sql-formatter";
import type {Options, Plugin} from "prettier";
import {LanguageName} from "../domain/SupportedLanguage";

const INDENTATION = 4;

type PrettierSetup = {parser: string, loadPlugins: () => Promise<Array<Plugin>>, options?: Options};

const PRETTIER_LANGUAGES: Partial<Record<LanguageName, PrettierSetup>> = {
    [LanguageName.JAVASCRIPT]: {
        parser: "babel",
        loadPlugins: async () => [await import("prettier/plugins/babel"), await import("prettier/plugins/estree") as Plugin],
    },
    [LanguageName.TYPESCRIPT]: {
        parser: "typescript",
        loadPlugins: async () => [await import("prettier/plugins/typescript"), await import("prettier/plugins/estree") as Plugin],
    },
    [LanguageName.CSS]: {
        parser: "css",
        loadPlugins: async () => [await import("prettier/plugins/postcss")],
    },
    [LanguageName.YAML]: {
        parser: "yaml",
        loadPlugins: async () => [await import("prettier/plugins/yaml")],
        options: {tabWidth: 2},
    },
    [LanguageName.MARKDOWN]: {
        parser: "markdown",
        loadPlugins: async () => [await import("prettier/plugins/markdown")],
        options: {proseWrap: "preserve"},
    },
    [LanguageName.JAVA]: {
        parser: "java",
        loadPlugins: async () => [(await import("prettier-plugin-java")).default as Plugin],
    },
};

export function isFormattable(language: LanguageName): boolean {
    return [LanguageName.XML, LanguageName.HTML, LanguageName.JSON, LanguageName.SQL, LanguageName.PLSQL].includes(language)
        || language in PRETTIER_LANGUAGES;
}

export async function formatCode(language: LanguageName, content: string): Promise<string> {
    if (!content.trim()) return content;

    const lineBreak = content.includes("\r\n") ? "\r\n" : "\n";

    try {
        const formatted = await formatWithLineFeeds(language, content.replace(/\r\n/g, "\n"));

        const result = /\n$/.test(content) || !formatted.endsWith("\n") ? formatted : formatted.replace(/\n+$/, "");

        return lineBreak === "\n" ? result : result.replace(/\n/g, lineBreak);
    } catch (err) {
        console.warn("cannot format content: " + err);
        return content;
    }
}

async function formatWithLineFeeds(language: LanguageName, content: string): Promise<string> {
    switch (language) {
        case LanguageName.XML:
        case LanguageName.HTML:
            return xmlFormat(content, {lineSeparator: "\n", strictMode: false, collapseContent: true, indentation: " ".repeat(INDENTATION)});
        case LanguageName.JSON:
            return JSON.stringify(JSON.parse(content), null, INDENTATION);
        case LanguageName.SQL:
        case LanguageName.PLSQL:
            return sqlFormat(content, {
                dataTypeCase: "preserve",
                keywordCase: "preserve",
                functionCase: "preserve",
                identifierCase: "preserve",
                language: language === LanguageName.PLSQL ? "plsql" : "sql",
                useTabs: false,
                tabWidth: INDENTATION
            });
    }

    const setup = PRETTIER_LANGUAGES[language];

    if (!setup) return content;

    const prettier = await import("prettier/standalone");

    return prettier.format(content, {
        parser: setup.parser,
        plugins: await setup.loadPlugins(),
        tabWidth: INDENTATION,
        printWidth: 120,
        endOfLine: "lf",
        ...setup.options,
    });
}
