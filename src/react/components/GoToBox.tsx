import React, {useState} from "react";
import {Ace} from "ace-builds";
import {parseGoToTarget} from "../../domain/Search";
import {goToTarget} from "../EditorSearch";

export default function GoToBox({editor, onClose}: {editor: Ace.Editor, onClose: () => void}) {
    const [value, setValue] = useState("");
    const cursor = editor.getCursorPosition();
    const lineCount = editor.session.getLength();
    const target = parseGoToTarget(value);
    const isInvalid = value.trim() !== "" && !target;

    const close = () => {
        onClose();
        editor.focus();
    };

    const onKeyDown = (event: React.KeyboardEvent) => {
        if (event.key === "Escape") {
            event.preventDefault();
            close();
        }

        if (event.key !== "Enter" || !target) return;

        event.preventDefault();
        onClose();
        goToTarget(editor, target);
    };

    return (
        <div className={"paletteOverlay"} onMouseDown={event => event.target === event.currentTarget && close()}>
            <div className={"palette"} role={"dialog"} aria-label={"Go to"} onKeyDown={onKeyDown}>
                <input type={"text"} className={"textField paletteInput"} autoFocus={true} spellCheck={false} aria-invalid={isInvalid}
                    placeholder={`Line (1-${lineCount}), line:column or #offset`} value={value} onChange={event => setValue(event.target.value)}/>
                <div className={"paletteHint"}>
                    {isInvalid ? "Type a line number, line:column or #character offset." : `Now at line ${cursor.row + 1}, column ${cursor.column + 1}. Press Enter to go.`}
                </div>
            </div>
        </div>
    );
}
