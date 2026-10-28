import {BrowserWindow, ipcMain, shell} from "electron";
import {EventType, UnencodableChoice} from "../enums";
import {openInWindow, readTextFile} from "../utils/EditorUtils";
import {isFileExists, readFileBytes, writeFile} from "../utils/FileUtils";
import {addRecentFile} from "../utils/RecentFiles";
import {UNENCODABLE_SAVE_BUTTONS, unencodableSaveDialog} from "../utils/DialogUtils";
import {decodeBuffer, encodeText, findUnencodableCharacters, getAnsiCodePage} from "../utils/EncodingUtils";
import {DEFAULT_ENCODING, detectEol, EncodingId, EolType, getEncodingLabel, isKnownEncoding, isKnownEol, toEditorText} from "../domain/Encoding";
import {showMessageBox} from "../utils/WindowUtils";
import {optionalFile, requireFile} from "./IpcPayload";

export function registerFileHandlers() {
    ipcMain.handle(EventType.FILES_DROPPED, (event, data: {files?: Array<string>}) => {
        const win = BrowserWindow.fromWebContents(event.sender);

        if (!win || !Array.isArray(data?.files)) return;

        data.files.forEach(file => openInWindow(win, file));
    });

    ipcMain.handle(EventType.WRITE_FILE, (event, data: {file: string, content: string, encoding?: string, eol?: EolType}) => {
        const file = requireFile(data);
        const content = typeof data.content === "string" ? data.content : "";
        const eol = isKnownEol(data.eol) ? data.eol : EolType.LF;
        let encoding = isKnownEncoding(data.encoding) ? data.encoding : DEFAULT_ENCODING;

        const unencodable = findUnencodableCharacters(content, encoding);

        if (unencodable.count > 0) {
            const options = unencodableSaveDialog(file, getEncodingLabel(encoding), unencodable.count, unencodable.samples);
            const choice = UNENCODABLE_SAVE_BUTTONS[showMessageBox(event.sender, options)]?.choice;

            if (choice === undefined || choice === UnencodableChoice.CANCEL) return {saved: false, encoding: encoding};
            if (choice === UnencodableChoice.CONVERT_TO_UTF8) encoding = EncodingId.UTF8;
        }

        writeFile(file, encodeText(content, encoding, eol));
        addRecentFile(file);

        return {saved: true, encoding: encoding};
    });

    ipcMain.handle(EventType.READ_FILE_AS, async (event, data: {file: string, encoding?: string, fallbackEol?: EolType}) => {
        const file = requireFile(data);

        if (!isKnownEncoding(data.encoding)) return readTextFile(file);

        const text = decodeBuffer(await readFileBytes(file), data.encoding);
        const eol = detectEol(text, isKnownEol(data.fallbackEol) ? data.fallbackEol : EolType.LF);

        return {content: toEditorText(text, eol), encoding: data.encoding, eol: eol};
    });

    ipcMain.handle(EventType.REVEAL_FILE, (event, data: {file: string}) => {
        const file = optionalFile(data);

        if (!file || !isFileExists(file)) return false;

        shell.showItemInFolder(file);

        return true;
    });

    ipcMain.handle(EventType.GET_ENCODING_INFO, () => ({ansiCodePage: getAnsiCodePage()}));
}
