import {BrowserWindow, dialog, Menu, MenuItemConstructorOptions, MessageBoxSyncOptions, WebContents} from "electron";
import {RendererChannel, RendererPayload} from "../domain/IpcContract";

export type Sender = <C extends RendererChannel>(channel: C, ...data: RendererPayload<C>) => void;

export function send<C extends RendererChannel>(contents: WebContents, channel: C, ...data: RendererPayload<C>) {
    contents.send(channel, ...data);
}

export const sendToFocusedWindow: Sender = (channel, ...data) => {
    const win = BrowserWindow.getFocusedWindow();

    if (win) send(win.webContents, channel, ...data);
};

export function sendPluginAction(contents: WebContents | undefined, code: string) {
    contents?.send(code);
}

export function broadcast<C extends RendererChannel>(channel: C, ...data: RendererPayload<C>) {
    BrowserWindow.getAllWindows().forEach(win => send(win.webContents, channel, ...data));
}

export function showMessageBox(contents: WebContents, options: MessageBoxSyncOptions) {
    const win = BrowserWindow.fromWebContents(contents);

    return win ? dialog.showMessageBoxSync(win, options) : dialog.showMessageBoxSync(options);
}

export function popupMenu(template: Array<MenuItemConstructorOptions>, win: BrowserWindow, position?: {x?: number, y?: number}) {
    Menu.buildFromTemplate(template).popup({
        window: win,
        x: toCoordinate(position?.x),
        y: toCoordinate(position?.y),
    });
}

function toCoordinate(value: unknown) {
    return typeof value === "number" && Number.isFinite(value) ? Math.round(value) : undefined;
}
