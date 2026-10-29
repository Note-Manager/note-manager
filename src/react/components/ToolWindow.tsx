import React, {useEffect, useRef} from "react";
import DOMPurify from "dompurify";
import {FontAwesomeIcon} from "@fortawesome/react-fontawesome";
import {faTimesRectangle} from "@fortawesome/free-regular-svg-icons/faTimesRectangle";
import {ToolbarMenuItem, ToolWindowContext} from "./editor/plugins";
import PanelResizer, {ResizeAxis} from "./PanelResizer";
import {TOOL_WINDOW_PANEL} from "./PanelSizes";

export default function ToolWindow({tool, context, width, onResize, onClose}: {
    tool: ToolbarMenuItem,
    context: ToolWindowContext,
    width: number,
    onResize: (width: number) => void,
    onClose: () => void,
}) {
    const contentRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const content = contentRef.current;

        if (!content) return;

        const shadow = content.attachShadow({mode: "open"});

        shadow.innerHTML = DOMPurify.sanitize(tool.getToolbarWindowContent());

        return tool.onContentMount?.(shadow, context);
    }, []);

    return (
        <>
            <PanelResizer panel={TOOL_WINDOW_PANEL} axis={ResizeAxis.HORIZONTAL} size={width} onResize={onResize}/>
            <div id={"toolWindow"} style={{width: width + "px"}}>
                <div id={"toolWindowHeader"}>
                    <div id={"toolWindowButtons"}>
                        <button type={"button"} className={"iconButton danger"} aria-label={"Close tool window"} title={"Close tool window"} onClick={onClose}>
                            <FontAwesomeIcon icon={faTimesRectangle}/>
                        </button>
                    </div>
                    <div id={"toolWindowTitle"}>
                        <span>{tool.label}</span>
                    </div>
                </div>
                <div id={"toolWindowContent"} ref={contentRef}/>
            </div>
        </>
    );
}
