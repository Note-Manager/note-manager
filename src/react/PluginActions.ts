import {off, on} from "./ApplicationEvents";
import {getAllPlugins} from "./UserPluginRegistry";

let subscriptions: Array<() => void> = [];

export function listenPluginActions() {
    stopListeningPluginActions();

    getAllPlugins().forEach(plugin => {
        plugin.getAvailableActions().forEach(code => {
            const listener = () => plugin.doAction(code);

            on(code, listener);
            subscriptions.push(() => off(code, listener));
        });
    });
}

export function stopListeningPluginActions() {
    subscriptions.forEach(unsubscribe => unsubscribe());
    subscriptions = [];
}
