import {useEffect, useState} from "react";
import {fireEvent} from "./ApplicationEvents";
import {EventType} from "../enums";
import {logError} from "../utils/Log";

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

export function useAnsiCodePage() {
    const [codePage, setCodePage] = useState<string>();

    useEffect(() => {
        getAnsiCodePage().then(setCodePage).catch(logError("cannot read the ANSI code page"));
    }, []);

    return codePage;
}
