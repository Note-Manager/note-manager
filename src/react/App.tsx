import * as React from "react";
import {createRoot} from "react-dom/client";
import TabManager from "./components/TabManager";
import {installUserPluginApi, loadUserPlugins} from "./UserPluginRegistry";
import {on} from "./ApplicationEvents";
import {EventType} from "../enums";
import {installMenuFit} from "./MenuFit";
import {installDialogEvents, notifyError} from "./Dialogs";

installUserPluginApi();
installMenuFit();
installDialogEvents();

const reloadUserPlugins = () => loadUserPlugins().catch(notifyError("Cannot load user plugins"));

on(EventType.USER_PLUGINS_CHANGED, reloadUserPlugins);
reloadUserPlugins();

const reactRoot = document.getElementById("root");

if (reactRoot) {
    const root = createRoot(reactRoot);

    root.render(
        <TabManager/>
    );
} else {
    throw new Error("Cannot find react root");
}