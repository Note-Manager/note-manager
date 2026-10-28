import {InvokeChannel, InvokePayload, InvokeResponses, RendererChannel, RendererEvents} from "../domain/IpcContract";

type Listener = (data?: any) => void;

interface NoteManagerBridge {
    invoke: (channel: string, data?: unknown) => Promise<any>;
    on: (channel: string, callback: Listener) => () => void;
    getPathForFile: (file: File) => string;
}

declare global {
    interface Window {
        noteManager: NoteManagerBridge;
    }
}

const subscriptions = new Map<string, Map<Listener, () => void>>();

export function on<C extends RendererChannel>(channel: C, callback: (data: RendererEvents[C]) => void): void;
export function on(channel: string, callback: () => void): void;
export function on(channel: string, callback: Listener) {
    off(channel, callback);

    const unsubscribe = window.noteManager.on(channel, callback);

    if (!subscriptions.has(channel)) subscriptions.set(channel, new Map());

    subscriptions.get(channel)?.set(callback, unsubscribe);
}

export function off(channel: string, callback: Listener) {
    const channelSubscriptions = subscriptions.get(channel);

    channelSubscriptions?.get(callback)?.();
    channelSubscriptions?.delete(callback);
}

export function fireEvent<C extends InvokeChannel>(channel: C, ...data: InvokePayload<C>): Promise<InvokeResponses[C]> {
    return window.noteManager.invoke(channel, data[0]);
}

export function getPathForFile(file: File) {
    return window.noteManager.getPathForFile(file);
}
