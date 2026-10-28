import {Marked, Tokens} from "marked";
import {findLanguageByFileName, LanguageName, SupportedLanguages} from "../domain/SupportedLanguage";

export const HEADING_ID_PREFIX = "user-content-";

const ALERT_TYPES = ["note", "tip", "important", "warning", "caution"];

const CODE_LANGUAGE_ALIASES: Record<string, LanguageName> = {
    js: LanguageName.JAVASCRIPT,
    node: LanguageName.JAVASCRIPT,
    jsonc: LanguageName.JSON,
    ts: LanguageName.TYPESCRIPT,
    py: LanguageName.PYTHON,
    python3: LanguageName.PYTHON,
    shell: LanguageName.SH,
    console: LanguageName.SH,
    shellscript: LanguageName.SH,
    c: LanguageName.C_CPP,
    cpp: LanguageName.C_CPP,
    "c++": LanguageName.C_CPP,
    "c#": LanguageName.CSHARP,
    cs: LanguageName.CSHARP,
    go: LanguageName.GO,
    rs: LanguageName.RUST,
    kt: LanguageName.KOTLIN,
    rb: LanguageName.RUBY,
    md: LanguageName.MARKDOWN,
    yml: LanguageName.YAML,
    htm: LanguageName.HTML,
    xhtml: LanguageName.HTML,
    svg: LanguageName.XML,
    bat: LanguageName.BATCH,
    cmd: LanguageName.BATCH,
    ps: LanguageName.POWERSHELL,
    ps1: LanguageName.POWERSHELL,
    pwsh: LanguageName.POWERSHELL,
    docker: LanguageName.DOCKERFILE,
    make: LanguageName.MAKEFILE,
    plsql: LanguageName.PLSQL,
};

export function resolveCodeLanguage(tag?: string): LanguageName | undefined {
    const name = (tag || "").trim().split(/\s+/)[0].toLowerCase();

    if (!name || name === LanguageName.TEXT || name === "plaintext") return undefined;

    if (CODE_LANGUAGE_ALIASES[name]) return CODE_LANGUAGE_ALIASES[name];

    const byName = Object.values(SupportedLanguages).find(l => l.name === name);
    if (byName) return byName.name as LanguageName;

    const byExtension = findLanguageByFileName("code." + name);
    if (byExtension && byExtension.name !== LanguageName.TEXT) return byExtension.name as LanguageName;

    return undefined;
}

export function slugify(text: string): string {
    return text
        .toLowerCase()
        .trim()
        .replace(/[^\p{L}\p{M}\p{N}\p{Pc} -]/gu, "")
        .replace(/ /g, "-");
}

export function fileDirectoryUrl(filePath?: string): string | undefined {
    if (!filePath) return undefined;

    const normalized = filePath.replace(/\\/g, "/");
    const directory = normalized.substring(0, normalized.lastIndexOf("/") + 1);

    if (!directory) return undefined;

    const encoded = directory.split("/").map(part => /^[A-Za-z]:$/.test(part) ? part : encodeURIComponent(part)).join("/");

    return encoded.startsWith("/") ? "file://" + encoded : "file:///" + encoded;
}

export function resolveRelativeUrl(href: string, baseUrl?: string): string {
    if (!baseUrl || !href || href.startsWith("#") || /^[a-z][a-z0-9+.-]*:/i.test(href) || href.startsWith("//")) return href;

    try {
        return new URL(href, baseUrl).href;
    } catch {
        return href;
    }
}

function escapeHtml(text: string): string {
    return text
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#39;");
}

function stripTags(html: string): string {
    return html
        .replace(/<[^>]*>/g, "")
        .replace(/&amp;/g, "&")
        .replace(/&lt;/g, "<")
        .replace(/&gt;/g, ">")
        .replace(/&quot;/g, "\"")
        .replace(/&#39;/g, "'");
}

export function markdownToHtml(source: string, options: { filePath?: string } = {}): string {
    const baseUrl = fileDirectoryUrl(options.filePath);
    const usedSlugs = new Map<string, number>();

    const uniqueSlug = (text: string) => {
        const slug = slugify(text);
        const count = usedSlugs.get(slug);

        usedSlugs.set(slug, (count ?? -1) + 1);

        return count === undefined ? slug : slug + "-" + (count + 1);
    };

    const marked = new Marked({gfm: true, async: false});

    marked.use({
        renderer: {
            heading({tokens, depth}: Tokens.Heading) {
                const html = this.parser.parseInline(tokens);
                const id = HEADING_ID_PREFIX + uniqueSlug(stripTags(html));

                return `<h${depth} id="${escapeHtml(id)}">${html}</h${depth}>\n`;
            },
            code({text, lang}: Tokens.Code) {
                const language = resolveCodeLanguage(lang);
                const attributes = language ? ` class="language-${language}" data-language="${language}"` : "";

                return `<pre><code${attributes}>${escapeHtml(text.replace(/\n$/, ""))}</code></pre>\n`;
            },
            blockquote({tokens}: Tokens.Blockquote) {
                const body = this.parser.parse(tokens);
                const alert = /^<p>\[!(\w+)\][ \t]*(?:\n|<br>\n?)?/i.exec(body);
                const type = alert?.[1].toLowerCase();

                if (!alert || !type || !ALERT_TYPES.includes(type)) return `<blockquote>\n${body}</blockquote>\n`;

                const rest = body.substring(alert[0].length).replace(/^<p><\/p>\n?/, "");
                const content = rest.startsWith("</p>") ? rest.substring(4).replace(/^\n/, "") : "<p>" + rest;
                const title = type.charAt(0).toUpperCase() + type.substring(1);

                return `<div class="markdown-alert markdown-alert-${type}">\n<p class="markdown-alert-title">${title}</p>\n${content}</div>\n`;
            },
            image({href, title, text}: Tokens.Image) {
                const titleAttribute = title ? ` title="${escapeHtml(title)}"` : "";

                return `<img src="${escapeHtml(resolveRelativeUrl(href, baseUrl))}" alt="${escapeHtml(text)}"${titleAttribute}>`;
            },
            link({href, title, tokens}: Tokens.Link) {
                const titleAttribute = title ? ` title="${escapeHtml(title)}"` : "";
                const target = href.startsWith("#") ? "#" + HEADING_ID_PREFIX + href.substring(1) : resolveRelativeUrl(href, baseUrl);

                return `<a href="${escapeHtml(target)}"${titleAttribute}>${this.parser.parseInline(tokens)}</a>`;
            },
        }
    });

    return marked.parse(source) as string;
}
