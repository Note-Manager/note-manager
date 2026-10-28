import {MessageKind, DialogRole} from "../enums";

export interface DialogAction<T> {
    label: string,
    role: DialogRole,
    value: T,
}

export interface MessageDialog<T> {
    kind: MessageKind,
    title: string,
    message: string,
    detail?: string,
    actions: Array<DialogAction<T>>,
}

export interface Notice {
    kind: MessageKind,
    message: string,
    detail?: string,
}

const BUTTON_ORDER = [DialogRole.DESTRUCTIVE, DialogRole.SECONDARY, DialogRole.CANCEL, DialogRole.PRIMARY];

export function getCancelAction<T>(dialog: MessageDialog<T>): DialogAction<T> {
    return dialog.actions.find(a => a.role === DialogRole.CANCEL) ?? dialog.actions[dialog.actions.length - 1];
}

export function getDialogResult<T>(dialog: MessageDialog<T>, index: number): T {
    return (dialog.actions[index] ?? getCancelAction(dialog)).value;
}

export function getInitialFocusIndex(dialog: MessageDialog<unknown>): number {
    const primary = dialog.actions.findIndex(a => a.role === DialogRole.PRIMARY);

    return primary >= 0 ? primary : dialog.actions.indexOf(getCancelAction(dialog));
}

export function orderDialogActions<T>(actions: Array<DialogAction<T>>): Array<{action: DialogAction<T>, index: number}> {
    return actions
        .map((action, index) => ({action, index}))
        .sort((a, b) => BUTTON_ORDER.indexOf(a.action.role) - BUTTON_ORDER.indexOf(b.action.role));
}
