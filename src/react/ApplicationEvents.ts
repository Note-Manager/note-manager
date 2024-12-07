import {ipcRenderer} from "electron";
import {EventType} from "../enums";

export function on(channel: EventType, callback: (...args: any[]) => any) {
    ipcRenderer.on(channel, callback);
}

export function off(channel: EventType, callback: (...args: any[]) => any) {
    ipcRenderer.off(channel, callback);
}

export async function fireEvent(channel: EventType, data: any) {
    return await ipcRenderer.invoke(channel, data);
}