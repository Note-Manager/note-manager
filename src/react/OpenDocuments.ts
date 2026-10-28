import {Ace} from "ace-builds";
import {EditorTab} from "../domain/EditorTab";
import {EolType, toEditorText} from "../domain/Encoding";
import {SearchQuery, SearchTarget} from "../domain/Search";
import {FolderSearch, isSearchedFile, parseFileFilters, relativePath} from "../domain/FindInFiles";
import {createSearchDocument, offsetToPosition, replaceMatches, SearchResult, searchText, splitLines} from "../utils/TextSearch";
import {DocumentHits, SearchRun} from "../utils/SearchResults";
import {appendReplacement} from "../utils/UndoHistory";
import {refreshIsChanged} from "../utils/TabUtils";
import {searchSession, toRange} from "./EditorSearch";

export interface SearchSource {
    tabs: Array<EditorTab>,
    activeTab: EditorTab,
    editor: Ace.Editor,
    scope?: Ace.Range,
    folder?: FolderSearch,
}

export interface ReplaceSummary {
    count: number,
    documentCount: number,
}

let lastRunId = 0;

export function nextRunId(): number {
    return ++lastRunId;
}

export function findInDocuments(source: SearchSource, query: SearchQuery, target: SearchTarget): SearchRun | {error: string} {
    const documents: Array<DocumentHits> = [];

    for (const tab of targetTabs(source, target)) {
        const result = searchTab(source, tab, query);

        if (result.error) return {error: result.error};
        if (result.matches.length > 0) documents.push({tabId: tab.id || "", name: documentName(source, tab, target), file: tab.file, document: result.document, hits: result.matches});
    }

    return {
        id: nextRunId(),
        query: query,
        target: target,
        documents: documents,
        hitCount: documents.reduce((count, document) => count + document.hits.length, 0),
        directory: target === SearchTarget.FOLDER ? source.folder?.directory : undefined,
    };
}

export async function replaceInDocuments(source: SearchSource, query: SearchQuery, target: SearchTarget, template: string): Promise<ReplaceSummary> {
    const summary: ReplaceSummary = {count: 0, documentCount: 0};

    for (const tab of targetTabs(source, target)) {
        const count = tab === source.activeTab ? replaceInEditor(source, query, template) : await replaceInTab(tab, query, template);

        summary.count += count;
        summary.documentCount += count > 0 ? 1 : 0;
    }

    return summary;
}

export function targetTabs(source: SearchSource, target: SearchTarget): Array<EditorTab> {
    if (target === SearchTarget.DOCUMENT) return [source.activeTab];
    if (target === SearchTarget.OPEN_DOCUMENTS) return source.tabs;

    const folder = source.folder;
    const filters = folder && parseFileFilters(folder.filters);

    return folder && filters ? source.tabs.filter(tab => tab.file && isSearchedFile(folder, filters, tab.file)) : [];
}

function documentName(source: SearchSource, tab: EditorTab, target: SearchTarget): string {
    const relative = target === SearchTarget.FOLDER && tab.file && source.folder ? relativePath(source.folder.directory, tab.file) : undefined;

    return relative ?? tab.name ?? "";
}

function searchTab(source: SearchSource, tab: EditorTab, query: SearchQuery): SearchResult {
    if (tab === source.activeTab) return searchSession(source.editor.session, query, source.scope);

    return searchText(createSearchDocument(splitLines(tab.content || "")), query);
}

function replaceInEditor(source: SearchSource, query: SearchQuery, template: string): number {
    const result = searchSession(source.editor.session, query, source.scope);
    const replaced = result.regex && replaceMatches(result.document.text, result.regex, result.matches, template, query.mode);

    if (!replaced) return 0;

    source.editor.session.replace(toRange(result.document, replaced), replaced.text);

    return result.matches.length;
}

async function replaceInTab(tab: EditorTab, query: SearchQuery, template: string): Promise<number> {
    const result = searchText(createSearchDocument(splitLines(tab.content || "")), query);
    const replaced = result.regex && replaceMatches(result.document.text, result.regex, result.matches, template, query.mode);

    if (!replaced) return 0;

    const text = result.document.text;

    tab.content = toEditorText(text.substring(0, replaced.start) + replaced.text + text.substring(replaced.end), tab.eol ?? EolType.LF);
    tab.state = {
        ...tab.state,
        undoHistory: appendReplacement(tab.state?.undoHistory, offsetToPosition(result.document.lineStarts, replaced.start), text.substring(replaced.start, replaced.end), replaced.text),
    };

    await refreshIsChanged(tab);

    return result.matches.length;
}
