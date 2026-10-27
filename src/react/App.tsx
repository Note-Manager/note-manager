import * as React from 'react';
import {createRoot} from 'react-dom/client';
import TabManager from "./components/TabManager";
import {installUserPluginApi, loadUserPlugins} from "./UserPluginRegistry";
import {on} from "./ApplicationEvents";
import {EventType} from "../enums";

installUserPluginApi();

const reloadUserPlugins = () => loadUserPlugins().catch(err => console.error("cannot load user plugins: " + err));

on(EventType.USER_PLUGINS_CHANGED, reloadUserPlugins);
reloadUserPlugins();

const reactRoot = document.getElementById("root");

if(reactRoot) {
    const root = createRoot(reactRoot);

    root.render(
        <TabManager/>
    );
} else {
    throw new Error("Cannot find react root");
}