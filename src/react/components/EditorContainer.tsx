import {EditorTab} from "../../domain/EditorTab";
import Editor from "./editor/Editor";
import React, {useEffect, useRef, useState} from "react";
import * as TextUtils from "../../utils/TextUtils";
import {shortenTabName} from "../../utils/TextUtils";
import {fireEvent, off, on} from "../ApplicationEvents";
import {EncodingAction, EventType} from "../../enums";
import {Ace} from "ace-builds";
import {SupportedLanguage, SupportedLanguages} from "../../domain/SupportedLanguage";
import {useEditorContext} from "./editor/EditorContext";
import {markStateChanged} from "../StateChangeTracker";
import {allPlugins} from "../../utils/PluginLoader";
import {ToolbarMenuItem} from "./editor/plugins";
import DOMPurify from "dompurify";
import {FontAwesomeIcon} from "@fortawesome/react-fontawesome";
import {faTimesRectangle} from "@fortawesome/free-regular-svg-icons/faTimesRectangle";
import {saveTab} from "../TabSaver";
import {EolType, getEditorNewLineMode, isKnownEncoding, isKnownEol} from "../../domain/Encoding";
import EncodingPicker from "./EncodingPicker";

const debounceDelay = 200; // Delay in milliseconds
let changeDebounceTimer: NodeJS.Timeout; // Timer for change event
let selectionChangeDebounceTimer: NodeJS.Timeout; // Timer for selection event
let cursorChangeDebounceTimer: NodeJS.Timeout; // Timer for selection event

