import {ipcMain} from "electron";
import {SupportedLanguages} from "../contants/Enums";
import {format} from "../utils/TextUtils";

export default function initTabEventHandlers() {
    ipcMain.handle("formatText", (event, data) => {
        return format(data?.content, SupportedLanguages.findByFileName(data?.file), data?.options)
    });

}