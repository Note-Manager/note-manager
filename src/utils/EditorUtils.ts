import path from "node:path";
import {backupFile, isFileExists, readFile, readSync, writeFileAtomic} from "./FileUtils";
import {EditorTab} from "../domain/EditorTab";
import {hash, shortenTabName} from "./TextUtils";
import * as Environment from "./EnvironmentUtils";
import {EditorState} from "../domain/EditorState";
import electron, {BrowserWindow} from "electron";
import {EventType} from "../enums";
import {findLanguageByFileName} from "../domain/SupportedLanguage";

export async function fileToTab(file: string) {
    if (!isFileExists(file)) throw new Error("Cannot found file for open: " + file);

    const fileName = path.basename(file);

    const content = readFile(file);

    return {
        id: crypto.randomUUID(),
        name: fileName,
        hash: await hash(content),
        displayName: shortenTabName(fileName),
        file: file,
        isTemp: false,
        isChanged: false,
        content: content,
        language: findLanguageByFileName(fileName)
    } as EditorTab;
}

export async function readEditorState(): Promise<EditorState | undefined> {
    const stateFile = Environment.getStateFilePath();

    if (!isFileExists(stateFile)) {
        return undefined;
    }

    let editorState: EditorState;

    try {
        editorState = JSON.parse(readSync(stateFile));
    } catch (err) {
        console.error(`cannot parse state file '${stateFile}': ${err}`);
        backupFile(stateFile, "corrupt");
        return undefined;
    }

    if (!Array.isArray(editorState?.tabs)) return undefined;

    await Promise.all(editorState.tabs.map(async (t) => {
        if (t.isTemp || !t.file) return;

        let fileContent: string;

        try {
            fileContent = readFile(t.file);
        } catch (ignored) {
            console.warn(`expected file '${t.file}' is not found on the system.`);
            t.isTemp = true;
            t.content = t.content ?? "";
            return;
        }

        const fileHash = await hash(fileContent);

        if (t.isChanged && t.content !== undefined) {
            t.hash = fileHash;
            return;
        }

        t.content = fileContent;
        t.isChanged = false;

        if (t.hash !== fileHash) {
            t.hash = fileHash;
            t.state = undefined;
        }
    }));

    return editorState;
}

let lastWrittenState: string | undefined;

export function writeEditorState(state: EditorState, discardUnsaved: boolean) {
    state.tabs.forEach(t => {
        if (t.isTemp || !t.file) return;

        if (discardUnsaved || !t.isChanged) {
            t.content = undefined;
            t.isChanged = false;
        }
    });

    const serialized = JSON.stringify(state, null, 4);

    if (serialized === lastWrittenState) return;

    writeFileAtomic(Environment.getStateFilePath(), serialized);

    lastWrittenState = serialized;
}

export function getFocusedWindow() {
    return BrowserWindow.getFocusedWindow();
}

export function sendToFocusedWindow(channel: string, data?: any) {
    const win = getFocusedWindow();

    if(win) sendToWindow(win, channel, data);
}

export function sendToWindow(window: electron.BrowserWindow, channel: string, data?: any) {
    window.webContents.send(channel, data);
}

export function openInFocusedWindow(file: string) {
    console.log("opening file: " + file);

    const win = getFocusedWindow();

    if(win) openInWindow(win, file);
}

export function openInWindow(window: electron.BrowserWindow, file: string) {
    console.log("opening file: " + file + " in " + window.id);

    fileToTab(file).then(tab => {
        sendToWindow(window, EventType.OPEN_TAB, tab);
    });
}

