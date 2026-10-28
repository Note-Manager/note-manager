import {MutableRefObject, useRef, useState} from "react";
import {Ace} from "ace-builds";
import {applyProgress, describeHit, DocumentHits, findAdjacentHit, getHit, HitAddress, HitDetails, SearchRun} from "../../utils/SearchResults";
import {EditorTab} from "../../domain/EditorTab";
import {isSamePath} from "../../domain/FindInFiles";
import {EventType} from "../../enums";
import {logError} from "../../utils/Log";
import {useEditorContext} from "../components/editor/EditorContext";
import {selectPositions} from "../EditorSearch";
import {fireEvent} from "../ApplicationEvents";
import {useIpcEvents} from "./useIpcEvents";

interface PendingHit {
    document: DocumentHits,
    hit: HitDetails,
}

export function useSearchResults(editorRef: MutableRefObject<Ace.Editor | undefined>) {
    const {tabs, activeTab, setActiveTab} = useEditorContext();

    const [runs, setRuns] = useState<Array<SearchRun>>([]);
    const [isOpen, setIsOpen] = useState(false);
    const [collapsed, setCollapsed] = useState<Set<string>>(() => new Set());
    const [activeHit, setActiveHit] = useState<HitAddress>();
    const [focusRequest, setFocusRequest] = useState(0);

    const pendingHit = useRef<PendingHit>();

    useIpcEvents({
        [EventType.FIND_IN_FILES_PROGRESS]: progress => setRuns(current => current.map(run => run.id === progress.id ? applyProgress(run, progress) : run)),
    }, []);

    const selectHit = (editor: Ace.Editor, hit: HitDetails) => selectPositions(editor, hit.start, hit.end);

    const cancelRun = (runId: number) => fireEvent(EventType.CANCEL_FIND_IN_FILES, {id: runId}).catch(logError("cannot stop the search"));

    const cancelRunning = (runsToCancel: Array<SearchRun>) => runsToCancel.filter(run => run.progress && !run.progress.isDone).forEach(run => cancelRun(run.id));

    const addRun = (run: SearchRun) => {
        setRuns(current => [run, ...current]);
        setActiveHit(undefined);
        setIsOpen(true);
        setFocusRequest(current => current + 1);
    };

    const removeRun = (runId: number) => {
        cancelRunning(runs.filter(run => run.id === runId));
        setRuns(current => current.filter(run => run.id !== runId));
        setActiveHit(current => current?.runId === runId ? undefined : current);
    };

    const clear = () => {
        cancelRunning(runs);
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

        setActiveHit(address);

        if (!found) return;

        const {document} = found;
        const hit = describeHit(document, found.hit);
        const tab = tabs.find(t => isDocumentOf(document, t));

        if (tab && tab === activeTab && editorRef.current) {
            selectHit(editorRef.current, hit);
            return;
        }

        pendingHit.current = {document: document, hit: hit};

        if (tab) setActiveTab(tab);
        else if (document.file) fireEvent(EventType.FILES_DROPPED, {files: [document.file]}).catch(logError("cannot open " + document.file));
    };

    const stepHit = (isBackwards: boolean) => {
        const next = findAdjacentHit(runs, activeHit, isBackwards);

        if (!next) return;

        setIsOpen(true);
        openHit(next);
    };

    const onEditorLoad = (editor: Ace.Editor) => {
        const pending = pendingHit.current;

        if (!pending || !activeTab || !isDocumentOf(pending.document, activeTab)) return;

        pendingHit.current = undefined;
        selectHit(editor, pending.hit);
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
        cancelRun: cancelRun,
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

function isDocumentOf(document: DocumentHits, tab: EditorTab): boolean {
    return document.tabId === tab.id || (!!document.file && !!tab.file && isSamePath(document.file, tab.file));
}
