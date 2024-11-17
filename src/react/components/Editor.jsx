import * as React from 'react';
import {useRef} from 'react';
import * as PropTypes from "prop-types";
import {SupportedLanguages} from "../../contants/Enums";
import {xml} from "@codemirror/lang-xml";
import {yaml} from "@codemirror/lang-yaml";
import {css} from "@codemirror/lang-css";
import {html} from "@codemirror/lang-html";
import {java} from "@codemirror/lang-java";
import {javascript} from "@codemirror/lang-javascript";
import {json} from "@codemirror/lang-json";
import {markdown} from "@codemirror/lang-markdown";
import ReactCodeMirror from "@uiw/react-codemirror";
import {search} from "@codemirror/search";
import {foldGutter, indentUnit, syntaxHighlighting} from "@codemirror/language";
import {classHighlighter} from "@lezer/highlight";

export default function Editor({language, content, changeListener, statisticListener, initialState}) {
    if (!content) content = "";
    if (typeof content !== "string") throw new Error("Document content must be a string");

    const editorRef = useRef();

    let contentLang;

    if (language) {
        contentLang = getLanguagePack(language);
    }

    const extensions = [
        search({top: true}),
        syntaxHighlighting(classHighlighter),
        foldGutter({}),
        indentUnit.of("    "),
    ];

    if (contentLang) extensions.push(contentLang);

    return <ReactCodeMirror theme={"none"}
                            basicSetup={true}
                            value={content}
                            indentWithTab={true}
                            placeholder={"Empty document.."}
                            onChange={changeListener}
                            onStatistics={statisticListener}
                            extensions={extensions}
                            ref={editorRef}
    />
}

const isLanguageSupported = (props, propName, componentName) => {
    const language = props[propName];

    if (!language) return;

    const validLanguages = Object.keys(SupportedLanguages);

    if (!validLanguages.includes(language.name)) {
        const error = new Error(
            `Invalid prop \`${propName}\` supplied to \`${componentName}\`. It must be one of the supported languages.`
        );

        log.error(error);

        alert(error);

        throw error;
    }
};

Editor.propTypes = {
    language: isLanguageSupported,
    content: PropTypes.string,
    changeListener: PropTypes.func,
    statisticListener: PropTypes.func
};

function getLanguagePack(supportedLanguage) {
    supportedLanguage = SupportedLanguages[supportedLanguage.name];

    switch (supportedLanguage) {
        case SupportedLanguages.xml:

            return xml({});
        case SupportedLanguages.yaml:
            return yaml();
        case SupportedLanguages.css:
            return css();
        case SupportedLanguages.html:
            return html({});
        case SupportedLanguages.java:
            return java();
        case SupportedLanguages.javascript:
            return javascript({jsx: true, typescript: true});
        case SupportedLanguages.json:
            return json();
        case SupportedLanguages.markdown:
            return markdown({});
        case SupportedLanguages.text:
        default:
            return undefined;
    }
}