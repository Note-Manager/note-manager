import {BrowserWindow, ipcMain} from "electron";
import {EventType} from "../enums";
import {EditorState} from "../domain/EditorState";
import {writeEditorState} from "../utils/EditorUtils";
import {getStateFilePath} from "../utils/EnvironmentUtils";

const closingWindows = new Set<number>();

export function registerStateHandlers() {
    ipcMain.handle(EventType.SAVE_STATE, (event, data: EditorState) => {
        if (closingWindows.has(event.sender.id) || !Array.isArray(data?.tabs)) return;

        saveState(data, false);
    });

    ipcMain.handle(EventType.CLOSE_WITH_STATE, (event, data: EditorState) => {
        const win = BrowserWindow.fromWebContents(event.sender);

        if (!win) return;

        closingWindows.add(event.sender.id);

        console.log(`saving state to '${getStateFilePath()}'`);

        saveState(data, true);

        win.removeAllListeners(EventType.CLOSE_WINDOW);
        win.close();
    });
}

function saveState(state: EditorState, discardUnsaved: boolean) {
    try {
        writeEditorState(state, discardUnsaved);
    } catch (err) {
        console.error(err);
    }
}
