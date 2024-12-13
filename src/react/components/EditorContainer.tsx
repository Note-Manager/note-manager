import {EditorTab} from "../../domain/EditorTab";
import Editor from "./editor/Editor";
import React, {useEffect, useRef} from "react";
import * as TextUtils from "../../utils/TextUtils";
import {shortenTabName} from "../../utils/TextUtils";
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

export default function EditorContainer() {
    const {data, setData, activeTab, setActiveTab} = useEditorContext();

    const editorRef = useRef<Ace.Editor>();

    useEffect(() => {
        const onSetTabLanguage = (event: any, newLang: SupportedLanguage) => {
            activeTab.language = newLang;
            activeTab.name = activeTab.name?.substring(0, activeTab.name?.lastIndexOf(".")) + newLang.extensions[0];
            activeTab.displayName = shortenTabName(activeTab.name);

            setData(getEditorData());
        }

        const onTabSave = () => {
            if(!activeTab.isChanged) return;

            saveTab(activeTab).then(result => {
                if(result.isSaved) {
                    console.info("saved to " + result.savedFile);

                    TextUtils.hash(activeTab.content || "").then(result => {
                        activeTab.hash = result;
                    });

                    activeTab.isChanged = false;

                    setData(getEditorData());
                }
            });
        }

        on(EventType.SAVE_TAB, onTabSave);
        on(EventType.SET_TAB_LANGUAGE, onSetTabLanguage);

        return () => {
            off(EventType.SAVE_TAB, onTabSave);
            off(EventType.SET_TAB_LANGUAGE, onSetTabLanguage);
        }
    }, [activeTab]);

    if(!activeTab) return null;

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

    const updateTabSelection = () => {
        activeTab.state = {
            ...activeTab.state,
            selection: editorRef.current?.session.selection.toJSON()
        };
    }

    const updateTabUndoHistory = () => {
        activeTab.state = {
            ...activeTab.state,
            undoHistory: editorRef.current?.session.getUndoManager().toJSON()
        }
    }

    const onSelectionChange = () => {
        clearTimeout(selectionChangeDebounceTimer);

        selectionChangeDebounceTimer = setTimeout(() => {
            setData(getEditorData());

            updateTabSelection();
            updateTabUndoHistory();

        }, debounceDelay);
    }

    const onContentChange = ({value}: { value: string, lineCount: number }) => {
        activeTab.content = value;

        clearTimeout(changeDebounceTimer);

        changeDebounceTimer = setTimeout(async () => {
            TextUtils.hash(value).then((result: string) => {
                if (!activeTab) return;

                activeTab.isChanged = result !== activeTab.hash;

                updateTabUndoHistory();
            });
        }, debounceDelay);
    }

    const onCursorChange = () => {
        clearTimeout(cursorChangeDebounceTimer);

        cursorChangeDebounceTimer = setTimeout(() => {
            setData(getEditorData());

            updateTabSelection();
            updateTabUndoHistory();
        }, debounceDelay);
    }

    const onEditorLoad = (editor: Ace.Editor) => {
        editorRef.current = editor;

        setData(getEditorData());

        initializeEditor(editor, activeTab);
    }

    return (
        <div className={"tabContentWrapper"} key={activeTab.id}>
            <Editor
                content={activeTab.content || ""}
                language={activeTab.language||SupportedLanguages.text}
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

function initializeEditor(editor: Ace.Editor, activeTab: EditorTab) {
    if (activeTab.state?.scroll) {
        editor.session.setScrollTop(activeTab.state.scroll.top);
        editor.session.setScrollLeft(activeTab.state.scroll.left);
    }

    if (activeTab.state?.selection) {
        editor.session.selection.fromJSON(activeTab.state.selection);
    }

    if(activeTab.state?.undoHistory) {
        editor.session.getUndoManager().fromJSON(activeTab.state.undoHistory);
    }

    editor.session.on("changeScrollLeft", (scrollLeft) => {
        activeTab.state = {
            ...activeTab.state,
            scroll: {
                left: scrollLeft,
                top: activeTab.state?.scroll?.top||0
            }
        }
    });

    editor.session.on("changeScrollTop", (scrollTop) => {
        activeTab.state = {
            ...activeTab.state,
            scroll: {
                left: activeTab.state?.scroll?.left||0,
                top: scrollTop
            }
        }
    });

    editor.focus();
}
