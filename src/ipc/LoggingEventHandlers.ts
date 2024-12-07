import {ipcMain} from "electron";
import {EventType} from "../enums";

export default function initLoggingEventHandlers() {
    ipcMain.handle(EventType.LOG_INFO, (event, message) => {
        console.info(message);
    });

    ipcMain.handle(EventType.LOG_WARN, (event, message) => {
        console.warn(message);
    });

    ipcMain.handle(EventType.LOG_ERROR, (event, message) => {
        console.error(message);
    });
}