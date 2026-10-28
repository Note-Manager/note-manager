import {useEffect, useRef} from "react";
import {EditorTab} from "../../domain/EditorTab";
import {EditorState} from "../../domain/EditorState";
import {EventType} from "../../enums";
import {fireEvent} from "../ApplicationEvents";
import {getStateRevision, markStateChanged} from "../StateChangeTracker";
import {logError} from "../../utils/Log";

const AUTOSAVE_INTERVAL = 5000;

export function useStateAutosave(tabs: Array<EditorTab>, activeTab: EditorTab | undefined) {
    const isEnabled = useRef(false);
    const lastSavedRevision = useRef(-1);
    const latestState = useRef<EditorState>({tabs: tabs, activeTabId: activeTab?.id});

    latestState.current = {tabs: tabs, activeTabId: activeTab?.id};

    useEffect(() => {
        markStateChanged();
    }, [tabs, activeTab]);

    useEffect(() => {
        const timer = setInterval(() => {
            const revision = getStateRevision();

            if (!isEnabled.current || revision === lastSavedRevision.current) return;

            fireEvent(EventType.SAVE_STATE, latestState.current)
                .then(() => lastSavedRevision.current = revision)
                .catch(logError("cannot save the editor state"));
        }, AUTOSAVE_INTERVAL);

        return () => clearInterval(timer);
    }, []);

    return () => {
        isEnabled.current = true;
    };
}
