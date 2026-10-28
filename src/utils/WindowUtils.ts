import {BrowserWindow, Menu, MenuItemConstructorOptions, WebContents} from "electron";
import {RendererChannel, RendererPayload} from "../domain/IpcContract";
import {getDialogResult, MessageDialog, Notice} from "../domain/Dialog";
import {EventType} from "../enums";

const DISMISSED = -1;

const pendingDialogs = new Map<number, {contents: WebContents, close: (index: number) => void}>();
let lastDialogId = 0;

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

export async function showMessageDialog<T>(contents: WebContents, dialog: MessageDialog<T>): Promise<T> {
    const id = ++lastDialogId;

    const index = await new Promise<number>(resolve => {
        const dismiss = () => close(DISMISSED);
        const close = (response: number) => {
            pendingDialogs.delete(id);
            contents.off("destroyed", dismiss);
            contents.off("did-start-loading", dismiss);
            resolve(response);
        };

        pendingDialogs.set(id, {contents, close});
        contents.once("destroyed", dismiss);
        contents.once("did-start-loading", dismiss);
        send(contents, EventType.SHOW_MESSAGE_DIALOG, {id, dialog});
    });

    return getDialogResult(dialog, index);
}

export function answerMessageDialog(contents: WebContents, id: number, index: number) {
    const pending = pendingDialogs.get(id);

    if (pending?.contents === contents) pending.close(index);
}

export function notify(contents: WebContents, notice: Notice) {
    send(contents, EventType.SHOW_NOTICE, notice);
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
