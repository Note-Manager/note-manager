import {MutableRefObject, useEffect, useRef} from "react";
import {Ace} from "ace-builds";
import {EditorCommand} from "../../enums";
import {EditorTab} from "../../domain/EditorTab";
import {SearchQuery} from "../../domain/Search";
import {
    findAdjacentRow,
    groupConsecutiveRows,
    invertRows,
    normalizeRows,
    pickLines,
    shiftRows,
    toggleRow,
} from "../../domain/Bookmarks";
import {
    addMarkRule,
    clearMarkStyles,
    createSmartHighlightQuery,
    createTokenQuery,
    getMarkClassName,
    MarkRule,
    MarkStyle,
    normalizeMarkRules,
    readWholeWord,
    TOKEN_STYLES,
} from "../../domain/Marks";
import {offsetToPosition, SearchDocument, SearchResult, searchText} from "../../utils/TextSearch";
import {logError} from "../../utils/Log";
import {addMatchLayers, goToTarget, MatchLayer, readSearchDocument, readSearchTerm, searchSession} from "../EditorSearch";
import {markStateChanged} from "../StateChangeTracker";
import {useEditorContext} from "../components/editor/EditorContext";
import {EditorCommandHandlers} from "./useEditorCommands";

type TabState = NonNullable<EditorTab["state"]>;

const BOOKMARK_CLASS = "bookmark";
const SMART_HIGHLIGHT_CLASS = "smartHighlight";
const STYLE_COMMANDS: Array<{apply: EditorCommand, clear: EditorCommand, style: MarkStyle}> = [
    {apply: EditorCommand.STYLE_1, clear: EditorCommand.CLEAR_STYLE_1, style: MarkStyle.STYLE_1},
    {apply: EditorCommand.STYLE_2, clear: EditorCommand.CLEAR_STYLE_2, style: MarkStyle.STYLE_2},
    {apply: EditorCommand.STYLE_3, clear: EditorCommand.CLEAR_STYLE_3, style: MarkStyle.STYLE_3},
    {apply: EditorCommand.STYLE_4, clear: EditorCommand.CLEAR_STYLE_4, style: MarkStyle.STYLE_4},
    {apply: EditorCommand.STYLE_5, clear: EditorCommand.CLEAR_STYLE_5, style: MarkStyle.STYLE_5},
];

