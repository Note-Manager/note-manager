export interface SupportedLanguage {
    name: string,
    label: string,
    extensions: Array<string>,
    fileNames?: Array<string>
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
    SH = "sh",
    SQL = "sql",
    PLSQL = "plsql",
    TYPESCRIPT = "typescript",
    PYTHON = "python",
    C_CPP = "c_cpp",
    CSHARP = "csharp",
    GO = "golang",
    RUST = "rust",
    KOTLIN = "kotlin",
    PHP = "php",
    RUBY = "ruby",
    INI = "ini",
    PROPERTIES = "properties",
    TOML = "toml",
    BATCH = "batchfile",
    POWERSHELL = "powershell",
    DOCKERFILE = "dockerfile",
    MAKEFILE = "makefile",
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
        extensions: [".js", ".jsx", ".mjs", ".cjs"]
    },
    [LanguageName.XML]: {
        name: LanguageName.XML,
        label: "XML",
        extensions: [".xml", ".xslt", ".xsl", ".wsdl", ".xsd", ".jrxml"]
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
        extensions: [".html", ".htm"]
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
        extensions: [".java"]
    },
    [LanguageName.SH]: {
        name: LanguageName.SH,
        label: "SH",
        extensions: [".sh", ".bash", ".zsh"]
    },
    [LanguageName.SQL]: {
        name: LanguageName.SQL,
        label: "SQL",
        extensions: [".sql"]
    },
    [LanguageName.PLSQL]: {
        name: LanguageName.PLSQL,
        label: "PL/SQL",
        extensions: [".sql", ".pck", ".pkg"]
    },
    [LanguageName.TYPESCRIPT]: {
        name: LanguageName.TYPESCRIPT,
        label: "TypeScript",
        extensions: [".ts", ".tsx", ".mts", ".cts"]
    },
    [LanguageName.PYTHON]: {
        name: LanguageName.PYTHON,
        label: "Python",
        extensions: [".py", ".pyw"]
    },
    [LanguageName.C_CPP]: {
        name: LanguageName.C_CPP,
        label: "C/C++",
        extensions: [".c", ".h", ".cpp", ".cc", ".cxx", ".hpp", ".hh"]
    },
    [LanguageName.CSHARP]: {
        name: LanguageName.CSHARP,
        label: "C#",
        extensions: [".cs"]
    },
    [LanguageName.GO]: {
        name: LanguageName.GO,
        label: "Go",
        extensions: [".go"]
    },
    [LanguageName.RUST]: {
        name: LanguageName.RUST,
        label: "Rust",
        extensions: [".rs"]
    },
    [LanguageName.KOTLIN]: {
        name: LanguageName.KOTLIN,
        label: "Kotlin",
        extensions: [".kt", ".kts"]
    },
    [LanguageName.PHP]: {
        name: LanguageName.PHP,
        label: "PHP",
        extensions: [".php"]
    },
    [LanguageName.RUBY]: {
        name: LanguageName.RUBY,
        label: "Ruby",
        extensions: [".rb"],
        fileNames: ["Gemfile", "Rakefile"]
    },
    [LanguageName.INI]: {
        name: LanguageName.INI,
        label: "INI",
        extensions: [".ini", ".cfg", ".conf"]
    },
    [LanguageName.PROPERTIES]: {
        name: LanguageName.PROPERTIES,
        label: "Properties",
        extensions: [".properties"]
    },
    [LanguageName.TOML]: {
        name: LanguageName.TOML,
        label: "TOML",
        extensions: [".toml"]
    },
    [LanguageName.BATCH]: {
        name: LanguageName.BATCH,
        label: "Batch",
        extensions: [".bat", ".cmd"]
    },
    [LanguageName.POWERSHELL]: {
        name: LanguageName.POWERSHELL,
        label: "PowerShell",
        extensions: [".ps1", ".psm1", ".psd1"]
    },
    [LanguageName.DOCKERFILE]: {
        name: LanguageName.DOCKERFILE,
        label: "Dockerfile",
        extensions: [".dockerfile"],
        fileNames: ["Dockerfile"]
    },
    [LanguageName.MAKEFILE]: {
        name: LanguageName.MAKEFILE,
        label: "Makefile",
        extensions: [".mk"],
        fileNames: ["Makefile", "GNUmakefile"]
    }
};

export function findLanguageByFileName(fileName: string|undefined): SupportedLanguage {
    if (!fileName) return SupportedLanguages[LanguageName.TEXT];

    const baseName = fileName.split(/[\\/]/).pop() || fileName;
    const languages = Object.values(SupportedLanguages);

    const byName = languages.find(l => l.fileNames?.includes(baseName));
    if (byName) return byName;

    const dotIndex = baseName.lastIndexOf(".");
    if (dotIndex < 0) return SupportedLanguages[LanguageName.TEXT];

    const extension = baseName.substring(dotIndex).toLowerCase();

    return languages.find(l => l.extensions.includes(extension)) || SupportedLanguages[LanguageName.TEXT];
}