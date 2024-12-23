export interface SupportedLanguage {
    name: string,
    label: string,
    extensions: Array<string>
}

export enum LanguageName {
    TEXT = "text",
    JAVASCRIPT = "javascript",
    XML = "xml",
    JSON = "json",
    YAML = "yaml",
    HTML = "html",
    CSS = "css",
    MARKDOWN = "markdown",
    JAVA = "java",
    SH = "sh"
}

export const SupportedLanguages: Record<LanguageName, SupportedLanguage> = {
    [LanguageName.TEXT]: {
        name: LanguageName.TEXT,
        label: "Text",
        extensions: [".txt"]
    },
    [LanguageName.JAVASCRIPT]: {
        name: LanguageName.JAVASCRIPT,
        label: "JavaScript",
        extensions: [".js", ".jsx", ".ts", ".tsx"]
    },
    [LanguageName.XML]: {
        name: LanguageName.XML,
        label: "XML",
        extensions: [".xml", ".xslt", ".xsl"]
    },
    [LanguageName.JSON]: {
        name: LanguageName.JSON,
        label: "JSON",
        extensions: [".json"]
    },
    [LanguageName.YAML]: {
        name: LanguageName.YAML,
        label: "YAML",
        extensions: [".yml", ".yaml"]
    },
    [LanguageName.HTML]: {
        name: LanguageName.HTML,
        label: "HTML",
        extensions: [".html"]
    },
    [LanguageName.CSS]: {
        name: LanguageName.CSS,
        label: "CSS",
        extensions: [".css"]
    },
    [LanguageName.MARKDOWN]: {
        name: LanguageName.MARKDOWN,
        label: "Markdown",
        extensions: [".md", ".markdown"]
    },
    [LanguageName.JAVA]: {
        name: LanguageName.JAVA,
        label: "Java",
        extensions: [".java", ".class"]
    },
    [LanguageName.SH]: {
        name: LanguageName.SH,
        label: "SH",
        extensions: [".sh"]
    }
};

export function findLanguageByFileName(fileName: string|undefined): SupportedLanguage {
    if (!fileName) return SupportedLanguages[LanguageName.TEXT];

    const extension = "." + fileName.split(".").pop();

    for (const [, value] of Object.entries(SupportedLanguages)) {
        if (value.extensions.includes(extension)) {
            return value;
        }
    }

    return SupportedLanguages.text;
}