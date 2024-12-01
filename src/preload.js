import {ipcRenderer} from "electron";
import {Titlebar} from "custom-electron-titlebar";

let titlebar;

function initCustomTitlebar(event, data) {
    console.log("initializing titlebar..");
    if(titlebar) titlebar.dispose();

    titlebar = new Titlebar({
        titleHorizontalAlignment: 'center',
        shadow: true,
        icon: data?.icon
    });

    titlebar.theme = null;
    titlebar.theming = null;
}

window.addEventListener('DOMContentLoaded', () => {
    initCustomTitlebar();
});

ipcRenderer.on("buildMenu", initCustomTitlebar);