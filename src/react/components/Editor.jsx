import * as React from 'react';
import {useEffect, useRef} from 'react';
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
import {useCodeMirror} from "@uiw/react-codemirror";
import {keymap} from "@codemirror/view";
import {indentWithTab} from "@codemirror/commands";
import {basicSetup} from "codemirror";
import {search} from "@codemirror/search";
import {indentUnit, syntaxHighlighting} from "@codemirror/language";
import {classHighlighter} from "@lezer/highlight";

export default function Editor({language, content, changeListener, statisticListener}) {
    if(!content) content = "";
    if (typeof content !== "string") throw new Error("Document content must be a string");

    const editor = useRef();

    let contentLang;

    if (language) {
        contentLang = getLanguagePack(language);
    }

    const extensions = [
        keymap.of([indentWithTab]),
        basicSetup,
        search({top: true}),
        syntaxHighlighting(classHighlighter),
        indentUnit.of("\t"),
    ];

    if (contentLang) extensions.push(contentLang);

    const {setContainer} = useCodeMirror({
        container: editor.current,
        extensions,
        value: content,
        onChange: changeListener,
        onStatistics: statisticListener,
        theme: "none",
        placeholder: "Empty document.."
    });

    useEffect(() => {
        setContainer(editor.current)
    }, [editor.current]);

    return <div id={"editorContainer"} ref={editor}/>;
}

const isLanguageSupported = (props, propName, componentName) => {
    const language = props[propName];

    if (!language) return;

    const validLanguages = Object.values(SupportedLanguages);

    if (!validLanguages.includes(language)) {
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