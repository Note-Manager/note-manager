import React, {RefObject, useEffect} from "react";

const FOCUSABLE = "button:not(:disabled), input:not(:disabled), select:not(:disabled), textarea:not(:disabled)";

export function useModalFocus(containerRef: RefObject<HTMLElement | null>, initialFocus: RefObject<HTMLElement | null>) {
    useEffect(() => {
        const previousFocus = document.activeElement;

        initialFocus.current?.focus();

        return () => {
            if (previousFocus instanceof HTMLElement) previousFocus.focus();
        };
    }, []);

    return (event: React.KeyboardEvent) => {
        if (event.key !== "Tab") return;

        const focusable = Array.from(containerRef.current?.querySelectorAll<HTMLElement>(FOCUSABLE) ?? []);
        const first = focusable[0];
        const last = focusable[focusable.length - 1];

        if (!first || !last) return;

        const isLeavingStart = event.shiftKey && document.activeElement === first;
        const isLeavingEnd = !event.shiftKey && document.activeElement === last;

        if (!isLeavingStart && !isLeavingEnd) return;

        event.preventDefault();
        (isLeavingStart ? last : first).focus();
    };
}
