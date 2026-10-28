import React from "react";
import {useEditorContext} from "./editor/EditorContext";
import {SupportedLanguages} from "../../domain/SupportedLanguage";
import {EncodingId, getEolLabel, getShortEncodingLabel} from "../../domain/Encoding";
import {fireEvent} from "../ApplicationEvents";
import {EncodingAction, EventType} from "../../enums";
import {useAnsiCodePage} from "../EncodingInfo";
import {logError} from "../../utils/Log";

export default function Footer() {
    const {data, activeTab, setEncodingPicker} = useEditorContext();
    const ansiCodePage = useAnsiCodePage();

    const showEolMenu = (event: React.MouseEvent<HTMLElement>) => {
        event.preventDefault();

        if (!activeTab) return;

        const rect = event.currentTarget.getBoundingClientRect();

        fireEvent(EventType.SHOW_STATUS_MENU, {eol: activeTab.eol, x: rect.left, y: rect.top}).catch(logError("cannot show the line ending menu"));
    };

    const openEncodingPicker = (event: React.MouseEvent<HTMLElement>) => {
        event.preventDefault();

        setEncodingPicker(EncodingAction.REINTERPRET);
    };

    const encodingLabel = activeTab?.encoding === EncodingId.ANSI && ansiCodePage
        ? `ANSI (${getShortEncodingLabel(ansiCodePage)})`
        : getShortEncodingLabel(activeTab?.encoding);

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
                        <button id={"footerEol"} className={"statusChip chip"} title={"Line endings: click to change"}
                            onClick={showEolMenu} onContextMenu={showEolMenu}>
                            {getEolLabel(activeTab.eol)}
                        </button>
                        <button id={"footerEncoding"} className={"statusChip chip"} title={"Encoding: click to reopen or convert"}
                            onClick={openEncodingPicker} onContextMenu={openEncodingPicker}>
                            {encodingLabel}
                        </button>
                    </>
                }
            </div>
        </div>
    );
}
