import * as Files from "./FileUtils.js";
import {Tab} from "../domain/Tab";

const DEFAULT_TAB_NAME = "New Document.txt";

export default class TabHandler {
    currentTabs = [];

    selectedTab = undefined;

    constructor({tabs}) {
        if(tabs && Array.isArray(tabs)) {
            if(! tabs.every(item => item instanceof Tab)) throw new Error("invalid input: " + JSON.stringify(tabs));

            this.currentTabs = tabs;
        } else {
            this.addTab({isTemp: true});
        }
    }

    addTab({isTemp, name, filePath}) {
        let tab;

        const tabId = crypto.randomUUID();

        if(isTemp) {
            tab = new Tab(
                tabId,
                this.containsWithName(DEFAULT_TAB_NAME) ? generateUniqueName(this.currentTabs, DEFAULT_TAB_NAME) : DEFAULT_TAB_NAME,
                null,
                "");
        } else {
            if(!filePath) throw new Error("File is required");

            const existingTab = this.currentTabs.find(t => t.filePath === filePath);
            if(existingTab) return existingTab;

            tab = new Tab(
                tabId,
                this.containsWithName(name) ? filePath : name,
                filePath,
                Files.readSync(filePath));
        }

        this.currentTabs.push(tab);

        return tab;
    }

    removeTab({tab}) {
        for(let t of this.currentTabs) {
            if(t.id === tab.id) {
                const indexToDelete = this.currentTabs.indexOf(t);

                this.currentTabs.splice(indexToDelete, 1);

                if(this.selectedTab?.id === t.id) {
                    this.selectedTab = this.currentTabs[indexToDelete > 0 ? indexToDelete - 1 : 0];
                }

                return;
            }
        }

        throw new Error("Cannot find tab to remove");
    }

    selectTab({tab}) {
        for(let t of this.currentTabs) {
            if(t.id === tab.id) {
                this.selectedTab = t;
                return;
            }
        }

        throw new Error("Cannot find tab to select");
    }

    getSelectedTab() {
        return this.selectedTab;
    }

    containsWithName(name) {
        return this.currentTabs.filter(tab => tab.name === name).length > 0;
    }

    getTabs() {
        return this.currentTabs;
    }
}

const generateUniqueName = (tabs, initialName) => {
    let count = 0;

    let generatedName = initialName;

    while(tabs.some(t => t.name === generatedName)) {
        count ++;
        generatedName = `${initialName} (${count})`;
    }

    return generatedName;
}

