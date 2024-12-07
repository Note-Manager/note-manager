import React from "react";
import {useEditorContext} from "./editor/EditorContext";

export default function Footer() {
    const {data, language} = useEditorContext();

    return (
        <div id={"footer"}>
            <div id={"footerLeft"}>
                <span>{data.openedFile}</span>
            </div>
            {data &&
                <div id={"footerRight"}>
                    <label className={"editorDataLabel"}>
                        length: <span className={"dataContent"}>{data.length}</span>
                    </label>
                    <label className={"editorDataLabel"}>
                        lines: <span className={"dataContent"}>{data.lineCount}</span>
                    </label>
                    <label className={"editorDataLabel"}>
                        selection: <span className={"dataContent"}>{data.selection?.selectionLength} ({"RNG: " + data.selection.selectionRangeCount})</span>
                    </label>
                    <label className={"editorDataLabel"}>
                        lang: <span className={"dataContent"}>{language.label}</span>
                    </label>
                </div>
            }
        </div>
    );
}