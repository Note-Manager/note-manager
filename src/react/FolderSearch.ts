import {SearchQuery, SearchTarget} from "../domain/Search";
import {FileSearchSummary, FolderSearch} from "../domain/FindInFiles";
import {EventType} from "../enums";
import {SearchRun} from "../utils/SearchResults";
import {replaceInFilesDialog, skippedFilesNotice} from "../utils/DialogUtils";
import {findInDocuments, nextRunId, replaceInDocuments, ReplaceSummary, SearchSource, targetTabs} from "./OpenDocuments";
import {fireEvent} from "./ApplicationEvents";
import {notify, showDialog} from "./Dialogs";

export interface FolderSearchResult {
    count: number,
    fileCount: number,
    isCancelled: boolean,
    error?: string,
}

export function findInFolder(source: SearchSource, query: SearchQuery, folder: FolderSearch, onRun: (run: SearchRun) => void): Promise<FolderSearchResult> | {error: string} {
    const run = findInDocuments({...source, folder: folder}, query, SearchTarget.FOLDER);

    if ("error" in run) return run;

    onRun({...run, progress: {scanned: 0, isDone: false, isCancelled: false}});

    return fireEvent(EventType.FIND_IN_FILES, {id: run.id, folder: folder, query: query, skipFiles: openFiles(source, folder)})
        .then(summary => combine({count: run.hitCount, documentCount: run.documents.length}, summary, summary.hitCount, summary.matched));
}

export async function replaceInFolder(source: SearchSource, query: SearchQuery, folder: FolderSearch, template: string): Promise<FolderSearchResult | undefined> {
    if (!await showDialog(replaceInFilesDialog(folder.directory, query.text, template))) return undefined;

    const folderSource = {...source, folder: folder};
    const inTabs = await replaceInDocuments(folderSource, query, SearchTarget.FOLDER, template);
    const summary = await fireEvent(EventType.FIND_IN_FILES, {id: nextRunId(), folder: folder, query: query, replacement: template, skipFiles: openFiles(source, folder)});

    if (summary.skipped.length > 0) notify(skippedFilesNotice(summary.skipped));

    return combine(inTabs, summary, summary.replaced, summary.replacedFiles);
}

function openFiles(source: SearchSource, folder: FolderSearch): Array<string> {
    return targetTabs({...source, folder: folder}, SearchTarget.FOLDER).flatMap(tab => tab.file ? [tab.file] : []);
}

function combine(inTabs: ReplaceSummary, summary: FileSearchSummary, count: number, fileCount: number): FolderSearchResult {
    return {count: inTabs.count + count, fileCount: inTabs.documentCount + fileCount, isCancelled: summary.isCancelled, error: summary.error};
}
