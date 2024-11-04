import {ipcMain} from "electron";
import * as Files from "../utils/FileUtils";

export default function initFileEventHandlers() {
    ipcMain.handle("read-file", async (event, filePath) => {
        return Files.readSync(filePath);
    });

    ipcMain.handle("get-system-path", async (event, {name}) => {
        return JSON.stringify(Files.getSystemPath(name));
    });
}