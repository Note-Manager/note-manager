import * as React from 'react';
import {useEffect, useRef, useState} from 'react';
import * as TextUtils from "../../utils/TextUtils";
import {writeFile} from "../../utils/FileUtils";
import AceEditor from "react-ace";
import 'ace-builds/src-noconflict/ext-searchbox';
import "ace-builds/src-noconflict/ext-language_tools";
import {ipcRenderer} from "electron";
import * as path from "node:path";
import {Ace} from "ace-builds";
import {EditorTab} from "../../domain/EditorTab";
import {findLanguageByFileName, SupportedLanguage} from "../../domain/SupportedLanguage";

const debounceDelay = 200; // Delay in milliseconds
let changeDebounceTimer: NodeJS.Timeout; // Timer for change event
let selectionChangeDebounceTimer: NodeJS.Timeout; // Timer for selection event

export default function Editor({tab, onEditorLoad, changeListener, selectionListener, onTabSave}: {
    tab: EditorTab,
    onEditorLoad: ((editor: Ace.Editor) => void) | undefined,
    changeListener: ({value, lineCount}: { value: string, lineCount: number }) => void,
    selectionListener: ({isTextSelected, selectedText, ranges}: {
        isTextSelected: boolean,
        selectedText: string,
        ranges: Array<Ace.Range>
    }) => void
    onTabSave: ({isSaved, savedFile, tab}: { isSaved: boolean, savedFile: string, tab: EditorTab }) => void
}) {
    if (!tab) return (<></>);

    const content = tab.content || "";

    const editorRef = useRef<Ace.Editor>();

    const [language, setLanguage] = useState<SupportedLanguage>(tab.language || findLanguageByFileName(tab.file));
    const [mode, setMode] = useState<string>();

    const isTextSelected = (): boolean => {
        const selectionRange = editorRef.current?.getSelectionRange();

        if (!selectionRange) return false;

        return selectionRange.start.row !== selectionRange.end.row ||
            selectionRange.start.column !== selectionRange.end.column;
    }

    useEffect(() => {
        const importLanguageData = async () => {
            await import('ace-builds/src-noconflict/mode-' + language.name);
            await import('ace-builds/src-noconflict/snippets/' + language.name);
        }

        importLanguageData().then(() => {
            setMode(language.name);
        });
    }, [language]);

    const handleLoad = (editor: Ace.Editor) => {
        editorRef.current = editor;

        if(tab.state?.scroll) {
            editor.session.setScrollTop(tab.state.scroll.top);
            editor.session.setScrollLeft(tab.state.scroll.left);
        }

        if (tab.state?.selection) {
            editor.session.selection.fromJSON(tab.state.selection);
        }

        editor.session.on("changeScrollLeft", (scrollLeft) => {
            tab.state.scroll.left = scrollLeft;
        });

        editor.session.on("changeScrollTop", (scrollTop) => {
            tab.state.scroll.top = scrollTop;
        });

        editor.focus();

        if (onEditorLoad) onEditorLoad(editor);

    }

    const onSetTabLanguage = (event: any, lang: SupportedLanguage) => {
        tab.language = lang;

        setLanguage(lang);
    }

    const onSaveTab = () => {
        saveTab(tab).then(async (result) => {
            if (onTabSave) onTabSave(result);
        });
    }

    const onFormatTab = () => {
        let formatTarget: string;

        const selectedText = editorRef.current?.getSelectedText();
        if (selectedText && selectedText.length > 0) {
            formatTarget = selectedText;
        } else {
            formatTarget = editorRef.current?.session.getValue() || "";
        }

        const formatParams = {
            content: formatTarget,
            language: tab.language as SupportedLanguage
        }

        formatTabContent(formatParams).then(result => {
            if (isTextSelected()) editorRef.current?.session?.replace(editorRef.current?.getSelectionRange(), result);
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

            tab.state.selection = editorRef.current?.session.selection.toJSON();
        }
    }, []);

    const onChange = (value: string) => {
        tab.content = value;

        clearTimeout(changeDebounceTimer);

        changeDebounceTimer = setTimeout(async () => {
            if (changeListener) {
                changeListener({
                    value: value,
                    lineCount: editorRef.current?.session.getLength() || 0,
                });
            }

        }, debounceDelay);
    }

    const handleSelectionChange = (value: Ace.Editor) => {
        clearTimeout(selectionChangeDebounceTimer);

        selectionChangeDebounceTimer = setTimeout(() => {
            tab.state.selection = value.session.selection.toJSON();

            if (selectionListener) {
                selectionListener({
                    isTextSelected: isTextSelected(),
                    selectedText: editorRef.current?.getSelectedText() || "",
                    ranges: editorRef.current?.session.getSelection().getAllRanges() || []
                });
            }
        }, debounceDelay)
    }

    return (
        <div style={{height: '100%', maxHeight: '100%', width: '100%', maxWidth: '100%'}}>
            <AceEditor
                mode={mode ?? undefined}
                name={"editor_" + tab.id}
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

async function saveTab(tab: any) {
    console.info("saving " + tab.name);

    let isSaved = false;
    let targetFile = tab.file;

    if (targetFile) {
        writeFile(targetFile, tab.content || "");
        isSaved = true;
    } else {
        targetFile = await ipcRenderer.invoke("showSaveDialog", {
            title: "Save " + tab.name,
            defaultName: tab.name,
        }) as string;

        if (targetFile) {
            writeFile(targetFile, tab.content || "");
            isSaved = true;
            tab.file = targetFile;
            tab.name = path.basename(targetFile);
            tab.displayName = tab.name.length > 20 ? tab.name.substring(0, 17) + "..." : tab.name;
        }
    }

    return {isSaved: isSaved, savedFile: targetFile, tab: tab};
}

async function formatTabContent({content = "", from, to, language}: {
    content: string,
    from?: number,
    to?: number,
    language: SupportedLanguage
}) {
    let rangeStart, rangeEnd;

    if (from && to && from !== to) {
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
