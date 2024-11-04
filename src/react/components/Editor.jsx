import * as React from 'react';
import {useEffect, useRef} from 'react';
import {xml} from "@codemirror/lang-xml";
import {search} from "@codemirror/search";
import {SupportedLanguages} from "../../contants/Enums";
import {yaml} from "@codemirror/lang-yaml";
import {css} from "@codemirror/lang-css";
import {html} from "@codemirror/lang-html";
import {java} from "@codemirror/lang-java";
import {javascript} from "@codemirror/lang-javascript";
import {json} from "@codemirror/lang-json";
import {markdown} from "@codemirror/lang-markdown";
import * as PropTypes from "prop-types";
import {indentWithTab} from "@codemirror/commands";

import {EditorState} from "@codemirror/state";
import {drawSelection, EditorView, keymap} from "@codemirror/view";
import {basicSetup} from "codemirror";
import {HighlightStyle, indentUnit, syntaxHighlighting} from "@codemirror/language";
import {classHighlighter, tags} from "@lezer/highlight";

export default function Editor({language, content, onUpdate}) {
    const editor = useRef();

    let contentLang;

    if (language) {
        contentLang = getLanguagePack(language);
    }

    const updateListener = EditorView.updateListener.of((v) => {
        const selection = v.state.selection.main;

        onUpdate(
            {
                length: v.state.doc.length,
                lineCount: v.state.doc.lines,
                selection: {
                    selectionStart: selection.empty ? 0 : selection.from,
                    selectionEnd: selection.empty ? 0 : selection.to,
                    selectionLength: selection.to - selection.from
                }
            }
        )
    });

    useEffect(() => {
        const extensions = [
            keymap.of([indentWithTab]),
            basicSetup,
            search({top: true}),
            updateListener,
            syntaxHighlighting(classHighlighter),
            drawSelection({}),
            indentUnit.of("\t"),
        ];

        if (contentLang) extensions.push(contentLang);

        const startState = EditorState.create({
            doc: content,
            extensions: extensions,
            placeholder: "Empty document..",
        });

        const view = new EditorView({state: startState, parent: editor.current});

        return () => {
            view.destroy();
        };
    }, []);

    return (
        <div id={"editorContainer"} ref={editor}/>
    );
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

        return error;
    }
};

Editor.propTypes = {
    language: isLanguageSupported,
    content: PropTypes.string,
    onUpdate: PropTypes.func
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

function createTheme() {

    return [
        EditorView.theme({
            '&': {
                backgroundColor: '#282c34',
                color: '#abb2bf',
            },
            '.cm-content': {
                caretColor: '#528bff',
            },
            '.cm-gutter': {
                backgroundColor: '#21252b',
                color: '#636d83',
            },
            '.cm-activeLine': {
                backgroundColor: '#3e4451',
            },
        }),
        HighlightStyle.define([
            {tag: tags.keyword, color: "#fc6"},
            {tag: tags.comment, color: "#f5d", fontStyle: "italic"},
            {tag: tags.propertyName, color: "#9966ff"},
        ])
    ];
}