import React from "react";
import {useEditorContext} from "./editor/EditorContext";
import {SupportedLanguages} from "../../domain/SupportedLanguage";

export default function Footer() {
    const {data, activeTab} = useEditorContext();

    return (
        <div id={"footer"}>
            <div id={"footerLeft"}>
                <span>{activeTab?.file}</span>
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
                        lang: <span className={"dataContent"}>{(activeTab?.language || SupportedLanguages.text).label}</span>
                    </label>
                </div>
            }
        </div>
    );
}