export default function EditorContainer() {
    const {data, setData, activeTab, encodingPicker, setEncodingPicker} = useEditorContext();

    const[activeTool, setActiveTool] = useState<ToolbarMenuItem>();

    const editorRef = useRef<Ace.Editor>();
    const encodingActionRef = useRef<(action: EncodingAction, encoding?: string) => void>();

    useEffect(() => {
        if(!activeTab){
            return;
        }
        const onSetTabLanguage = (event: any, newLang: SupportedLanguage) => {
            activeTab.language = newLang;

            markStateChanged();

            if(activeTab.isTemp) {
                activeTab.name = activeTab.name?.substring(0, activeTab.name?.lastIndexOf(".")) + newLang.extensions[0];
                activeTab.displayName = shortenTabName(activeTab.name);
            }

            setData(getEditorData());
        }

        const onTabSave = () => {
            if(!activeTab.isChanged) return;

            saveTab(activeTab).then(isSaved => {
                if(isSaved) setData(getEditorData());
            }).catch(err => console.error("cannot save " + activeTab.name + ": " + err));
        }

        const refreshChangedState = async () => {
            const editor = editorRef.current;

            if (editor) activeTab.content = editor.getValue();

            activeTab.isChanged = await TextUtils.documentHash(activeTab.content || "", activeTab.encoding, activeTab.eol) !== activeTab.hash;

            markStateChanged();
            setData(getEditorData());
        }

        const reinterpret = async (encoding?: string) => {
            if (!activeTab.file) {
                if (!encoding) return;

                activeTab.encoding = encoding;
                await refreshChangedState();
                return;
            }

            if (activeTab.isChanged && !await fireEvent(EventType.CONFIRM_REINTERPRET, {name: activeTab.name, encoding: encoding})) return;

            const result = await fireEvent(EventType.READ_FILE_AS, {file: activeTab.file, encoding: encoding, fallbackEol: activeTab.eol});

            activeTab.encoding = result.encoding;
            activeTab.eol = result.eol;
            activeTab.content = result.content;
            activeTab.hash = await TextUtils.documentHash(result.content, result.encoding, result.eol);
            activeTab.isChanged = false;

            const editor = editorRef.current;

            if (editor) {
                editor.session.setNewLineMode(getEditorNewLineMode(result.eol));
                editor.session.setValue(result.content);
                activeTab.state = {...activeTab.state, undoHistory: undefined};
            }

            markStateChanged();
            setData(getEditorData());
        }

        const convert = async (encoding: string) => {
            if (encoding === activeTab.encoding) return;

            if (!await fireEvent(EventType.CONFIRM_CONVERSION, {content: editorRef.current?.getValue() ?? activeTab.content ?? "", encoding: encoding})) return;

            activeTab.encoding = encoding;

            await refreshChangedState();
        }

        const runEncodingAction = (action: EncodingAction, encoding?: string) => {
            const run = action === EncodingAction.REDETECT
                ? reinterpret()
                : isKnownEncoding(encoding) ? (action === EncodingAction.CONVERT ? convert(encoding) : reinterpret(encoding)) : undefined;

            run?.catch(err => console.error("cannot change encoding of " + activeTab.name + ": " + err));
        }

        encodingActionRef.current = runEncodingAction;

        const onEncodingAction = (event: any, data: {action: EncodingAction, encoding?: string}) => runEncodingAction(data?.action, data?.encoding);

        const onOpenEncodingPicker = (event: any, data: {action: EncodingAction}) => setEncodingPicker(data?.action === EncodingAction.CONVERT ? EncodingAction.CONVERT : EncodingAction.REINTERPRET);

        const onEolAction = (event: any, data: {eol: EolType}) => {
            if (!isKnownEol(data?.eol) || data.eol === activeTab.eol) return;

            activeTab.eol = data.eol;

            editorRef.current?.session.setNewLineMode(getEditorNewLineMode(data.eol));

            refreshChangedState().catch(err => console.error("cannot change line endings of " + activeTab.name + ": " + err));
        }

        on(EventType.SAVE_TAB, onTabSave);
        on(EventType.SET_TAB_LANGUAGE, onSetTabLanguage);
        on(EventType.ENCODING_ACTION, onEncodingAction);
        on(EventType.EOL_ACTION, onEolAction);
        on(EventType.OPEN_ENCODING_PICKER, onOpenEncodingPicker);

        return () => {
            off(EventType.SAVE_TAB, onTabSave);
            off(EventType.SET_TAB_LANGUAGE, onSetTabLanguage);
            off(EventType.ENCODING_ACTION, onEncodingAction);
            off(EventType.EOL_ACTION, onEolAction);
            off(EventType.OPEN_ENCODING_PICKER, onOpenEncodingPicker);
        }
    }, [activeTab]);

    useEffect(() => {
        const toolWindowContent = activeTool?.getToolbarWindowContent();
        const el = document.getElementById("toolWindowContent");
        if(el) {
            const sanitizedContent = toolWindowContent ? DOMPurify.sanitize(toolWindowContent) : toolWindowContent;

            const shadow = el.attachShadow({mode: "open"});
            shadow.innerHTML = sanitizedContent || "";

            if(activeTool?.onContentMount) activeTool?.onContentMount(shadow);
        }
    }, [activeTool, activeTab?.id]);

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
        markStateChanged();

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

        markStateChanged();

        clearTimeout(changeDebounceTimer);

        changeDebounceTimer = setTimeout(async () => {
            TextUtils.documentHash(value, activeTab.encoding, activeTab.eol).then((result: string) => {
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
        <div id={"editorBody"}>
            {encodingPicker &&
                <EncodingPicker
                    action={encodingPicker}
                    encoding={activeTab.encoding}
                    hasFile={!!activeTab.file}
                    onActionChange={setEncodingPicker}
                    onClose={() => {
                        setEncodingPicker(undefined);
                        editorRef.current?.focus();
                    }}
                    onSelect={(action, encoding) => {
                        setEncodingPicker(undefined);
                        encodingActionRef.current?.(action, encoding);
                        editorRef.current?.focus();
                    }}/>
            }
            {activeTab &&
                <div id={"tabContentWrapper"} key={activeTab.id}>
                    <Editor
                        content={activeTab.content || ""}
                        language={activeTab.language || SupportedLanguages.text}
                        newLineMode={getEditorNewLineMode(activeTab.eol)}
                        selectionListener={onSelectionChange}
                        changeListener={onContentChange}
                        cursorListener={onCursorChange}
                        onEditorLoad={onEditorLoad}/>
                </div>
            }
            <div id={"editorToolsWrapper"}>
                { activeTool &&
                    <div id={"toolWindow"}>
                        <div id={"toolWindowHeader"}>
                            <div id={"toolWindowButtons"}>
                                <FontAwesomeIcon className={"iconButton"} icon={faTimesRectangle} onClick={() => setActiveTool(undefined)} />
                            </div>
                            <div id={"toolWindowTitle"}>
                                <span>{activeTool.label}</span>
                            </div>
                        </div>
                        <div id={"toolWindowContent"} key={(activeTab?.id || "") + activeTool.label}>
                        </div>
                    </div>
                }
                <div id={"editorTools"}>
                    {
                        allPlugins.filter(p => p.toolbarMenuItems && p.toolbarMenuItems.length > 0).flatMap(plugin => plugin.toolbarMenuItems).map((item, idx) => {
                            return (
                                <div key={idx} className={"editorToolWrapper" + (activeTool === item ? " selected" : "")} onClick={() => setActiveTool(activeTool === item ? undefined : item)}>
                                    <img src={item?.icon} style={{
                                        width: '20px',
                                        fill: "white",
                                        color: "white"
                                    }} alt={"img"}/>
                                    <span>{item?.label}</span>
                                </div>
                            );
                        })
                    }
                </div>
            </div>
        </div>
    );
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
        markStateChanged();

        activeTab.state = {
            ...activeTab.state,
            scroll: {
                left: scrollLeft,
                top: activeTab.state?.scroll?.top||0
            }
        }
    });

    editor.session.on("changeScrollTop", (scrollTop) => {
        markStateChanged();

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
