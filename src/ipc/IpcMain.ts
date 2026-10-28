import {ipcMain, IpcMainInvokeEvent} from "electron";
import {InvokeChannel, InvokeRequests, InvokeResponses} from "../domain/IpcContract";

type Handler<C extends InvokeChannel> = (event: IpcMainInvokeEvent, data: InvokeRequests[C]) => InvokeResponses[C] | Promise<InvokeResponses[C]>;

export function handle<C extends InvokeChannel>(channel: C, handler: Handler<C>) {
    ipcMain.handle(channel, handler);
}

export function requireFile(data: {file?: unknown} | undefined): string {
    if (typeof data?.file !== "string" || !data.file) throw new Error("file is required");

    return data.file;
}

export function optionalFile(data: {file?: unknown} | undefined): string | undefined {
    return typeof data?.file === "string" && data.file ? data.file : undefined;
}
