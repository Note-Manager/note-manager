import path from "node:path";
import {backupFile, getFileSize, isBinaryFile, isFileExists, readFileAsync, readFileBytes, writeFileAtomic} from "./FileUtils";
import {EditorTab} from "../domain/EditorTab";
import {documentHash, hash, shortenTabName} from "./TextUtils";
import * as Environment from "./EnvironmentUtils";
import {EditorState} from "../domain/EditorState";
import {BrowserWindow, dialog} from "electron";
import {EventType} from "../enums";
import {findLanguageByFileName} from "../domain/SupportedLanguage";
import {addRecentFile} from "./RecentFiles";
import {decodeText, DecodedText} from "./EncodingUtils";
import {getDetectionOptions} from "../domain/Settings";
import {detectEol, isKnownEncoding, isKnownEol, toEditorText} from "../domain/Encoding";
import {openLargeOrBinaryFileDialog} from "./DialogUtils";

export async function readTextFile(file: string, preferredEncoding?: string): Promise<DecodedText> {
    const settings = Environment.getSettings();

    return decodeText(await readFileBytes(file), getDetectionOptions(settings), preferredEncoding, settings.files.defaultEol);
}

export async function fileToTab(file: string): Promise<EditorTab> {
    if (!isFileExists(file)) throw new Error("Cannot find the file to open: " + file);

    const name = path.basename(file);
    const {content, encoding, eol} = await readTextFile(file);

    return {
        id: crypto.randomUUID(),
        name: name,
        displayName: shortenTabName(name),
        file: file,
        isTemp: false,
        isChanged: false,
        content: content,
        hash: await documentHash(content, encoding, eol),
        encoding: encoding,
        eol: eol,
        language: findLanguageByFileName(name),
    };
}

export async function readEditorState(): Promise<EditorState | undefined> {
    const stateFile = Environment.getStateFilePath();

    if (!isFileExists(stateFile)) return undefined;

    let editorState: EditorState;

    try {
        editorState = JSON.parse(await readFileAsync(stateFile));
    } catch (err) {
        console.error(`cannot parse state file '${stateFile}': ${err}`);
        backupFile(stateFile, "corrupt");
        return undefined;
    }

    if (!Array.isArray(editorState?.tabs)) return undefined;

    await Promise.all(editorState.tabs.map(restoreTab));

    return editorState;
}

async function restoreTab(tab: EditorTab) {
    if (tab.isTemp || !tab.file) return normalizeTempTab(tab);

    let decoded: DecodedText;

    try {
        decoded = await readTextFile(tab.file, tab.isChanged ? undefined : tab.encoding);
    } catch {
        console.warn(`expected file '${tab.file}' is not found on the system.`);
        tab.isTemp = true;
        tab.content = tab.content ?? "";
        return normalizeTempTab(tab);
    }

    const fileHash = await documentHash(decoded.content, decoded.encoding, decoded.eol);

    if (tab.isChanged && tab.content !== undefined) {
        tab.hash = fileHash;
        if (!isKnownEncoding(tab.encoding)) tab.encoding = decoded.encoding;
        if (!isKnownEol(tab.eol)) tab.eol = detectEol(tab.content, decoded.eol);
        tab.content = toEditorText(tab.content, tab.eol);
        return;
    }

    const isSameContent = tab.hash === fileHash || tab.hash === await hash(decoded.content);

    tab.content = decoded.content;
    tab.encoding = decoded.encoding;
    tab.eol = decoded.eol;
    tab.isChanged = false;
    tab.hash = fileHash;

    if (!isSameContent) tab.state = undefined;
}

function normalizeTempTab(tab: EditorTab) {
    const {defaultEncoding, defaultEol} = Environment.getSettings().files;

    if (!isKnownEncoding(tab.encoding)) tab.encoding = defaultEncoding;
    if (!isKnownEol(tab.eol)) tab.eol = detectEol(tab.content || "", defaultEol);
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

export const LARGE_FILE_WARNING_SIZE = 50 * 1024 * 1024;

export async function confirmOpen(window: BrowserWindow, file: string) {
    const size = await getFileSize(file);
    const isBinary = await isBinaryFile(file);

    if (size < LARGE_FILE_WARNING_SIZE && !isBinary) return true;

    const {response} = await dialog.showMessageBox(window, openLargeOrBinaryFileDialog(path.basename(file), size, isBinary));

    return response === 1;
}

export async function openInWindow(window: BrowserWindow, file: string) {
    try {
        if (!await confirmOpen(window, file)) return;

        window.webContents.send(EventType.OPEN_TAB, await fileToTab(file));

        addRecentFile(file);
    } catch (err) {
        console.error(`cannot open file '${file}': ${err}`);
    }
}
