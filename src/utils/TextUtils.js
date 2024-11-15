import {SupportedLanguages} from "../contants/Enums";
import {js} from "js-beautify/js/src";
import XmlBeautify from "xml-beautify/dist/XmlBeautify";
import {DOMParser} from "xmldom";
import * as prettier from "prettier";

export async function format(content, language, options) {
    language = SupportedLanguages[language?.name];

    if (SupportedLanguages.xml === language) {
        return formatXml(content);
    }
    else if (SupportedLanguages.javascript === language) {
        return formatJS(content, options);
    }
    else if (SupportedLanguages.css === language) {
        return await formatCSS(content, options);
    }
    else if (SupportedLanguages.json === language) {
        return await formatJSON(content, options);
    }
    else if (SupportedLanguages.yaml === language) {
        return await formatYAML(content, options);
    }
    else if (SupportedLanguages.markdown === language) {
        return await formatMarkdown(content, options);
    }
    else if(SupportedLanguages.html === language) {
        return await formatHTML(content, options);
    }

    else return content;
}

export function formatXml(source, options) {
    return new XmlBeautify({parser: DOMParser}).beautify(source,
        {
            indent: "\t",  //indent pattern like white spaces
            useSelfClosingElement: true, //true:use self-closing element when empty element.
            ...options
        });
}

export function formatJS(source, options) {
    return js(source, options);
}

export async function formatCSS(source, options) {
    return await prettier.format(source, {parser: "css", tabWidth: 4, endOfLine: "auto", ...options});
}

export async function formatJSON(source, options) {
    return await prettier.format(source, {parser: "json", tabWidth: 4, endOfLine: "auto", ...options});
}


export async function formatYAML(source, options) {
    return await prettier.format(source, {parser: "yaml", tabWidth: 4, endOfLine: "auto", ...options});
}

export async function formatMarkdown(source, options) {
    return await prettier.format(source, {parser: "markdown", tabWidth: 4, endOfLine: "auto", ...options});
}

export async function formatHTML(source, options) {
    return await prettier.format(source, {parser: "html", tabWidth: 4, endOfLine: "auto", ...options});
}
