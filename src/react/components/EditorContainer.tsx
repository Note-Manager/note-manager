import React, {useRef, useState} from "react";
import {Ace} from "ace-builds";
import Editor from "./editor/Editor";
import EncodingPicker from "./EncodingPicker";
import ToolWindow from "./ToolWindow";
import {readToolWindowWidth} from "./ToolWindowResizer";
import {useEditorContext} from "./editor/EditorContext";
import {ContextMenuGroup, ToolbarMenuItem} from "./editor/plugins";
import {canPreview} from "./editor/plugins/PreviewPlugin";
import {EditorTab} from "../../domain/EditorTab";
import {EditorData} from "../../domain/EditorData";
import {SupportedLanguages} from "../../domain/SupportedLanguage";
import {AceEditorWrapper} from "../../domain/AceEditorWrapper";
import {getEditorNewLineMode} from "../../domain/Encoding";
import {EventType} from "../../enums";
import {fireEvent} from "../ApplicationEvents";
import {markStateChanged} from "../StateChangeTracker";
import {getAllPlugins} from "../UserPluginRegistry";
import {createDebouncer} from "../Debounce";
import {classNames} from "../ClassNames";
import {useActiveTabEditing} from "../hooks/useActiveTabEditing";
import {useEditorCommands} from "../hooks/useEditorCommands";
import {previewTool, toolbarItems} from "../../utils/PluginLoader";
import {refreshIsChanged} from "../../utils/TabUtils";
import {logError} from "../../utils/Log";

const DEBOUNCE_DELAY = 200;

const debounceContentChange = createDebouncer(DEBOUNCE_DELAY);
const debounceCursorChange = createDebouncer(DEBOUNCE_DELAY);

export default function EditorContainer() {
    const {setData, activeTab, encodingPicker, setEncodingPicker} = useEditorContext();

    const [activeTool, setActiveTool] = useState<ToolbarMenuItem>();
    const [toolWindowWidth, setToolWindowWidth] = useState<number>(readToolWindowWidth);

    const editorRef = useRef<Ace.Editor>();

    const updateEditorData = () => setData(readEditorData(editorRef.current));
    const toggleTool = (tool: ToolbarMenuItem) => setActiveTool(current => current === tool ? undefined : tool);

    const runEncodingAction = useActiveTabEditing(editorRef, updateEditorData);

    useEditorCommands(editorRef, () => toggleTool(previewTool));

    if (!activeTab) return null;

    const saveEditorState = () => {
        const session = editorRef.current?.session;

        markStateChanged();

        activeTab.state = {
            ...activeTab.state,
            selection: session?.selection.toJSON(),
            undoHistory: session?.getUndoManager().toJSON(),
        };
    };

    const onCursorChange = () => debounceCursorChange(() => {
        updateEditorData();
        saveEditorState();
    });

    const onContentChange = (value: string) => {
        activeTab.content = value;

        markStateChanged();

        debounceContentChange(() => {
            refreshIsChanged(activeTab)
                .then(() => activeTab.state = {...activeTab.state, undoHistory: editorRef.current?.session.getUndoManager().toJSON()})
                .catch(logError("cannot check changes of " + activeTab.name));
        });
    };

    const onEditorLoad = (editor: Ace.Editor) => {
        editorRef.current = editor;

        updateEditorData();
        restoreEditorState(editor, activeTab);
    };

    const showContextMenu = (event: React.MouseEvent) => {
        const editor = editorRef.current;

        if (!editor || (event.target as HTMLElement).closest(".ace_search")) return;

        event.preventDefault();

        const undoManager = editor.session.getUndoManager();

        fireEvent(EventType.SHOW_EDITOR_CONTEXT_MENU, {
            hasSelection: !editor.selection.isEmpty(),
            canUndo: undoManager.hasUndo(),
            canRedo: undoManager.hasRedo(),
            file: activeTab.file,
            canPreview: canPreview(activeTab.language?.name),
            isPreviewOpen: activeTool === previewTool,
            groups: getContextMenuGroups(new AceEditorWrapper(editor)),
            x: event.clientX,
            y: event.clientY,
        }).catch(logError("cannot show editor context menu"));
    };

    const closeEncodingPicker = () => {
        setEncodingPicker(undefined);
        editorRef.current?.focus();
    };

    return (
        <div id={"editorBody"}>
            {encodingPicker &&
                <EncodingPicker
                    action={encodingPicker}
                    encoding={activeTab.encoding}
                    hasFile={!!activeTab.file}
                    onActionChange={setEncodingPicker}
                    onClose={closeEncodingPicker}
                    onSelect={(action, encoding) => {
                        closeEncodingPicker();
                        runEncodingAction(action, encoding);
                    }}/>
            }
            <div id={"tabContentWrapper"} key={activeTab.id} onContextMenu={showContextMenu}>
                <Editor
                    content={activeTab.content || ""}
                    language={activeTab.language || SupportedLanguages.text}
                    newLineMode={getEditorNewLineMode(activeTab.eol)}
                    selectionListener={onCursorChange}
                    changeListener={onContentChange}
                    cursorListener={onCursorChange}
                    onEditorLoad={onEditorLoad}/>
            </div>
            <div id={"editorToolsWrapper"}>
                {activeTool &&
                    <ToolWindow key={activeTab.id + activeTool.label}
                        tool={activeTool}
                        context={{filePath: activeTab.file, language: activeTab.language?.name}}
                        width={toolWindowWidth}
                        onResize={setToolWindowWidth}
                        onClose={() => setActiveTool(undefined)}/>
                }
                <div id={"editorTools"}>
                    {toolbarItems.map(item => (
                        <button type={"button"} key={item.label} className={classNames("editorToolWrapper", activeTool === item && "selected")} aria-pressed={activeTool === item} onClick={() => toggleTool(item)}>
                            <img className={"editorToolIcon"} src={item.icon} alt={""}/>
                            <span>{item.label}</span>
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
}

function readEditorData(editor: Ace.Editor | undefined): EditorData {
    return {
        length: editor?.getValue().length || 0,
        lineCount: editor?.session.getLength() || 0,
        selection: {
            selectionLength: editor?.getSelectedText()?.length || 0,
            selectionRangeCount: editor?.getSelection().getAllRanges()?.length || 0
        },
    };
}

function getContextMenuGroups(editor: AceEditorWrapper): Array<ContextMenuGroup> {
    return getAllPlugins().flatMap(plugin => plugin.contextMenuItems || []).map(item => ({
        label: item.label,
        actions: item.actions.map(action => ({
            label: action.label,
            code: action.code,
            enabled: action.isAvailable ? action.isAvailable(editor) : true
        }))
    }));
}

function restoreEditorState(editor: Ace.Editor, tab: EditorTab) {
    const {scroll, selection, undoHistory} = tab.state || {};

    if (scroll) {
        editor.session.setScrollTop(scroll.top);
        editor.session.setScrollLeft(scroll.left);
    }

    if (selection) editor.session.selection.fromJSON(selection);
    if (undoHistory) editor.session.getUndoManager().fromJSON(undoHistory);

    const saveScroll = () => {
        markStateChanged();

        tab.state = {...tab.state, scroll: {left: editor.session.getScrollLeft(), top: editor.session.getScrollTop()}};
    };

    editor.session.on("changeScrollLeft", saveScroll);
    editor.session.on("changeScrollTop", saveScroll);

    editor.focus();
}
