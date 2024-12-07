import {EditorTab} from "../../domain/EditorTab";
import Editor from "./editor/Editor";
import React, {useEffect, useRef} from "react";
import * as TextUtils from "../../utils/TextUtils";
import {writeFile} from "../../utils/FileUtils";
import {fireEvent, off, on} from "../ApplicationEvents";
import {EventType} from "../../enums";
import path from "node:path";
import {Ace} from "ace-builds";
import {SupportedLanguage, SupportedLanguages} from "../../domain/SupportedLanguage";
import {useEditorContext} from "./editor/EditorContext";

const debounceDelay = 200; // Delay in milliseconds
let changeDebounceTimer: NodeJS.Timeout; // Timer for change event
let selectionChangeDebounceTimer: NodeJS.Timeout; // Timer for selection event
let cursorChangeDebounceTimer: NodeJS.Timeout; // Timer for selection event

export default function EditorContainer({tab}: {tab: EditorTab}) {
    const {language, setLanguage, data, setData} = useEditorContext();

    const editorRef = useRef<Ace.Editor>();

    useEffect(() => {
        tab.language = language;
    }, [language]);

    const getEditorData = () => {
        return {
            ...data,
            length: editorRef.current?.getValue().length||0,
            lineCount: editorRef.current?.session.getLength()||0,
            selection: {
                selectionLength: editorRef.current?.getSelectedText()?.length||0,
                selectionRangeCount: editorRef.current?.getSelection().getAllRanges()?.length||0
            },
        }
    }

    const onSelectionChange = () => {
        clearTimeout(selectionChangeDebounceTimer);

        selectionChangeDebounceTimer = setTimeout(() => {
            setData(getEditorData());
            tab.state.selection = editorRef.current?.session.selection.toJSON();
        }, debounceDelay);
    }

    const onContentChange = ({value}: { value: string, lineCount: number }) => {
        tab.content = value;

        clearTimeout(changeDebounceTimer);

        changeDebounceTimer = setTimeout(async () => {
            TextUtils.hash(value).then((result: string) => {
                if (!tab) return;

                tab.isChanged = result !== tab.hash;
            });
        }, debounceDelay);
    }

    const onCursorChange = () => {
        clearTimeout(cursorChangeDebounceTimer);

        cursorChangeDebounceTimer = setTimeout(() => {
            setData(getEditorData());

            tab.state.selection = editorRef.current?.session.selection.toJSON();
        }, debounceDelay);
    }

    const onEditorLoad = (editor: Ace.Editor) => {
        editorRef.current = editor;

        setData(getEditorData());

        initializeEditor(editor, tab);
    }

    useEffect(() => {
        const onSetTabLanguage = (event: any, newLang: SupportedLanguage) => {
            setLanguage(newLang);
        }

        const onFormatTab = () => {
            if(editorRef.current) formatEditorContent(editorRef.current, language);
        }

        const onTabSave = (tab: EditorTab) => {
            saveTab(tab).then(result => {
                if(result.isSaved) {
                    console.info("saved to " + result.savedFile);

                    TextUtils.hash(tab.content || "").then(result => {
                        tab.hash = result;
                    });

                    setData({
                        ...data,
                        openedFile: result.savedFile
                    });
                }
            });
        }

        on(EventType.SAVE_TAB, onTabSave);
        on(EventType.SET_TAB_LANGUAGE, onSetTabLanguage);
        on(EventType.FORMAT_TAB, onFormatTab);

        return () => {
            off(EventType.SAVE_TAB, onTabSave);
            off(EventType.SET_TAB_LANGUAGE, onSetTabLanguage);
            off(EventType.FORMAT_TAB, onFormatTab);

            tab.state.selection = editorRef.current?.session.selection.toJSON();
        }
    }, []);

    return (
        <div className={"tabContentWrapper"} key={tab.id}>
            <Editor
                content={tab.content || ""}
                language={tab.language||SupportedLanguages.text}
                selectionListener={onSelectionChange}
                changeListener={onContentChange}
                cursorListener={onCursorChange}
                onEditorLoad={onEditorLoad}/>
        </div>
    );
}

async function saveTab(tab: EditorTab) {
    console.info("saving " + tab.name);

    let isSaved = false;
    let targetFile = tab.file;

    if (targetFile) {
        writeFile(targetFile, tab.content || "");
        isSaved = true;
    } else {
        targetFile = await fireEvent(EventType.SHOW_SAVE_DIALOG, {
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

function isTextSelected(editor: Ace.Editor) {
    const selectionRange = editor.getSelectionRange();

    if (!selectionRange) return false;

    return selectionRange.start.row !== selectionRange.end.row ||
        selectionRange.start.column !== selectionRange.end.column;
}

function formatEditorContent(editor: Ace.Editor, language: SupportedLanguage) {
    let formatTarget: string;

    const selectedText = editor.getSelectedText();
    if (selectedText && selectedText.length > 0) {
        formatTarget = selectedText;
    } else {
        formatTarget = editor.session.getValue() || "";
    }

    TextUtils.format(formatTarget, language, undefined).then(result => {
        if (isTextSelected(editor)) editor.session?.replace(editor.getSelectionRange(), result);
        else editor.session.setValue(result);
    });
}

function initializeEditor(editor: Ace.Editor, activeTab: EditorTab) {
    if (activeTab.state?.scroll) {
        editor.session.setScrollTop(activeTab.state.scroll.top);
        editor.session.setScrollLeft(activeTab.state.scroll.left);
    }

    if (activeTab.state?.selection) {
        editor.session.selection.fromJSON(activeTab.state.selection);
    }

    editor.session.on("changeScrollLeft", (scrollLeft) => {
        activeTab.state.scroll.left = scrollLeft;
    });

    editor.session.on("changeScrollTop", (scrollTop) => {
        activeTab.state.scroll.top = scrollTop;
    });

    editor.focus();
}
