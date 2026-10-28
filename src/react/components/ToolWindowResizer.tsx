import React, {useRef} from "react";

const STORAGE_KEY = "toolWindowWidth";
const DEFAULT_WIDTH = 400;
const MIN_WIDTH = 220;
const MIN_EDITOR_WIDTH = 320;

export function clampToolWindowWidth(width: number, windowWidth: number): number {
    const max = Math.max(MIN_WIDTH, windowWidth - MIN_EDITOR_WIDTH);

    return Math.round(Math.min(max, Math.max(MIN_WIDTH, width)));
}

export function readToolWindowWidth(): number {
    try {
        const stored = Number(localStorage.getItem(STORAGE_KEY));

        return stored > 0 ? clampToolWindowWidth(stored, window.innerWidth) : DEFAULT_WIDTH;
    } catch {
        return DEFAULT_WIDTH;
    }
}

function storeToolWindowWidth(width: number) {
    try {
        localStorage.setItem(STORAGE_KEY, String(width));
    } catch {
        return;
    }
}

export default function ToolWindowResizer({width, onResize}: { width: number, onResize: (width: number) => void }) {
    const dragRef = useRef<{ startX: number, startWidth: number, width: number }>();

    const onPointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
        if (event.button !== 0) return;

        event.preventDefault();
        event.currentTarget.setPointerCapture(event.pointerId);
        event.currentTarget.classList.add("dragging");
        document.body.classList.add("resizing-tool-window");

        dragRef.current = {startX: event.clientX, startWidth: width, width};
    };

    const onPointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
        const drag = dragRef.current;
        if (!drag) return;

        drag.width = clampToolWindowWidth(drag.startWidth + drag.startX - event.clientX, window.innerWidth);
        onResize(drag.width);
    };

    const onPointerUp = (event: React.PointerEvent<HTMLDivElement>) => {
        const drag = dragRef.current;
        if (!drag) return;

        dragRef.current = undefined;
        event.currentTarget.classList.remove("dragging");
        document.body.classList.remove("resizing-tool-window");

        storeToolWindowWidth(drag.width);
    };

    const onDoubleClick = () => {
        onResize(DEFAULT_WIDTH);
        storeToolWindowWidth(DEFAULT_WIDTH);
    };

    return (
        <div id={"toolWindowResizer"}
             title={"Drag to resize, double-click to reset"}
             onPointerDown={onPointerDown}
             onPointerMove={onPointerMove}
             onPointerUp={onPointerUp}
             onPointerCancel={onPointerUp}
             onDoubleClick={onDoubleClick}/>
    );
}
