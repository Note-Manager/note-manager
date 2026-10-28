import {BrowserWindow, dialog, ipcMain} from "electron";
import {EventType, UnsavedChangesChoice} from "../enums";
import {conversionDialog, reinterpretDialog, UNSAVED_CHANGES_BUTTONS, unsavedChangesDialog} from "../utils/DialogUtils";
import {findUnencodableCharacters} from "../utils/EncodingUtils";
import {getEncodingLabel, isKnownEncoding} from "../domain/Encoding";
import {showMessageBox} from "../utils/WindowUtils";

const CONFIRM_BUTTON = 0;

export function registerDialogHandlers() {
    ipcMain.handle(EventType.SHOW_SAVE_DIALOG, (event, data: {title?: string, defaultName?: string}) => {
        const win = BrowserWindow.fromWebContents(event.sender);

        if (!win) return;

        return dialog.showSaveDialogSync(win, {
            title: data?.title || "Save",
            defaultPath: data?.defaultName
        });
    });

    ipcMain.handle(EventType.SHOW_UNSAVED_CHANGES_DIALOG, (event, data: {names?: Array<string>}) => {
        if (!BrowserWindow.fromWebContents(event.sender)) return UnsavedChangesChoice.CANCEL;

        const names = Array.isArray(data?.names) ? data.names : [];

        return UNSAVED_CHANGES_BUTTONS[showMessageBox(event.sender, unsavedChangesDialog(names))]?.choice ?? UnsavedChangesChoice.CANCEL;
    });

    ipcMain.handle(EventType.CONFIRM_REINTERPRET, (event, data: {name?: string, encoding?: string}) => {
        const encodingLabel = isKnownEncoding(data?.encoding) ? getEncodingLabel(data.encoding) : undefined;

        return showMessageBox(event.sender, reinterpretDialog(data?.name, encodingLabel)) === CONFIRM_BUTTON;
    });

    ipcMain.handle(EventType.CONFIRM_CONVERSION, (event, data: {content: string, encoding: string}) => {
        if (!isKnownEncoding(data?.encoding)) return false;

        const unencodable = findUnencodableCharacters(typeof data.content === "string" ? data.content : "", data.encoding);

        if (unencodable.count === 0) return true;

        return showMessageBox(event.sender, conversionDialog(getEncodingLabel(data.encoding), unencodable.count, unencodable.samples)) === CONFIRM_BUTTON;
    });
}
