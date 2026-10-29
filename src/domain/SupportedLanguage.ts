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

export function findLanguageByFileName(fileName: string | undefined): SupportedLanguage {
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

export interface LanguageGroup {
    label: string,
    languages: Array<SupportedLanguage>
}

const FIRST_INITIAL = "A";
const LAST_INITIAL = "Z";

function getInitial(language: SupportedLanguage) {
    return language.label.charAt(0).toUpperCase();
}

function getNextInitial(initial: string) {
    return String.fromCharCode(initial.charCodeAt(0) + 1);
}

function compareLabels(a: SupportedLanguage, b: SupportedLanguage) {
    return a.label.localeCompare(b.label, "en", {sensitivity: "base"});
}

function groupByInitial(languages: Array<SupportedLanguage>) {
    return languages.reduce<Array<Array<SupportedLanguage>>>((groups, language) => {
        const lastGroup = groups[groups.length - 1];
        if (lastGroup && getInitial(lastGroup[0]) === getInitial(language)) lastGroup.push(language);
        else groups.push([language]);
        return groups;
    }, []);
}

function mergeUpTo(maxGroupSize: number, groups: Array<Array<SupportedLanguage>>) {
    return groups.reduce<Array<Array<SupportedLanguage>>>((merged, group) => {
        const lastGroup = merged[merged.length - 1];
        if (lastGroup && lastGroup.length + group.length <= maxGroupSize) lastGroup.push(...group);
        else merged.push([...group]);
        return merged;
    }, []);
}

function createRangeLabel(first: string, last: string) {
    return first === last ? first : `${first} \u2013 ${last}`;
}

export function groupLanguagesByInitial(languages: Array<SupportedLanguage>, maxGroupSize: number): Array<LanguageGroup> {
    const groups = mergeUpTo(maxGroupSize, groupByInitial([...languages].sort(compareLabels)));
    const lastInitials = groups.map(group => getInitial(group[group.length - 1]));

    return groups.map((group, index) => ({
        label: createRangeLabel(
            index === 0 ? FIRST_INITIAL : getNextInitial(lastInitials[index - 1]),
            index === groups.length - 1 ? LAST_INITIAL : lastInitials[index]
        ),
        languages: group
    }));
}