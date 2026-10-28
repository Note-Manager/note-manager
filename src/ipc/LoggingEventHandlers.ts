import {handle} from "./IpcMain";
import {EventType} from "../enums";

export function registerLoggingHandlers() {
    handle(EventType.LOG_INFO, (event, message) => console.info(message));
    handle(EventType.LOG_WARN, (event, message) => console.warn(message));
    handle(EventType.LOG_ERROR, (event, message) => console.error(message));
}
