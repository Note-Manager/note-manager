import {MutableRefObject, useEffect, useRef, useState} from "react";
import {Ace} from "ace-builds";
import {addToHistory, SearchMode, SearchOptions, SearchQuery, SearchTarget} from "../../domain/Search";
import {execAt, expandReplacement, findMatchIndex, findNextIndex, positionToOffset, SearchResult} from "../../utils/TextSearch";
import {SearchRun} from "../../utils/SearchResults";
import {logError} from "../../utils/Log";
import {countOf} from "../../utils/TextUtils";
import {
    addMatchHighlight,
    addScopeMarker,
    createAnchoredRange,
    MatchHighlight,
    readSearchTerm,
    removeBuiltInSearchCommands,
    searchSession,
    selectRange,
    toRange,
    toSpan,
} from "../EditorSearch";
import {readSearchHistory, readSearchOptions, storeSearchHistory, storeSearchOptions} from "../SearchStorage";
import {createDebouncer} from "../Debounce";
import {findInDocuments, replaceInDocuments, ReplaceSummary, SearchSource} from "../OpenDocuments";
import {markStateChanged} from "../StateChangeTracker";
import {useEditorContext} from "../components/editor/EditorContext";

export interface SearchStatus {
    count: number,
    current: number,
    error?: string,
}

const REFRESH_DELAY = 100;
const MESSAGES = {
    NO_RESULTS: "No results",
    NO_MORE_RESULTS: "No more results",
    SELECT_TEXT_FIRST: "Select the text to search in first",
    replaced: ({count, documentCount}: ReplaceSummary, target: SearchTarget) => `Replaced ${countOf(count, "match", "matches")}`
        + (target === SearchTarget.OPEN_DOCUMENTS ? ` in ${countOf(documentCount, "document")}` : ""),
    found: ({hitCount, documents}: SearchRun) => `Found ${countOf(hitCount, "match", "matches")} in ${countOf(documents.length, "document")}`,
};

const debounceRefresh = createDebouncer(REFRESH_DELAY);

