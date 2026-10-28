import {BrowserWindow, dialog, Menu, MenuItemConstructorOptions, MessageBoxSyncOptions, WebContents} from "electron";

export function sendToFocusedWindow(channel: string, data?: any) {
    BrowserWindow.getFocusedWindow()?.webContents.send(channel, data);
}

export function broadcast(channel: string, data?: any) {
    BrowserWindow.getAllWindows().forEach(win => win.webContents.send(channel, data));
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
