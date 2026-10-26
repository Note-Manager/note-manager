import electron, {BrowserWindow, ipcMain} from "electron";
import {EventType} from "../enums";
import {getFocusedWindow, openInWindow, writeEditorState} from "../utils/EditorUtils";
import {EditorState} from "../domain/EditorState";
import * as Environment from "../utils/EnvironmentUtils";
import {writeFile} from "../utils/FileUtils";

const closingWindows = new Set<number>();

export default function initIpcMainListeners() {
    ipcMain.handle(EventType.FILES_DROPPED, (event, data: any) => {
        if(!data?.files || !Array.isArray(data.files)) return;

        try {
            for (let file of data.files) {
                try {
                    const win = BrowserWindow.fromWebContents(event.sender);
                    if(win) openInWindow(win, file);
                } catch(err) {
                    console.error(err);
                }
            }
        } catch (ignored) {
        }
    });

    ipcMain.handle(EventType.SHOW_SAVE_DIALOG, (event, opts) => {
        const focusedWindow = getFocusedWindow();
        if (!focusedWindow) return;

        return electron.dialog.showSaveDialogSync(focusedWindow, {
            title: opts?.title || "Save",
            defaultPath: opts?.defaultName
        });
    });

    ipcMain.handle(EventType.SHOW_CONFIRMATION, async (event, opts) => {
        const focusedWindow = getFocusedWindow();
        if (!focusedWindow) return;

        const result = electron.dialog.showMessageBoxSync(focusedWindow, {
            type: 'question',
            buttons: ['Cancel', 'Yes'],
            defaultId: 1, // Default selected button index
            cancelId: 0, // Button index for cancel action
            title: opts.title || 'Confirmation',
            message: opts.message,
        });

        return result === 1; // Return true if "Yes" was clicked
    });

    ipcMain.handle(EventType.WRITE_FILE, (event, data: {file: string, content: string}) => {
        if (typeof data?.file !== "string" || !data.file) throw new Error("file is required");

        writeFile(data.file, typeof data.content === "string" ? data.content : "");
    });

    ipcMain.handle(EventType.SAVE_STATE, (event, data: EditorState) => {
        if (closingWindows.has(event.sender.id) || !Array.isArray(data?.tabs)) return;

        try {
            writeEditorState(data, false);
        } catch (err) {
            console.error(err);
        }
    });

    ipcMain.handle(EventType.CLOSE_WITH_STATE, (event, data: EditorState) => {
        const sender = BrowserWindow.fromWebContents(event.sender);

        if(sender) {
            closingWindows.add(event.sender.id);

            console.log("saving state to '" + Environment.getStateFilePath() + "'");

            try {
                writeEditorState(data, true);
            } catch (err) {
                console.error(err);
            }

            sender.removeAllListeners(EventType.CLOSE_WINDOW);
            sender.close();
        }
    });
}