import path from "node:path";
import {backupFile, getFileSize, isBinaryFile, isFileExists, readFileAsync, readFileBytes, writeFileAtomic} from "./FileUtils";
import {EditorTab} from "../domain/EditorTab";
import {documentHash, hash, shortenTabName} from "./TextUtils";
import * as Environment from "./EnvironmentUtils";
import {EditorState} from "../domain/EditorState";
import electron, {BrowserWindow, dialog} from "electron";
import {EventType} from "../enums";
import {findLanguageByFileName} from "../domain/SupportedLanguage";
import {addRecentFile} from "./RecentFiles";
import {decodeText, DecodedText} from "./EncodingUtils";
import {getDetectionOptions} from "../domain/Settings";
import {detectEol, EolType, isKnownEncoding, isKnownEol, toEditorText} from "../domain/Encoding";

export async function readTextFile(file: string, preferredEncoding?: string): Promise<DecodedText> {
    const settings = Environment.getSettings();

    return decodeText(await readFileBytes(file), getDetectionOptions(settings), preferredEncoding, settings?.files?.defaultEol || EolType.LF);
}

export async function fileToTab(file: string) {
    if (!isFileExists(file)) throw new Error("Cannot found file for open: " + file);

    const fileName = path.basename(file);

    const {content, encoding, eol} = await readTextFile(file);

    return {
        id: crypto.randomUUID(),
        name: fileName,
        hash: await documentHash(content, encoding, eol),
        encoding: encoding,
        eol: eol,
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
        editorState = JSON.parse(await readFileAsync(stateFile));
    } catch (err) {
        console.error(`cannot parse state file '${stateFile}': ${err}`);
        backupFile(stateFile, "corrupt");
        return undefined;
    }

    if (!Array.isArray(editorState?.tabs)) return undefined;

    await Promise.all(editorState.tabs.map(async (t) => {
        if (t.isTemp || !t.file) {
            normalizeTempTab(t);
            return;
        }

        let decoded: DecodedText;

        try {
            decoded = await readTextFile(t.file, t.isChanged ? undefined : t.encoding);
        } catch (ignored) {
            console.warn(`expected file '${t.file}' is not found on the system.`);
            t.isTemp = true;
            t.content = t.content ?? "";
            normalizeTempTab(t);
            return;
        }

        const fileHash = await documentHash(decoded.content, decoded.encoding, decoded.eol);

        if (t.isChanged && t.content !== undefined) {
            t.hash = fileHash;
            if (!isKnownEncoding(t.encoding)) t.encoding = decoded.encoding;
            if (!isKnownEol(t.eol)) t.eol = detectEol(t.content, decoded.eol);
            t.content = toEditorText(t.content, t.eol);
            return;
        }

        const isSameContent = t.hash === fileHash || t.hash === await hash(decoded.content);

        t.content = decoded.content;
        t.encoding = decoded.encoding;
        t.eol = decoded.eol;
        t.isChanged = false;
        t.hash = fileHash;

        if (!isSameContent) t.state = undefined;
    }));

    return editorState;
}

function normalizeTempTab(tab: EditorTab) {
    const settings = Environment.getSettings();

    if (!isKnownEncoding(tab.encoding)) tab.encoding = settings?.files?.defaultEncoding;
    if (!isKnownEol(tab.eol)) tab.eol = detectEol(tab.content || "", settings?.files?.defaultEol || EolType.LF);
    if (tab.content !== undefined) tab.content = toEditorText(tab.content, tab.eol);
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

    if (win) sendToWindow(win, channel, data);
}

export function sendToWindow(window: electron.BrowserWindow, channel: string, data?: any) {
    window.webContents.send(channel, data);
}

export const LARGE_FILE_WARNING_SIZE = 50 * 1024 * 1024;

export async function confirmOpen(window: BrowserWindow, file: string) {
    const size = await getFileSize(file);
    const binary = await isBinaryFile(file);

    if (size < LARGE_FILE_WARNING_SIZE && !binary) return true;

    const reason = binary
        ? "This file looks like a binary file."
        : `This file is ${(size / 1024 / 1024).toFixed(1)} MB. Large files may make the editor slow.`;

    const {response} = await dialog.showMessageBox(window, {
        type: "warning",
        buttons: ["Cancel", "Open"],
        defaultId: 1,
        cancelId: 0,
        title: "Open file",
        message: path.basename(file),
        detail: reason + "\n\nDo you want to open it anyway?"
    });

    return response === 1;
}

export async function openInWindow(window: BrowserWindow, file: string) {
    console.log("opening file: " + file + " in " + window.id);

    try {
        if (!(await confirmOpen(window, file))) return;

        const tab = await fileToTab(file);

        sendToWindow(window, EventType.OPEN_TAB, tab);

        addRecentFile(file);
    } catch (err) {
        console.error(`cannot open file '${file}': ${err}`);
    }
}
