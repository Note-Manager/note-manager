import {BrowserWindow, WebContents} from "electron";
import {handle} from "./IpcMain";
import {EventType} from "../enums";
import {EditorState} from "../domain/EditorState";
import {writeEditorState} from "../utils/EditorUtils";
import {getStateFilePath} from "../utils/EnvironmentUtils";

const closingWindows = new Set<number>();

export function isClosingWindow(contents: WebContents) {
    return closingWindows.has(contents.id);
}

export function registerStateHandlers() {
    handle(EventType.SAVE_STATE, (event, data) => {
        if (closingWindows.has(event.sender.id) || !Array.isArray(data?.tabs)) return;

        saveState(data, false);
    });

    handle(EventType.CLOSE_WITH_STATE, (event, data) => {
        const win = BrowserWindow.fromWebContents(event.sender);

        if (!win) return;

        closingWindows.add(event.sender.id);

        console.log(`saving state to '${getStateFilePath()}'`);

        saveState(data, true);

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
