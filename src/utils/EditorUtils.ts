import path from "node:path";
import {isFileExists, readFile, readSync} from "./FileUtils";
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

export function readEditorState() {
    const stateFile = Environment.getStateFilePath();

    if (!isFileExists(stateFile)) { // restore the state
        return undefined;
    }

    const editorState: EditorState = JSON.parse(readSync(stateFile));

    editorState.tabs.forEach(async (t) => {
        if (!t.isTemp && t.file) {
            try {
                t.content = readFile(t.file);

                const fileHash = await hash(t.content);

                if (t.hash !== fileHash) { // if the file is changed while app is closed, update the tab's hash and unset the state to prevent unwanted undo/redo behaviors
                    t.hash = fileHash;
                    t.isChanged = false;
                    t.state = undefined;
                }
            } catch (ignored) { // if cannot read the file that was opened in the previous session
                console.warn(`expected file '${t.file}' is not found on the system.`);
                t.isTemp = true;
                t.content = "";
            }
        }
    });

    return editorState;
}

export function getFocusedWindow() {
    return BrowserWindow.getFocusedWindow();
}

export function sendToFocusedWindow(channel: string, data?: any) {
    getFocusedWindow()?.webContents.send(channel, data);
}

export function openInFocusedWindow(file: string) {
    console.log("opening file: " + file);
    const win = getFocusedWindow();

    if(win) openInWindow(win, file);
}

export function openInWindow(window: electron.BrowserWindow, file: string) {
    console.log("opening file: " + file + " in " + window.id);
    fileToTab(file).then(tab => {
        window.webContents.send(EventType.OPEN_TAB, tab);
    });
}

