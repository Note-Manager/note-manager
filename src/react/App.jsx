import * as React from 'react';
import {createRoot} from 'react-dom/client';
import {TabManager} from "./components/TabManager.jsx";

function switchTheme() {
    FileAPI.readFile("prefs.json").then(prefs => JSON.parse(prefs)).then(async (prefs) => {
        if(!prefs?.theme?.name) return;

        const themeContent = await FileAPI.readFile("themes/"+prefs.theme.name);

        if(document.querySelector("style#theme")) document.querySelectorAll("style#theme").forEach(theme => theme.remove());

        const style = document.createElement("style");

        log.info("styling with " + prefs.theme.name);

        style.id = "theme";
        style.textContent = themeContent;
        document.head.appendChild(style);
    })
}

switchTheme();

window.ApplicationEvents.onThemeReset((event) => {
    switchTheme();
});

const root = createRoot(document.getElementById("root"));
root.render(
    <TabManager/>
);