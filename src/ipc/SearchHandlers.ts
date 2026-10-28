import {shell} from "electron";
import {EventType} from "../enums";
import {buildWebSearchUrl} from "../domain/Search";
import {getSettings} from "../utils/EnvironmentUtils";
import {handle} from "./IpcMain";

export function registerSearchHandlers() {
    handle(EventType.SEARCH_ON_WEB, async (event, data) => {
        const url = buildWebSearchUrl(getSettings().search.webSearchUrl, typeof data?.text === "string" ? data.text : "");

        if (!url) return false;

        await shell.openExternal(url);

        return true;
    });
}
