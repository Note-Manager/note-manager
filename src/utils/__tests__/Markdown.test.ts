import {describe, expect, it} from "vitest";
import {fileDirectoryUrl, markdownToHtml, resolveCodeLanguage, resolveRelativeUrl, slugify} from "../Markdown";
import {LanguageName} from "../../domain/SupportedLanguage";

describe("markdownToHtml", () => {
    it("renders GitHub style tables, task lists and strikethrough", () => {
        const html = markdownToHtml("| a | b |\n|---|:-:|\n| 1 | 2 |\n\n- [x] done\n- [ ] todo\n\n~~old~~");

        expect(html).toContain("<table>");
        expect(html).toContain("<th>a</th>");
        expect(html).toContain('<td align="center">2</td>');
        expect(html).toContain('checked="" disabled="" type="checkbox"');
        expect(html).toContain('<input disabled="" type="checkbox"> todo');
        expect(html).toContain("<del>old</del>");
    });

    it("gives headings unique prefixed ids and points hash links at them", () => {
        const html = markdownToHtml("# Kurulum Adımları\n## Kurulum Adımları\n## `npm` & co.\n[go](#kurulum-adımları-1)");

        expect(html).toContain('<h1 id="user-content-kurulum-adımları">');
        expect(html).toContain('<h2 id="user-content-kurulum-adımları-1">');
        expect(html).toContain('<h2 id="user-content-npm--co">');
        expect(html).toContain('<a href="#user-content-kurulum-adımları-1">go</a>');
    });

    it("marks fenced code with a known language and escapes it", () => {
        const html = markdownToHtml("```js\nconst a = '<b>';\n```\n\n```unknown\nx\n```");

        expect(html).toContain('<code class="language-javascript" data-language="javascript">const a = &#39;&lt;b&gt;&#39;;</code>');
        expect(html).toContain("<pre><code>x</code></pre>");
    });

    it("turns GitHub alerts into styled blocks and keeps plain quotes", () => {
        const html = markdownToHtml("> [!WARNING]\n> Be careful\n\n> [!TIP] Inline tip\n\n> just a quote");

        expect(html).toContain('<div class="markdown-alert markdown-alert-warning">\n<p class="markdown-alert-title">Warning</p>\n<p>Be careful</p>');
        expect(html).toContain('<p class="markdown-alert-title">Tip</p>\n<p>Inline tip</p>');
        expect(html).toContain("<blockquote>\n<p>just a quote</p>\n</blockquote>");
    });

    it("resolves relative images and links against the file's folder", () => {
        const html = markdownToHtml("![logo](img/logo.png)\n[doc](<docs/a b.md>) [web](https://example.com)", {filePath: "C:\\notes\\my docs\\README.md"});

        expect(html).toContain('<img src="file:///C:/notes/my%20docs/img/logo.png" alt="logo">');
        expect(html).toContain('<a href="file:///C:/notes/my%20docs/docs/a%20b.md">doc</a>');
        expect(html).toContain('<a href="https://example.com">web</a>');
    });
});

describe("markdown helpers", () => {
    it("resolves code fence languages by name, extension and alias", () => {
        expect(resolveCodeLanguage("typescript")).toBe(LanguageName.TYPESCRIPT);
        expect(resolveCodeLanguage("py")).toBe(LanguageName.PYTHON);
        expect(resolveCodeLanguage("bash")).toBe(LanguageName.SH);
        expect(resolveCodeLanguage("C++")).toBe(LanguageName.C_CPP);
        expect(resolveCodeLanguage("json title=x")).toBe(LanguageName.JSON);
        expect(resolveCodeLanguage("text")).toBeUndefined();
        expect(resolveCodeLanguage("brainfuck")).toBeUndefined();
        expect(resolveCodeLanguage(undefined)).toBeUndefined();
    });

    it("slugifies like GitHub", () => {
        expect(slugify("Hello, World!")).toBe("hello-world");
        expect(slugify("Çalışma  Alanı")).toBe("çalışma--alanı");
        expect(slugify("snake_case-name")).toBe("snake_case-name");
    });

    it("builds file URLs for Windows and POSIX paths", () => {
        expect(fileDirectoryUrl("C:\\a\\b.md")).toBe("file:///C:/a/");
        expect(fileDirectoryUrl("/home/u/notes/x.md")).toBe("file:///home/u/notes/");
        expect(fileDirectoryUrl(undefined)).toBeUndefined();
        expect(fileDirectoryUrl("x.md")).toBeUndefined();
    });

    it("leaves absolute, protocol and hash URLs alone", () => {
        const base = "file:///C:/a/";

        expect(resolveRelativeUrl("https://x.dev/y", base)).toBe("https://x.dev/y");
        expect(resolveRelativeUrl("mailto:a@b.c", base)).toBe("mailto:a@b.c");
        expect(resolveRelativeUrl("#top", base)).toBe("#top");
        expect(resolveRelativeUrl("../c.png", base)).toBe("file:///C:/c.png");
        expect(resolveRelativeUrl("c.png", undefined)).toBe("c.png");
    });
});
