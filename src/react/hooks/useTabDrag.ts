import React, {useState} from "react";
import {EditorTab} from "../../domain/EditorTab";
import {TabLayout} from "../../domain/Settings";
import {moveTab} from "../../utils/TabUtils";

const TAB_DRAG_TYPE = "application/x-note-manager-tab";

type DragEvent = React.DragEvent<HTMLDivElement>;

export function useTabDrag(tabs: Array<EditorTab>, setTabs: (tabs: Array<EditorTab>) => void, layout: TabLayout) {
    const [draggedTabId, setDraggedTabId] = useState<string>();
    const [dropTarget, setDropTarget] = useState<{id: string, placeAfter: boolean}>();

    const isTabDrag = (event: DragEvent) => event.dataTransfer.types.includes(TAB_DRAG_TYPE);

    const isDropAfter = (event: DragEvent) => {
        const rect = event.currentTarget.getBoundingClientRect();

        return layout === TabLayout.VERTICAL
            ? event.clientY > rect.top + rect.height / 2
            : event.clientX > rect.left + rect.width / 2;
    };

    const onDragStart = (event: DragEvent, tab: EditorTab) => {
        if (!tab.id) return;

        event.dataTransfer.setData(TAB_DRAG_TYPE, tab.id);
        event.dataTransfer.effectAllowed = "move";

        setDraggedTabId(tab.id);
    };

    const onDragOver = (event: DragEvent, tab: EditorTab) => {
        if (!isTabDrag(event) || !tab.id) return;

        event.preventDefault();
        event.stopPropagation();
        event.dataTransfer.dropEffect = "move";

        const placeAfter = isDropAfter(event);

        if (dropTarget?.id !== tab.id || dropTarget.placeAfter !== placeAfter) setDropTarget({id: tab.id, placeAfter: placeAfter});
    };

    const onDragEnd = () => {
        setDraggedTabId(undefined);
        setDropTarget(undefined);
    };

    const onDrop = (event: DragEvent, tab: EditorTab) => {
        if (!isTabDrag(event)) return;

        event.preventDefault();
        event.stopPropagation();

        const reordered = tab.id ? moveTab(tabs, event.dataTransfer.getData(TAB_DRAG_TYPE), tab.id, isDropAfter(event)) : tabs;

        if (reordered !== tabs) setTabs(reordered);

        onDragEnd();
    };

    const getDropPosition = (tab: EditorTab) => {
        if (!dropTarget || dropTarget.id !== tab.id || draggedTabId === tab.id) return undefined;

        return dropTarget.placeAfter ? "dropAfter" : "dropBefore";
    };

    return {
        isDragged: (tab: EditorTab) => draggedTabId === tab.id,
        getDropPosition,
        onDragStart,
        onDragOver,
        onDrop,
        onDragEnd,
    };
}
