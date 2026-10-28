import {Ace, Range} from "ace-builds";
import {GoToTarget, SearchQuery} from "../domain/Search";
import {
    createSearchDocument,
    findFirstAtOrAfter,
    offsetToPosition,
    positionToOffset,
    SearchDocument,
    SearchResult,
    searchText,
    TextPosition,
    TextSpan,
} from "../utils/TextSearch";

export interface MatchHighlight {
    marker: Ace.MarkerLike,
    remove: () => void,
}

const BUILT_IN_SEARCH_COMMANDS = ["find", "replace", "replaceall", "gotoline", "findnext", "findprevious", "selectOrFindNext", "selectOrFindPrevious", "findAll", "jumptomatching", "selecttomatching"];
const MATCH_CLASS = "searchMatch";
const SCOPE_CLASS = "searchScope";
const CENTER = 0.5;

export function removeBuiltInSearchCommands(editor: Ace.Editor) {
    BUILT_IN_SEARCH_COMMANDS.forEach(name => editor.commands.removeCommand(name));
}

export function readSearchDocument(session: Ace.EditSession): SearchDocument {
    return createSearchDocument(session.getDocument().getAllLines());
}

export function searchSession(session: Ace.EditSession, query: SearchQuery, scope?: Ace.Range): SearchResult {
    const document = readSearchDocument(session);

    return searchText(document, query, scope && toSpan(document, scope));
}

export function toRange(document: SearchDocument, span: TextSpan): Ace.Range {
    const start = offsetToPosition(document.lineStarts, span.start);
    const end = offsetToPosition(document.lineStarts, span.end);

    return new Range(start.row, start.column, end.row, end.column);
}

export function toSpan(document: SearchDocument, range: Ace.Range): TextSpan {
    return {start: positionToOffset(document.lineStarts, range.start), end: positionToOffset(document.lineStarts, range.end)};
}

export function selectRange(editor: Ace.Editor, range: Ace.Range) {
    editor.selection.setSelectionRange(range);
    editor.renderer.scrollSelectionIntoView(range.start, range.end, CENTER);
}

export function selectPositions(editor: Ace.Editor, start: TextPosition, end: TextPosition) {
    const document = editor.session.getDocument();
    const from = document.clippedPos(start.row, start.column);
    const to = document.clippedPos(end.row, end.column);

    selectRange(editor, new Range(from.row, from.column, to.row, to.column));
}

export function readSearchTerm(editor: Ace.Editor): {text: string, range: Ace.Range} {
    const selection = editor.getSelectionRange();

    if (!selection.isEmpty()) return {text: editor.session.getTextRange(selection), range: selection};

    const cursor = editor.getCursorPosition();
    const word = editor.session.getWordRange(cursor.row, cursor.column);

    return {text: editor.session.getTextRange(word).trim(), range: word};
}

export function goToTarget(editor: Ace.Editor, target: GoToTarget) {
    const position = "offset" in target
        ? editor.session.getDocument().indexToPosition(target.offset, 0)
        : {row: target.line - 1, column: target.column - 1};

    editor.selection.moveToPosition(editor.session.getDocument().clippedPos(position.row, position.column));
    editor.renderer.scrollCursorIntoView(undefined, CENTER);
    editor.focus();
}

export function createAnchoredRange(session: Ace.EditSession, range: Ace.Range): Ace.Range {
    const anchored = range.clone();
    const document = session.getDocument();

    const start: Ace.Anchor & {$insertRight?: boolean} = document.createAnchor(range.start.row, range.start.column);

    start.$insertRight = true;

    anchored.start = start;
    anchored.end = document.createAnchor(range.end.row, range.end.column);

    return anchored;
}

export function addScopeMarker(session: Ace.EditSession, scope: Ace.Range): () => void {
    const id = session.addMarker(scope, SCOPE_CLASS, "text", false);

    return () => {
        session.removeMarker(id);
        (scope.start as unknown as Ace.Anchor).detach();
        (scope.end as unknown as Ace.Anchor).detach();
    };
}

export function addMatchHighlight(editor: Ace.Editor, getResult: () => SearchResult | undefined): MatchHighlight {
    const session = editor.session;
    const marker = session.addDynamicMarker({
        clazz: MATCH_CLASS,
        type: "text",
        update: (html: Array<string>, markerLayer: any, markerSession: Ace.EditSession, config: any) => {
            const result = getResult();

            if (!result || result.matches.length === 0) return;

            const {document, matches} = result;
            const firstVisible = positionToOffset(document.lineStarts, {row: config.firstRow, column: 0});
            const lastVisibleRow = Math.min(config.lastRow, document.lineStarts.length - 1);
            const lastVisible = positionToOffset(document.lineStarts, {row: lastVisibleRow, column: markerSession.getLine(lastVisibleRow).length});

            for (let i = findFirstAtOrAfter(matches, firstVisible); i < matches.length && matches[i].start <= lastVisible; i++) {
                if (matches[i].start === matches[i].end) continue;

                const range = toRange(document, matches[i]).toScreenRange(markerSession);

                if (range.isMultiLine()) markerLayer.drawTextMarker(html, range, MATCH_CLASS, config);
                else markerLayer.drawSingleLineMarker(html, range, MATCH_CLASS, config);
            }
        },
    }, false);

    return {
        marker: marker,
        remove: () => {
            if (marker.id !== undefined) session.removeMarker(marker.id);
        },
    };
}
