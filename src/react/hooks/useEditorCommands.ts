import {MutableRefObject, useRef} from "react";
import {Ace} from "ace-builds";
import {EditorCommand, EventType} from "../../enums";
import {useIpcEvents} from "./useIpcEvents";

export type EditorCommandHandlers = Partial<Record<EditorCommand, (editor: Ace.Editor) => void>>;

const BUILT_IN_COMMANDS: EditorCommandHandlers = {
    [EditorCommand.DELETE]: editor => editor.execCommand("del"),
    [EditorCommand.UNDO]: editor => editor.undo(),
    [EditorCommand.REDO]: editor => editor.redo(),
    [EditorCommand.SELECT_ALL]: editor => editor.selectAll(),
    [EditorCommand.GO_TO_MATCHING_BRACE]: editor => editor.jumpToMatching(),
};

const KEEPS_FOCUS = [
    EditorCommand.FIND,
    EditorCommand.REPLACE,
    EditorCommand.FIND_NEXT,
    EditorCommand.FIND_PREVIOUS,
    EditorCommand.SELECT_AND_FIND_NEXT,
    EditorCommand.SELECT_AND_FIND_PREVIOUS,
    EditorCommand.GO_TO,
    EditorCommand.SEARCH_ON_WEB,
    EditorCommand.FIND_ALL_IN_DOCUMENT,
    EditorCommand.FIND_ALL_IN_OPEN_DOCUMENTS,
    EditorCommand.TOGGLE_SEARCH_RESULTS,
];

export function useEditorCommands(editorRef: MutableRefObject<Ace.Editor | undefined>, handlers: EditorCommandHandlers) {
    const latestHandlers = useRef(handlers);

    latestHandlers.current = handlers;

    const runCommand = (command: EditorCommand) => {
        const editor = editorRef.current;

        if (!editor) return;

        (latestHandlers.current[command] ?? BUILT_IN_COMMANDS[command])?.(editor);

        if (!KEEPS_FOCUS.includes(command)) editor.focus();
    };

    useIpcEvents({
        [EventType.EDITOR_COMMAND]: (data) => runCommand(data?.command),
    }, []);
}
