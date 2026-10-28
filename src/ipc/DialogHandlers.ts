import {BrowserWindow, dialog} from "electron";
import {handle} from "./IpcMain";
import {EventType} from "../enums";
import {conversionDialog} from "../utils/DialogUtils";
import {findUnencodableCharacters} from "../utils/EncodingUtils";
import {getEncodingLabel, isKnownEncoding} from "../domain/Encoding";
import {answerMessageDialog, showMessageDialog} from "../utils/WindowUtils";

export function registerDialogHandlers() {
    handle(EventType.SHOW_SAVE_DIALOG, (event, data) => {
        const win = BrowserWindow.fromWebContents(event.sender);

        if (!win) return;

        return dialog.showSaveDialogSync(win, {
            title: data?.title || "Save",
            defaultPath: data?.defaultName
        });
    });

    handle(EventType.MESSAGE_DIALOG_RESPONSE, (event, data) => {
        if (typeof data?.id === "number" && typeof data.index === "number") answerMessageDialog(event.sender, data.id, data.index);
    });

    handle(EventType.CONFIRM_CONVERSION, (event, data) => {
        if (!isKnownEncoding(data?.encoding)) return false;

        const unencodable = findUnencodableCharacters(typeof data.content === "string" ? data.content : "", data.encoding);

        if (unencodable.count === 0) return true;

        return showMessageDialog(event.sender, conversionDialog(getEncodingLabel(data.encoding), unencodable.count, unencodable.samples));
    });
}
