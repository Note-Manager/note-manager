import {EOL_TYPES, EolType} from "../domain/Encoding";
import {EncodingAction, EventType} from "../enums";

type Send = (channel: string, data: any) => void;
type MenuItem = Electron.MenuItemConstructorOptions;

export function createEncodingMenu(send: Send): Array<MenuItem> {
    return [
        {label: "Reopen with Encoding...", click: () => send(EventType.OPEN_ENCODING_PICKER, {action: EncodingAction.REINTERPRET})},
        {label: "Convert to Encoding...", click: () => send(EventType.OPEN_ENCODING_PICKER, {action: EncodingAction.CONVERT})},
        {label: "Detect Encoding Again", click: () => send(EventType.ENCODING_ACTION, {action: EncodingAction.REDETECT})},
        {type: "separator"},
        {label: "Line Endings", submenu: createEolMenu(send)},
    ];
}

export function createEolMenu(send: Send, current?: EolType): Array<MenuItem> {
    return EOL_TYPES.map(e => ({
        label: `${e.label} (${e.description})`,
        type: current ? "radio" : "normal",
        checked: current === e.id,
        click: () => send(EventType.EOL_ACTION, {eol: e.id}),
    }));
}
