import {MutableRefObject, useRef, useState} from "react";
import {Ace} from "ace-builds";
import {describeHit, findAdjacentHit, getHit, HitAddress, HitDetails, SearchRun} from "../../utils/SearchResults";
import {useEditorContext} from "../components/editor/EditorContext";
import {selectPositions} from "../EditorSearch";

export function useSearchResults(editorRef: MutableRefObject<Ace.Editor | undefined>) {
    const {tabs, activeTab, setActiveTab} = useEditorContext();

    const [runs, setRuns] = useState<Array<SearchRun>>([]);
    const [isOpen, setIsOpen] = useState(false);
    const [collapsed, setCollapsed] = useState<Set<string>>(() => new Set());
    const [activeHit, setActiveHit] = useState<HitAddress>();
    const [focusRequest, setFocusRequest] = useState(0);

    const pendingHit = useRef<HitDetails>();

    const selectHit = (editor: Ace.Editor, hit: HitDetails) => selectPositions(editor, hit.start, hit.end);

    const addRun = (run: SearchRun) => {
        setRuns(current => [run, ...current]);
        setActiveHit(undefined);
        setIsOpen(true);
        setFocusRequest(current => current + 1);
    };

    const removeRun = (runId: number) => {
        setRuns(current => current.filter(run => run.id !== runId));
        setActiveHit(current => current?.runId === runId ? undefined : current);
    };

    const clear = () => {
        setRuns([]);
        setCollapsed(new Set());
        setActiveHit(undefined);
    };

    const toggleCollapsed = (key: string) => setCollapsed(current => {
        const next = new Set(current);

        if (!next.delete(key)) next.add(key);

        return next;
    });

    const openHit = (address: HitAddress) => {
        const found = getHit(runs, address);
        const tab = found && tabs.find(t => t.id === found.document.tabId);

        setActiveHit(address);

        if (!found || !tab) return;

        const hit = describeHit(found.document.document, found.hit);

        if (tab === activeTab && editorRef.current) {
            selectHit(editorRef.current, hit);
            return;
        }

        pendingHit.current = hit;
        setActiveTab(tab);
    };

    const stepHit = (isBackwards: boolean) => {
        const next = findAdjacentHit(runs, activeHit, isBackwards);

        if (!next) return;

        setIsOpen(true);
        openHit(next);
    };

    const onEditorLoad = (editor: Ace.Editor) => {
        const hit = pendingHit.current;

        pendingHit.current = undefined;

        if (hit) selectHit(editor, hit);
    };

    const close = () => {
        setIsOpen(false);
        editorRef.current?.focus();
    };

    const toggle = () => {
        if (isOpen) return close();

        setIsOpen(true);
        setFocusRequest(current => current + 1);
    };

    return {
        runs: runs,
        isOpen: isOpen,
        collapsed: collapsed,
        activeHit: activeHit,
        focusRequest: focusRequest,
        addRun: addRun,
        removeRun: removeRun,
        clear: clear,
        toggleCollapsed: toggleCollapsed,
        openHit: openHit,
        nextHit: () => stepHit(false),
        previousHit: () => stepHit(true),
        onEditorLoad: onEditorLoad,
        close: close,
        toggle: toggle,
    };
}

export type SearchResults = ReturnType<typeof useSearchResults>;
