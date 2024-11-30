import {SupportedLanguages} from "../contants/Enums";
import * as prettier from "prettier";
import * as htmlParser from "prettier/parser-html";
import * as markdownParser from "prettier/parser-markdown";
import * as babelParser from "prettier/parser-babel";
import * as yamlParser from "prettier/parser-yaml";
import * as cssParser from "prettier/parser-postcss";

export async function format(content, language, options) {
    language = SupportedLanguages[language?.name];

    const { rangeStart = 0, rangeEnd = content.length } = options;

    const prefix = content.substring(0, rangeStart);
    const rangeToFormat = content.substring(rangeStart, rangeEnd);
    const suffix = content.substring(rangeEnd);

    if (SupportedLanguages.javascript === language) {
        return formatJS(rangeToFormat, options);
    }
    else if (SupportedLanguages.css === language) {
        return await formatCSS(rangeToFormat, options);
    }
    else if (SupportedLanguages.json === language) {
        return await formatJSON(rangeToFormat, options);
    }
    else if (SupportedLanguages.yaml === language) {
        return await formatYAML(rangeToFormat, options);
    }
    else if (SupportedLanguages.markdown === language) {
        return await formatMarkdown(rangeToFormat, options);
    }
    else if([SupportedLanguages.html, SupportedLanguages.xml].includes(language)) {
        return await formatHTML(rangeToFormat, options);
    }

    else return prefix + rangeToFormat + suffix;
}

export function formatJS(source, options) {
    return prettier.format(source, {parser: "babel", plugins: [babelParser], tabWidth: 4, endOfLine: "auto", ...options});
}

export async function formatCSS(source, options) {
    return await prettier.format(source, {parser: "css", plugins: [cssParser], tabWidth: 4, endOfLine: "auto", ...options});
}

export async function formatJSON(source, options) {
    return await prettier.format(source, {parser: "json", plugins: [babelParser], tabWidth: 4, endOfLine: "auto", ...options});
}

export async function formatYAML(source, options) {
    return await prettier.format(source, {parser: "yaml", plugins: [yamlParser], tabWidth: 4, endOfLine: "auto", ...options});
}

export async function formatMarkdown(source, options) {
    return await prettier.format(source, {parser: "markdown", plugins: [markdownParser], tabWidth: 4, endOfLine: "auto", ...options});
}

export async function formatHTML(source, options) {
    try {
        return await prettier.format(source, {
            parser: "html",
            plugins: [htmlParser],
            tabWidth: 4,
            endOfLine: "auto",
            bracketSameLine: true,
            bracketSpacing: false,
        });
    } catch(err) {
        console.error(err);
        return source;
    }
}

export async function hash(content) {
    const encoder = new TextEncoder();
    const data = encoder.encode(content);
    const hashBuffer = await crypto.subtle.digest("SHA-256", data);
    return Array.from(new Uint8Array(hashBuffer))
        .map(b => b.toString(16).padStart(2, "0"))
        .join("");
}