import {ipcMain} from "electron";
import * as Files from "../utils/FileUtils";
import * as path from "node:path";

export default function initFileEventHandlers() {
    ipcMain.handle(("getThemeContent"), () => {
       return Files.readSync(path.join(global.themesFolder, global.preferences.theme.name));
    });
}