export function useEditorSearch(editorRef: MutableRefObject<Ace.Editor | undefined>, onFindAll: (run: SearchRun) => void) {
    const {tabs, activeTab, setTabs} = useEditorContext();
    const [isOpen, setIsOpen] = useState(false);
    const [isReplace, setIsReplace] = useState(false);
    const [text, setText] = useState("");
    const [replacement, setReplacement] = useState("");
    const [options, setOptions] = useState<SearchOptions>(readSearchOptions);
    const [history, setHistory] = useState(readSearchHistory);
    const [scope, setScope] = useState<Ace.Range>();
    const [target, setTarget] = useState(SearchTarget.DOCUMENT);
    const [message, setMessage] = useState<string>();
    const [focusRequest, setFocusRequest] = useState(0);
    const [revision, setRevision] = useState(0);

    const isOpenRef = useRef(isOpen);
    const documentVersion = useRef(0);
    const origin = useRef<Ace.Point>({row: 0, column: 0});
    const cache = useRef<{session: Ace.EditSession, version: number, key: string, scope?: Ace.Range, result: SearchResult}>();
    const highlight = useRef<MatchHighlight>();
    const removeScopeMarker = useRef<() => void>();
    const highlightedResult = useRef<() => SearchResult | undefined>(() => undefined);

    const query: SearchQuery = {...options, text: text};

    const resultFor = (searchQuery: SearchQuery): SearchResult | undefined => {
        const session = editorRef.current?.session;

        if (!session) return undefined;

        const key = JSON.stringify(searchQuery);
        const cached = cache.current;

        if (cached && cached.session === session && cached.version === documentVersion.current && cached.key === key && cached.scope === scope) return cached.result;

        const result = searchSession(session, searchQuery, scope);

        cache.current = {session: session, version: documentVersion.current, key: key, scope: scope, result: result};

        return result;
    };

    isOpenRef.current = isOpen;
    highlightedResult.current = () => isOpen ? resultFor(query) : undefined;

    const refreshIfOpen = () => {
        if (isOpenRef.current) debounceRefresh(() => setRevision(current => current + 1));
    };

    const changeScope = (next?: Ace.Range) => {
        removeScopeMarker.current?.();
        removeScopeMarker.current = undefined;

        const session = editorRef.current?.session;

        if (next && session) removeScopeMarker.current = addScopeMarker(session, next);

        setScope(next);
    };

    const showHighlight = (editor: Ace.Editor) => {
        highlight.current?.remove();
        highlight.current = addMatchHighlight(editor, () => highlightedResult.current());
    };

    const onEditorLoad = (editor: Ace.Editor) => {
        removeBuiltInSearchCommands(editor);
        removeScopeMarker.current = undefined;
        setScope(undefined);

        editor.session.on("change", () => {
            documentVersion.current++;
            refreshIfOpen();
        });
        editor.on("changeSelection", refreshIfOpen);

        if (isOpen) showHighlight(editor);
    };

    useEffect(() => {
        const editor = editorRef.current;

        if (!editor) return;

        if (isOpen) showHighlight(editor);
        else highlight.current?.remove();
    }, [isOpen]);

    useEffect(() => {
        editorRef.current?.renderer.updateBackMarkers();
    }, [isOpen, revision, text, options, scope]);

    const rememberFind = (term: string) => {
        const next = {...history, find: addToHistory(history.find, term)};

        setHistory(next);
        storeSearchHistory(next);
    };

    const rememberReplace = () => {
        const next = {find: addToHistory(history.find, text), replace: addToHistory(history.replace, replacement)};

        setHistory(next);
        storeSearchHistory(next);
    };

    const selectMatch = (editor: Ace.Editor, result: SearchResult, index: number) => {
        const range = toRange(result.document, result.matches[index]);

        selectRange(editor, range);
        origin.current = range.start;
    };

    const jumpFromOrigin = (searchQuery: SearchQuery) => {
        const editor = editorRef.current;
        const result = resultFor(searchQuery);

        setMessage(undefined);

        if (!editor || !result?.regex) return;

        const start = positionToOffset(result.document.lineStarts, editor.session.getDocument().clippedPos(origin.current.row, origin.current.column));
        const index = findNextIndex(result.matches, {start: start, end: start}, false, searchQuery.wrap);

        if (index >= 0) selectRange(editor, toRange(result.document, result.matches[index]));
    };

    const open = (withReplace: boolean) => {
        const editor = editorRef.current;

        if (!editor) return;

        const selection = editor.getSelectionRange();

        if (selection.isMultiLine()) changeScope(createAnchoredRange(editor.session, selection));
        else changeScope(undefined);

        const term = selection.isMultiLine() ? "" : readSearchTerm(editor).text;

        if (term) setText(term);

        origin.current = selection.start;
        setIsOpen(true);
        setIsReplace(withReplace);
        setMessage(undefined);
        setFocusRequest(current => current + 1);
    };

    const close = () => {
        setIsOpen(false);
        setMessage(undefined);
        changeScope(undefined);
        editorRef.current?.focus();
    };

    const showMessage = (text?: string) => {
        setMessage(text);
        setIsOpen(true);
    };

    const navigate = (isBackwards: boolean, searchQuery: SearchQuery = query) => {
        const editor = editorRef.current;

        if (!editor) return;

        if (!searchQuery.text) {
            open(isReplace);
            return;
        }

        const result = resultFor(searchQuery);

        rememberFind(searchQuery.text);

        if (!result?.regex) {
            showMessage(result?.error);
            return;
        }

        const index = findNextIndex(result.matches, toSpan(result.document, editor.getSelectionRange()), isBackwards, searchQuery.wrap);

        if (index < 0) {
            showMessage(result.matches.length > 0 ? MESSAGES.NO_MORE_RESULTS : MESSAGES.NO_RESULTS);
            return;
        }

        setMessage(undefined);
        selectMatch(editor, result, index);
    };

    const selectAndFind = (isBackwards: boolean) => {
        const editor = editorRef.current;

        if (!editor) return;

        const term = readSearchTerm(editor);

        if (!term.text) return;

        const literalOptions = {...options, mode: SearchMode.NORMAL};

        editor.selection.setSelectionRange(term.range);
        setText(term.text);
        setOptions(literalOptions);
        storeSearchOptions(literalOptions);
        changeScope(undefined);
        navigate(isBackwards, {...literalOptions, text: term.text});
    };

    const replace = () => {
        const editor = editorRef.current;
        const result = resultFor(query);

        if (!editor || !result?.regex) return navigate(false);

        const selection = editor.getSelectionRange();
        const span = toSpan(result.document, selection);
        const match = findMatchIndex(result.matches, span) >= 0 ? execAt(result.document.text, result.regex, span.start) : undefined;

        rememberReplace();

        if (match) editor.session.replace(selection, expandReplacement(replacement, options.mode, match));

        navigate(false);
    };

    const createSource = (editor: Ace.Editor, searchTarget: SearchTarget): SearchSource | undefined => activeTab && {
        tabs: tabs,
        activeTab: activeTab,
        editor: editor,
        scope: searchTarget === SearchTarget.DOCUMENT ? scope : undefined,
    };

    const replaceAll = () => {
        const editor = editorRef.current;
        const source = editor && createSource(editor, target);

        if (!source || !resultFor(query)?.regex) return navigate(false);

        rememberReplace();

        replaceInDocuments(source, query, target, replacement)
            .then(summary => {
                if (target === SearchTarget.OPEN_DOCUMENTS) {
                    markStateChanged();
                    setTabs([...tabs]);
                }

                setMessage(summary.count > 0 ? MESSAGES.replaced(summary, target) : MESSAGES.NO_RESULTS);
            })
            .catch(logError("cannot replace all"));
    };

    const findAll = (searchTarget: SearchTarget = target) => {
        const editor = editorRef.current;
        const source = editor && createSource(editor, searchTarget);
        const term = editor && (text || readSearchTerm(editor).text);

        if (!source) return;
        if (!term) return open(isReplace);

        const run = findInDocuments(source, {...options, text: term}, searchTarget);

        setText(term);
        setTarget(searchTarget);
        rememberFind(term);

        if ("error" in run) return showMessage(run.error);

        setMessage(run.hitCount === 0 ? MESSAGES.NO_RESULTS : searchTarget === SearchTarget.OPEN_DOCUMENTS ? MESSAGES.found(run) : undefined);
        onFindAll(run);
    };

    const changeTarget = (next: SearchTarget) => {
        setTarget(next);

        if (next === SearchTarget.OPEN_DOCUMENTS) changeScope(undefined);
    };

    const changeText = (next: string) => {
        setText(next);
        jumpFromOrigin({...options, text: next});
    };

    const changeOptions = (changes: Partial<SearchOptions>) => {
        const next = {...options, ...changes};

        setOptions(next);
        storeSearchOptions(next);
        jumpFromOrigin({...next, text: text});
    };

    const toggleInSelection = () => {
        const editor = editorRef.current;

        if (!editor) return;

        if (scope) {
            changeScope(undefined);
            return;
        }

        const selection = editor.getSelectionRange();

        if (selection.isEmpty()) {
            setMessage(MESSAGES.SELECT_TEXT_FIRST);
            return;
        }

        changeScope(createAnchoredRange(editor.session, selection));
        origin.current = selection.start;
    };

    const readStatus = (): SearchStatus | undefined => {
        const editor = editorRef.current;
        const result = isOpen ? resultFor(query) : undefined;

        if (!editor || !result) return undefined;

        return {
            count: result.matches.length,
            current: findMatchIndex(result.matches, toSpan(result.document, editor.getSelectionRange())),
            error: result.error,
        };
    };

    return {
        isOpen: isOpen,
        isReplace: isReplace,
        isInSelection: !!scope,
        text: text,
        replacement: replacement,
        options: options,
        history: history,
        message: message,
        focusRequest: focusRequest,
        status: readStatus(),
        onEditorLoad: onEditorLoad,
        open: open,
        close: close,
        findNext: () => navigate(false),
        findPrevious: () => navigate(true),
        selectAndFindNext: () => selectAndFind(false),
        selectAndFindPrevious: () => selectAndFind(true),
        replace: replace,
        replaceAll: replaceAll,
        target: target,
        findAll: findAll,
        changeTarget: changeTarget,
        changeText: changeText,
        changeReplacement: setReplacement,
        changeOptions: changeOptions,
        toggleReplace: () => setIsReplace(current => !current),
        toggleInSelection: toggleInSelection,
    };
}

export type EditorSearch = ReturnType<typeof useEditorSearch>;
