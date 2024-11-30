import {ipcRenderer} from "electron";
import {Titlebar} from "custom-electron-titlebar";

let titlebar;

function initCustomTitlebar() {
    console.log("initializing titlebar..");
    if(titlebar) titlebar.dispose();

    titlebar = new Titlebar({
        titleHorizontalAlignment: 'center',
        shadow: true,
    });

    titlebar.theme = null;
    titlebar.theming = null;
}

window.addEventListener('DOMContentLoaded', () => {
    initCustomTitlebar();
});

ipcRenderer.on("rebuildMenu", initCustomTitlebar);