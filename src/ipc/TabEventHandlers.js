import {ipcMain} from "electron";

import TabHandler from "../utils/TabHandler";

const tabHandler = new TabHandler({});

export default function initTabEventHandlers() {
    ipcMain.handle("get-selected-tab", () => {
        console.info("getting selected tab..");
        return tabHandler.getSelectedTab();
    });

    ipcMain.handle("add-tab", (event, {isTemp, name, filePath}) => {
        console.info("adding tab..");
        return tabHandler.addTab({isTemp, name, filePath});
    });

    ipcMain.handle("remove-tab", (event, {tab}) => {
        console.info("removing tab..");
        return tabHandler.removeTab({tab});
    });

    ipcMain.handle("get-tabs", () => {
        console.info("getting tab list..");
        return tabHandler.getTabs();
    });

    ipcMain.handle("select-tab", (event, {tab}) => {
        console.info("selecting tab..");
        return tabHandler.selectTab({tab});
    });
}