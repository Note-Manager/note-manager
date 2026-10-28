import {DependencyList, useEffect} from "react";
import {off, on} from "../ApplicationEvents";
import {RendererEventHandlers} from "../../domain/IpcContract";

export function useIpcEvents(handlers: RendererEventHandlers, deps: DependencyList) {
    useEffect(() => {
        const entries = Object.entries(handlers) as Array<[string, (data?: any) => void]>;

        entries.forEach(([channel, handler]) => on(channel, handler));

        return () => entries.forEach(([channel, handler]) => off(channel, handler));
    }, deps);
}
