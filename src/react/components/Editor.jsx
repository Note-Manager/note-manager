import * as React from 'react';
import {useEffect, useRef, useState} from 'react';
import {SupportedLanguages} from "../../contants/Enums";
import * as TextUtils from "../../utils/TextUtils";
import {writeFile} from "../../utils/FileUtils";
import AceEditor from "react-ace";
import 'ace-builds/src-noconflict/ext-searchbox';
import "ace-builds/src-noconflict/ext-language_tools";
import {ipcRenderer} from "electron";
import * as path from "node:path";

const debounceDelay = 200; // Delay in milliseconds
let changeDebounceTimer; // Timer for change event
let selectionChangeDebounceTimer; // Timer for selection event

export default function Editor({tab, changeListener, selectionListener, onTabSave}) {
    if(!tab) return (<></>);

    const content = tab.content || "";

    if (typeof content !== "string") throw new Error("Document content must be a string");

    const editorRef = useRef();

    const [language, setLanguage] = useState(tab.language || SupportedLanguages.findByFileName(tab.file));
    const [mode, setMode] = useState(null);

    const isTextSelected = () => {
        const selectionRange = editorRef.current?.getSelectionRange();

        return selectionRange.start.row !== selectionRange.end.row ||
                selectionRange.start.column !== selectionRange.end.column;
    }

    useEffect(() => {
        const importLanguageData = async() => {
            await import('ace-builds/src-noconflict/mode-'+language.name);
            await import('ace-builds/src-noconflict/snippets/'+language.name);
        }
        importLanguageData().then(() => {
           setMode(language.name);
        });
    }, [language]);

    const handleLoad = (editor) => {
        editorRef.current = editor;

        initializeEditor(editor, tab);

        editor.session.on("changeScrollLeft", (scrollLeft) => {
            tab.state.scroll.left = scrollLeft;
        });

        editor.session.on("changeScrollTop", (scrollTop) => {
            tab.state.scroll.top = scrollTop;
        });
    }

    const onSetTabLanguage = (event, lang) => {
        tab.language = lang;

        setLanguage(lang);
    }

    const onSaveTab = () => {
        saveTab(tab).then(async () => {
            if(onTabSave) onTabSave(tab);
        });
    }

    const onFormatTab = () => {
        let formatTarget;

        const selectedText = editorRef.current?.getSelectedText();
        if(selectedText && selectedText.length > 0) {
            formatTarget = selectedText;
        } else {
            formatTarget = editorRef.current?.session.getValue();
        }

        const formatParams = {
            content: formatTarget,
            language: tab.language
        }

        formatTabContent(formatParams).then(result => {
            if(isTextSelected()) editorRef.current?.session?.replace(editorRef.current?.getSelectionRange(), result);
            else editorRef.current?.session.setValue(result);
        });
    }

    useEffect(() => {
        ipcRenderer.on("formatTab", onFormatTab);
        ipcRenderer.on("saveTab", onSaveTab);
        ipcRenderer.on("setTabLanguage", onSetTabLanguage);

        return () => {
            ipcRenderer.off("formatTab", onFormatTab);
            ipcRenderer.off("saveTab", onSaveTab);
            ipcRenderer.off("setTabLanguage", onSetTabLanguage);

            tab.state.selection = editorRef.current.session.selection.toJSON();
        }
    }, []);

    const onChange = (value) => {
        tab.content = value;

        clearTimeout(changeDebounceTimer);

        changeDebounceTimer = setTimeout(async () => {
            if(changeListener) {
                changeListener({
                    value: value,
                    lineCount: editorRef.current.session.getLength(),
                });
            }

        }, debounceDelay);
    }

    const handleSelectionChange = (value) => {
        clearTimeout(selectionChangeDebounceTimer);

        selectionChangeDebounceTimer = setTimeout(() => {
            tab.state.selection = value.session.selection.toJSON();

            if(selectionListener) {
                selectionListener({
                    isTextSelected: isTextSelected(),
                    selectedText: editorRef.current?.getSelectedText(),
                    selectionRanges: editorRef.current?.session.getSelection().getAllRanges()
                });
            }
        }, debounceDelay)
    }

    return (
        <div style={{height: '100%', maxHeight: '100%', width: '100%', maxWidth: '100%'}}>
            <AceEditor
                mode={mode}
                name={"editor_"+tab.id}
                theme={""}
                value={content}
                onChange={onChange}
                onLoad={handleLoad}
                onSelectionChange={handleSelectionChange}
                placeholder={"Empty document.."}
                enableLiveAutocompletion={true}
                enableBasicAutocompletion={true}
                tabSize={4}
                fontSize={"1rem"}
                setOptions={{
                    animatedScroll: true,
                    highlightActiveLine: true,
                    highlightGutterLine: true,
                    highlightSelectedWord: true,
                    newLineMode: "auto",
                    showPrintMargin: false,
                    useWorker: false,
                    enableSnippets: true,
                    cursorStyle: "ace"
                }}
                width={"100%"}
                height={"100%"}
            />
        </div>
    );
}

function initializeEditor(editor, tab) {
    if(!tab.state) tab.state = {scroll: {}}

    editor.session.setScrollTop(tab.state.scroll.top);
    editor.session.setScrollLeft(tab.state.scroll.left);

    if(tab.state.selection) {
        editor.session.selection.fromJSON(tab.state.selection);
    }

    editor.focus();
}

async function saveTab(tab) {
    console.info("saving " + tab.name);

    if(tab.file) {
        writeFile(tab.file, tab.content || "");
    }
    else {
        const targetFile = await ipcRenderer.invoke("showSaveDialog", {
            title: "Save " + tab.name,
            defaultName: tab.name,
        });

        if(targetFile) {
            writeFile(targetFile, tab.content || "");
            tab.file = targetFile;
            tab.name = path.basename(targetFile);
            tab.displayName = tab.name.length > 20 ? tab.name.substring(0, 17) + "..." : tab.name;
        }
    }
}

async function formatTabContent({content = "", from, to, language}) {
    let rangeStart, rangeEnd;

    if(from && to && from !== to) {
        rangeStart = from;
        rangeEnd = to;
    } else {
        rangeStart = 0;
        rangeEnd = content.length
    }

    return await TextUtils.format(
        content,
        language,
        {
            rangeStart: rangeStart,
            rangeEnd: rangeEnd
        },
    );
}
