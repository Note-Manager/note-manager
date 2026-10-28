import React, {useRef} from "react";
import {PanelSize} from "./PanelSizes";
import {classNames} from "../ClassNames";

export enum ResizeAxis {
    HORIZONTAL = "horizontal",
    VERTICAL = "vertical",
}

export function readPanelSize(panel: PanelSize): number {
    try {
        const stored = Number(localStorage.getItem(panel.storageKey));

        return stored > 0 ? panel.clamp(stored) : panel.defaultSize;
    } catch {
        return panel.defaultSize;
    }
}

function storePanelSize(panel: PanelSize, size: number) {
    try {
        localStorage.setItem(panel.storageKey, String(size));
    } catch {
        return;
    }
}

export default function PanelResizer({panel, axis, size, onResize}: {panel: PanelSize, axis: ResizeAxis, size: number, onResize: (size: number) => void}) {
    const dragRef = useRef<{start: number, startSize: number, size: number}>();
    const bodyClass = "resizing-" + axis;
    const pointerPosition = (event: React.PointerEvent) => axis === ResizeAxis.HORIZONTAL ? event.clientX : event.clientY;

    const onPointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
        if (event.button !== 0) return;

        event.preventDefault();
        event.currentTarget.setPointerCapture(event.pointerId);
        event.currentTarget.classList.add("dragging");
        document.body.classList.add(bodyClass);

        dragRef.current = {start: pointerPosition(event), startSize: size, size: size};
    };

    const onPointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
        const drag = dragRef.current;
        if (!drag) return;

        drag.size = panel.clamp(drag.startSize + drag.start - pointerPosition(event));
        onResize(drag.size);
    };

    const onPointerUp = (event: React.PointerEvent<HTMLDivElement>) => {
        const drag = dragRef.current;
        if (!drag) return;

        dragRef.current = undefined;
        event.currentTarget.classList.remove("dragging");
        document.body.classList.remove(bodyClass);

        storePanelSize(panel, drag.size);
    };

    const onDoubleClick = () => {
        onResize(panel.defaultSize);
        storePanelSize(panel, panel.defaultSize);
    };

    return (
        <div className={classNames("panelResizer", axis)}
            title={"Drag to resize, double-click to reset"}
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
            onPointerCancel={onPointerUp}
            onDoubleClick={onDoubleClick}/>
    );
}
