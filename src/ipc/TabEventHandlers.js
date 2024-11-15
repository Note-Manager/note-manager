import {ipcMain} from "electron";
import {format} from "../utils/TextUtils";

export default function initTabEventHandlers() {
    ipcMain.handle("formatText", (event, data) => {
        return format(data?.content, data?.language, data?.options)
    });

}