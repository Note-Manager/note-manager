import * as React from 'react';
import {createRoot} from 'react-dom/client';
import TabManager from "./components/TabManager";

const reactRoot = document.getElementById("root");

if(reactRoot) {
    const root = createRoot(reactRoot);

    root.render(
        <TabManager/>
    );
} else {
    throw new Error("Cannot find react root");
}