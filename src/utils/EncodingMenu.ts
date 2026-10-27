import {CHARACTER_SET_GROUPS, EOL_TYPES, EolType, UNICODE_ENCODINGS} from "../domain/Encoding";
import {EncodingAction, EventType} from "../enums";

type Send = (channel: string, data: any) => void;
type MenuItem = Electron.MenuItemConstructorOptions;

export interface CurrentDocument {
    encoding?: string,
    eol?: EolType,
}

function reinterpretItem(send: Send, id: string, label: string, current?: CurrentDocument): MenuItem {
    return {
        label: label,
        type: current ? "radio" : "normal",
        checked: current?.encoding === id,
        click: () => send(EventType.ENCODING_ACTION, {action: EncodingAction.REINTERPRET, encoding: id}),
    };
}

function convertItem(send: Send, id: string, label: string, current?: CurrentDocument): MenuItem {
    return {
        label: label,
        enabled: current?.encoding !== id,
        click: () => send(EventType.ENCODING_ACTION, {action: EncodingAction.CONVERT, encoding: id}),
    };
}

function characterSetsMenu(label: string, createItem: (id: string, label: string) => MenuItem): MenuItem {
    return {
        label: label,
        submenu: CHARACTER_SET_GROUPS.map(group => ({
            label: group.label,
            submenu: group.sets.map(set => createItem(set.id, set.label)),
        })),
    };
}

export function createEncodingMenu(send: Send, current?: CurrentDocument): Array<MenuItem> {
    return [
        ...UNICODE_ENCODINGS.map(e => reinterpretItem(send, e.id, e.label, current)),
        characterSetsMenu("Character Sets", (id, label) => reinterpretItem(send, id, label, current)),
        {type: "separator"},
        ...UNICODE_ENCODINGS.map(e => convertItem(send, e.id, "Convert to " + e.label, current)),
        characterSetsMenu("Convert to Character Set", (id, label) => convertItem(send, id, label, current)),
    ];
}

export function createEolMenu(send: Send, current?: CurrentDocument): Array<MenuItem> {
    return EOL_TYPES.map(e => ({
        label: e.label,
        type: current ? "radio" : "normal",
        checked: current?.eol === e.id,
        click: () => send(EventType.EOL_ACTION, {eol: e.id}),
    }));
}
