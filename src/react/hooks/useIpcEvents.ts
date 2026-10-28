import {DependencyList, useEffect} from "react";
import {off, on} from "../ApplicationEvents";

type Handlers = Record<string, (...args: Array<any>) => void>;

export function useIpcEvents(handlers: Handlers, deps: DependencyList) {
    useEffect(() => {
        const entries = Object.entries(handlers);

        entries.forEach(([channel, handler]) => on(channel, handler));

        return () => entries.forEach(([channel, handler]) => off(channel, handler));
    }, deps);
}
