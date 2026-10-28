import {MutableRefObject} from "react";
import {Ace} from "ace-builds";
import {EditorCommand, EventType} from "../../enums";
import {useIpcEvents} from "./useIpcEvents";

const ACE_COMMANDS: Partial<Record<EditorCommand, string>> = {
    [EditorCommand.DELETE]: "del",
    [EditorCommand.FIND]: "find",
    [EditorCommand.REPLACE]: "replace",
    [EditorCommand.GO_TO_LINE]: "gotoline",
};

const OPENS_A_SEARCH_BOX = [EditorCommand.FIND, EditorCommand.REPLACE, EditorCommand.GO_TO_LINE];

export function useEditorCommands(editorRef: MutableRefObject<Ace.Editor | undefined>, togglePreview: () => void) {
    const runCommand = (command: EditorCommand) => {
        const editor = editorRef.current;

        if (!editor) return;

        const aceCommand = ACE_COMMANDS[command];

        if (aceCommand) editor.execCommand(aceCommand);
        else if (command === EditorCommand.UNDO) editor.undo();
        else if (command === EditorCommand.REDO) editor.redo();
        else if (command === EditorCommand.SELECT_ALL) editor.selectAll();
        else if (command === EditorCommand.TOGGLE_PREVIEW) togglePreview();

        if (!OPENS_A_SEARCH_BOX.includes(command)) editor.focus();
    };

    useIpcEvents({
        [EventType.EDITOR_COMMAND]: (event: unknown, data: {command: EditorCommand}) => runCommand(data?.command),
    }, []);
}
