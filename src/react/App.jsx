import * as React from 'react';
import {createRoot} from 'react-dom/client';
import {TabManager} from "./components/TabManager.jsx";

import prefs from "../../prefs.json";

if (prefs.theme) {
    const style = document.createElement("style");
    style.id = "theme";

    style.textContent = await FileAPI.readFile(`themes/${prefs.theme.name}.css`);
    document.head.appendChild(style);
}

const root = createRoot(document.getElementById("root"));
root.render(
    <TabManager/>
);