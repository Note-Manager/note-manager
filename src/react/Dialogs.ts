import {useSyncExternalStore} from "react";
import {getDialogResult, MessageDialog, Notice} from "../domain/Dialog";
import {errorNotice} from "../utils/DialogUtils";
import {logError} from "../utils/Log";
import {EventType} from "../enums";
import {fireEvent, on} from "./ApplicationEvents";

export interface OpenDialog {
    id: number,
    dialog: MessageDialog<unknown>,
    answer: (index: number) => void,
}

export interface ShownNotice extends Notice {
    id: number,
}

interface DialogState {
    dialogs: Array<OpenDialog>,
    notices: Array<ShownNotice>,
}

const listeners = new Set<() => void>();
let state: DialogState = {dialogs: [], notices: []};
let lastId = 0;

function update(changes: Partial<DialogState>) {
    state = {...state, ...changes};
    listeners.forEach(listener => listener());
}

function subscribe(listener: () => void) {
    listeners.add(listener);

    return () => listeners.delete(listener);
}

export function useDialogState() {
    return useSyncExternalStore(subscribe, () => state);
}

export function openDialog(dialog: MessageDialog<unknown>): Promise<number> {
    const id = ++lastId;

    return new Promise(resolve => update({
        dialogs: [...state.dialogs, {
            id,
            dialog,
            answer: index => {
                update({dialogs: state.dialogs.filter(d => d.id !== id)});
                resolve(index);
            },
        }],
    }));
}

export async function showDialog<T>(dialog: MessageDialog<T>): Promise<T> {
    return getDialogResult(dialog, await openDialog(dialog));
}

export function notify(notice: Notice) {
    update({notices: [...state.notices, {...notice, id: ++lastId}]});
}

export function dismissNotice(id: number) {
    update({notices: state.notices.filter(n => n.id !== id)});
}

export function notifyError(message: string) {
    return (err: unknown) => {
        logError(message)(err);
        notify(errorNotice(message, err));
    };
}

export function installDialogEvents() {
    on(EventType.SHOW_MESSAGE_DIALOG, ({id, dialog}) => {
        openDialog(dialog)
            .then(index => fireEvent(EventType.MESSAGE_DIALOG_RESPONSE, {id, index}))
            .catch(logError("cannot answer the dialog"));
    });

    on(EventType.SHOW_NOTICE, notify);
}
