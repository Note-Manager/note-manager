import {BrowserWindow, dialog, shell} from "electron";
import path from "node:path";
import {Worker} from "node:worker_threads";
import {EventType} from "../enums";
import {buildWebSearchUrl} from "../domain/Search";
import {getDetectionOptions} from "../domain/Settings";
import {addProgress, EMPTY_SEARCH_SUMMARY, FileSearchProgress, FileSearchRequest, FileSearchSummary, WorkerRequest} from "../domain/FindInFiles";
import {getSettings} from "../utils/EnvironmentUtils";
import {getAnsiCodePage} from "../utils/EncodingUtils";
import {send} from "../utils/WindowUtils";
import {handle} from "./IpcMain";

const WORKER_FILE = path.join(__dirname, "find-in-files-worker.cjs").replace(`app.asar${path.sep}`, `app.asar.unpacked${path.sep}`);

const searches = new Map<number, Worker>();

export function registerSearchHandlers() {
    handle(EventType.SEARCH_ON_WEB, async (event, data) => {
        const url = buildWebSearchUrl(getSettings().search.webSearchUrl, typeof data?.text === "string" ? data.text : "");

        if (!url) return false;

        await shell.openExternal(url);

        return true;
    });

    handle(EventType.SHOW_FOLDER_DIALOG, async (event, data) => {
        const win = BrowserWindow.fromWebContents(event.sender);

        if (!win) return undefined;

        const result = await dialog.showOpenDialog(win, {title: "Select folder to search", defaultPath: data?.defaultPath || undefined, properties: ["openDirectory"]});

        return result.canceled ? undefined : result.filePaths[0];
    });

    handle(EventType.FIND_IN_FILES, (event, request) => new Promise<FileSearchSummary>(resolve => {
        const workerRequest: WorkerRequest = {...request, detection: {...getDetectionOptions(getSettings()), ansiCodePage: getAnsiCodePage()}};
        const worker = new Worker(WORKER_FILE, {workerData: workerRequest});
        let summary = EMPTY_SEARCH_SUMMARY;

        const report = (progress: FileSearchProgress) => {
            summary = addProgress(summary, progress);

            if (!event.sender.isDestroyed()) send(event.sender, EventType.FIND_IN_FILES_PROGRESS, progress);
            if (!progress.isDone) return;

            searches.delete(request.id);
            worker.terminate().catch(() => undefined);
            resolve(summary);
        };

        searches.set(request.id, worker);
        worker.on("message", report);
        worker.on("error", error => report(failedProgress(request, summary, error)));
    }));

    handle(EventType.CANCEL_FIND_IN_FILES, (event, data) => {
        searches.get(data?.id)?.postMessage("cancel");
    });
}

function failedProgress(request: FileSearchRequest, summary: FileSearchSummary, error: Error): FileSearchProgress {
    return {id: request.id, files: [], scanned: summary.scanned, replaced: 0, replacedFiles: 0, skipped: [], isDone: true, error: error.message};
}
