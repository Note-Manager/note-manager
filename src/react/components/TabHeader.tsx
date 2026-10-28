import React from "react";
import {FontAwesomeIcon} from "@fortawesome/react-fontawesome";
import {faFileText} from "@fortawesome/free-regular-svg-icons";
import {faRectangleTimes} from "@fortawesome/free-regular-svg-icons/faRectangleTimes";
import {faBookmark} from "@fortawesome/free-regular-svg-icons/faBookmark";
import {EditorTab} from "../../domain/EditorTab";
import {classNames} from "../ClassNames";

const MIDDLE_BUTTON = 1;
const RIGHT_BUTTON = 2;

type DragHandler = (event: React.DragEvent<HTMLDivElement>, tab: EditorTab) => void;

export default function TabHeader({tab, label, isSelected, isDragged, dropPosition, onSelect, onClose, onContextMenu, onDragStart, onDragOver, onDrop, onDragEnd}: {
    tab: EditorTab,
    label: string,
    isSelected: boolean,
    isDragged: boolean,
    dropPosition?: string,
    onSelect: (tab: EditorTab) => void,
    onClose: (tab: EditorTab) => void,
    onContextMenu: (event: React.MouseEvent, tab: EditorTab) => void,
    onDragStart: DragHandler,
    onDragOver: DragHandler,
    onDrop: DragHandler,
    onDragEnd: () => void,
}) {
    const onMouseUp = (event: React.MouseEvent<HTMLDivElement>) => {
        event.stopPropagation();
        event.preventDefault();

        if (event.button === MIDDLE_BUTTON) onClose(tab);
        else if (event.button !== RIGHT_BUTTON) onSelect(tab);
    };

    const className = classNames(
        "editorTabHeader",
        isSelected && "selected",
        tab.isChanged && "changed",
        tab.isPinned && "pinned",
        isDragged && "dragging",
        dropPosition
    );

    return (
        <div id={tab.id} className={className}
            draggable={true}
            onDragStart={(event) => onDragStart(event, tab)}
            onDragOver={(event) => onDragOver(event, tab)}
            onDrop={(event) => onDrop(event, tab)}
            onDragEnd={onDragEnd}
            onMouseUp={onMouseUp}
            onContextMenu={(event) => onContextMenu(event, tab)}>
            <div>
                <FontAwesomeIcon className={"tabFileIcon"} icon={faFileText}/>
                <span className={"tabHeaderName"} title={tab.file || tab.name}>{label}</span>
            </div>
            <div>
                {tab.isPinned ?
                    <span className={"tabPinIcon"} title={"Pinned"} aria-label={"Pinned"}>
                        <FontAwesomeIcon icon={faBookmark}/>
                    </span> :
                    <button type={"button"} className={"iconButton danger closeTabButton"} aria-label={"Close tab"} title={"Close tab"} onClick={(event) => {
                        event.stopPropagation();
                        onClose(tab);
                    }}>
                        <FontAwesomeIcon icon={faRectangleTimes}/>
                    </button>
                }
            </div>
        </div>
    );
}
