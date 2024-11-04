import {ipcMain} from "electron";

export default function initLoggingEventHandlers() {
    ipcMain.handle('log-info', (event, message) => {
        console.info(message);
    });

    ipcMain.handle('log-warn', (event, message) => {
        console.warn(message);
    });

    ipcMain.handle('log-error', (event, message) => {
        console.error(message);
    });
}