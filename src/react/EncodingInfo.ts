import {fireEvent} from "./ApplicationEvents";
import {EventType} from "../enums";

let ansiCodePage: Promise<string | undefined> | undefined;

export function getAnsiCodePage(): Promise<string | undefined> {
    if (!ansiCodePage) {
        ansiCodePage = fireEvent(EventType.GET_ENCODING_INFO).then(info => info?.ansiCodePage).catch(err => {
            ansiCodePage = undefined;
            throw err;
        });
    }

    return ansiCodePage;
}
