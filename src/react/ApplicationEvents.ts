import {EventType} from "../enums";

type Listener = (...args: any[]) => any;

interface NoteManagerBridge {
    invoke: (channel: string, data?: any) => Promise<any>;
    on: (channel: string, callback: Listener) => () => void;
    getPathForFile: (file: File) => string;
}

declare global {
    interface Window {
        noteManager: NoteManagerBridge;
    }
}

const subscriptions = new Map<string, Map<Listener, () => void>>();

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

export async function fireEvent(channel: EventType, data?: any) {
    return await window.noteManager.invoke(channel, data);
}

export function getPathForFile(file: File) {
    return window.noteManager.getPathForFile(file);
}
