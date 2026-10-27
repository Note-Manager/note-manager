import React from "react";
import {useEditorContext} from "./editor/EditorContext";
import {SupportedLanguages} from "../../domain/SupportedLanguage";
import {getEncodingLabel, getEolLabel} from "../../domain/Encoding";
import {fireEvent} from "../ApplicationEvents";
import {EventType} from "../../enums";

export default function Footer() {
    const {data, activeTab} = useEditorContext();

    const showStatusMenu = (event: React.MouseEvent<HTMLElement>, kind: "encoding" | "eol") => {
        event.preventDefault();

        if (!activeTab) return;

        const rect = event.currentTarget.getBoundingClientRect();

        fireEvent(EventType.SHOW_STATUS_MENU, {
            kind: kind,
            encoding: activeTab.encoding,
            eol: activeTab.eol,
            x: rect.left,
            y: rect.top,
        }).catch(err => console.error(err));
    }

    return (
        <div id={"footer"}>
            <div id={"footerLeft"}>
                <span>{activeTab?.file}</span>
            </div>
            <div id={"footerRight"}>
                {data &&
                    <>
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
                    </>
                }
                {activeTab &&
                    <>
                        <button id={"footerEol"} className={"editorDataLabel statusButton"} title={"Line endings"}
                                onClick={event => showStatusMenu(event, "eol")} onContextMenu={event => showStatusMenu(event, "eol")}>
                            {getEolLabel(activeTab.eol)}
                        </button>
                        <button id={"footerEncoding"} className={"editorDataLabel statusButton"} title={"Encoding"}
                                onClick={event => showStatusMenu(event, "encoding")} onContextMenu={event => showStatusMenu(event, "encoding")}>
                            {getEncodingLabel(activeTab.encoding)}
                        </button>
                    </>
                }
            </div>
        </div>
    );
}