export function useMarks(editorRef: MutableRefObject<Ace.Editor | undefined>) {
    const {settings} = useEditorContext();

    const tab = useRef<EditorTab>();
    const rules = useRef<Array<MarkRule>>([]);
    const bookmarks = useRef<Array<number>>([]);
    const smartHighlight = useRef<SearchQuery>();
    const results = useRef(new Map<string, SearchResult>());
    const searchDocument = useRef<SearchDocument>();
    const isSmartHighlightOn = useRef(settings.search.smartHighlight);

    isSmartHighlightOn.current = settings.search.smartHighlight;

    useEffect(() => {
        editorRef.current?.renderer.updateBackMarkers();
    }, [settings.search.smartHighlight]);

    const saveState = (changes: Partial<TabState>) => {
        if (!tab.current) return;

        markStateChanged();
        tab.current.state = {...tab.current.state, ...changes};
    };

    const forgetResults = () => {
        results.current = new Map();
        searchDocument.current = undefined;
    };

    const readLayers = (session: Ace.EditSession): Array<MatchLayer> => {
        const previous = results.current;
        const next = new Map<string, SearchResult>();

        const layerOf = (query: SearchQuery, className: string): MatchLayer => {
            const key = JSON.stringify(query);
            const result = previous.get(key) ?? next.get(key) ?? searchText(searchDocument.current ??= readSearchDocument(session), query);

            next.set(key, result);

            return {result: result, className: className};
        };

        const smart = isSmartHighlightOn.current && smartHighlight.current ? [layerOf(smartHighlight.current, SMART_HIGHLIGHT_CLASS)] : [];
        const marked = rules.current.map(rule => layerOf(rule.query, getMarkClassName(rule.style)));

        results.current = next;

        return [...smart, ...marked];
    };

    const showBookmarks = (session: Ace.EditSession, rows: Array<number>) => {
        bookmarks.current.forEach(row => session.removeGutterDecoration(row, BOOKMARK_CLASS));
        bookmarks.current = rows;
        rows.forEach(row => session.addGutterDecoration(row, BOOKMARK_CLASS));
    };

    const setBookmarks = (session: Ace.EditSession, rows: Array<number>) => {
        showBookmarks(session, rows);
        saveState({bookmarks: rows});
    };

    const setRules = (editor: Ace.Editor, next: Array<MarkRule>) => {
        rules.current = next;
        saveState({marks: next});
        editor.renderer.updateBackMarkers();
    };

    const refreshSmartHighlight = (editor: Ace.Editor) => {
        const range = editor.getSelectionRange();
        const word = range.isMultiLine() ? undefined : readWholeWord(editor.session.getLine(range.start.row), range.start.column, range.end.column);

        if (word === smartHighlight.current?.text) return;

        smartHighlight.current = word ? createSmartHighlightQuery(word) : undefined;
        editor.renderer.updateBackMarkers();
    };

    const onEditorLoad = (editor: Ace.Editor, loadedTab: EditorTab) => {
        const session = editor.session;

        tab.current = loadedTab;
        forgetResults();
        smartHighlight.current = undefined;
        rules.current = normalizeMarkRules(loadedTab.state?.marks);
        bookmarks.current = [];

        showBookmarks(session, normalizeRows(loadedTab.state?.bookmarks).filter(row => row < session.getLength()));

        session.on("change", delta => {
            const shifted = shiftRows(bookmarks.current, delta);

            forgetResults();

            if (shifted !== bookmarks.current) setBookmarks(session, shifted);
        });
        editor.on("changeSelection", () => refreshSmartHighlight(editor));

        addMatchLayers(editor, () => readLayers(session));
    };

    const goToBookmark = (editor: Ace.Editor, isBackwards: boolean) => {
        const row = findAdjacentRow(bookmarks.current, editor.getCursorPosition().row, isBackwards);

        if (row !== undefined) goToTarget(editor, {line: row + 1, column: 1});
    };

    const copyBookmarkedLines = (editor: Ace.Editor) => {
        const document = editor.session.getDocument();
        const newLine = document.getNewLineCharacter();
        const text = pickLines(document.getAllLines(), bookmarks.current, true).map(line => line + newLine).join("");

        navigator.clipboard.writeText(text).catch(logError("cannot copy the bookmarked lines"));
    };

    const removeLines = (editor: Ace.Editor, isBookmarked: boolean) => {
        const session = editor.session;
        const rows = isBookmarked ? bookmarks.current : invertRows(bookmarks.current, session.getLength());

        session.markUndoGroup();
        groupConsecutiveRows(rows).reverse().forEach(([first, last]) => session.getDocument().removeFullLines(first, last));
        session.markUndoGroup();
    };

    const markAll = (query: SearchQuery, withBookmarks: boolean): SearchResult | undefined => {
        const editor = editorRef.current;

        if (!editor) return undefined;

        const result = searchSession(editor.session, query);

        if (!result.regex) return result;

        const remaining = clearMarkStyles(rules.current, [MarkStyle.FOUND]);

        setRules(editor, result.matches.length > 0 ? addMarkRule(remaining, {style: MarkStyle.FOUND, query: query}) : remaining);

        if (withBookmarks && result.matches.length > 0) {
            const matchedRows = result.matches.map(match => offsetToPosition(result.document.lineStarts, match.start).row);

            setBookmarks(editor.session, normalizeRows([...bookmarks.current, ...matchedRows]));
        }

        return result;
    };

    const styleToken = (editor: Ace.Editor, style: MarkStyle) => {
        const text = readSearchTerm(editor).text;

        if (text) setRules(editor, addMarkRule(rules.current, {style: style, query: createTokenQuery(text)}));
    };

    const commands: EditorCommandHandlers = {
        [EditorCommand.TOGGLE_BOOKMARK]: editor => setBookmarks(editor.session, toggleRow(bookmarks.current, editor.getCursorPosition().row)),
        [EditorCommand.NEXT_BOOKMARK]: editor => goToBookmark(editor, false),
        [EditorCommand.PREVIOUS_BOOKMARK]: editor => goToBookmark(editor, true),
        [EditorCommand.CLEAR_BOOKMARKS]: editor => setBookmarks(editor.session, []),
        [EditorCommand.INVERSE_BOOKMARKS]: editor => setBookmarks(editor.session, invertRows(bookmarks.current, editor.session.getLength())),
        [EditorCommand.COPY_BOOKMARKED_LINES]: copyBookmarkedLines,
        [EditorCommand.CUT_BOOKMARKED_LINES]: editor => {
            copyBookmarkedLines(editor);
            removeLines(editor, true);
        },
        [EditorCommand.REMOVE_BOOKMARKED_LINES]: editor => removeLines(editor, true),
        [EditorCommand.REMOVE_UNBOOKMARKED_LINES]: editor => removeLines(editor, false),
        [EditorCommand.CLEAR_MARKS]: editor => setRules(editor, clearMarkStyles(rules.current, [MarkStyle.FOUND])),
        [EditorCommand.CLEAR_ALL_STYLES]: editor => setRules(editor, clearMarkStyles(rules.current, TOKEN_STYLES)),
        ...Object.fromEntries(STYLE_COMMANDS.flatMap(({apply, clear, style}) => [
            [apply, (editor: Ace.Editor) => styleToken(editor, style)],
            [clear, (editor: Ace.Editor) => setRules(editor, clearMarkStyles(rules.current, [style]))],
        ])),
    };

    return {
        onEditorLoad: onEditorLoad,
        markAll: markAll,
        commands: commands,
    };
}

export type EditorMarks = ReturnType<typeof useMarks>;
