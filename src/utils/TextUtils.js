import {SupportedLanguages} from "../contants/Enums";
import {js} from "js-beautify/js/src";
import XmlBeautify from "xml-beautify/dist/XmlBeautify";
import {DOMParser} from "xmldom";

export function format(content, language, options) {
    if ([SupportedLanguages.xml, SupportedLanguages.html].includes(language)) {
        return formatXml(content);
    } else if (SupportedLanguages.javascript === language) {
        return formatJS(content, options);
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