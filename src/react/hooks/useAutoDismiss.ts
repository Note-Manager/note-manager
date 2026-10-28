import {useEffect} from "react";
import {MessageKind} from "../../enums";

const NOTICE_DURATION = 6000;

export function useAutoDismiss(kind: MessageKind, dismiss: () => void) {
    useEffect(() => {
        if (kind === MessageKind.ERROR) return;

        const timer = setTimeout(dismiss, NOTICE_DURATION);

        return () => clearTimeout(timer);
    }, []);
}
