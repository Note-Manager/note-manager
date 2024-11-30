import {useEffect, useRef, useState} from "react";
import {FontAwesomeIcon} from "@fortawesome/react-fontawesome";
import {faFileText} from "@fortawesome/free-regular-svg-icons";
import {faRectangleTimes} from "@fortawesome/free-regular-svg-icons/faRectangleTimes";
import * as React from "react";
import {faPlusSquare} from "@fortawesome/free-regular-svg-icons/faPlusSquare";
import {ipcRenderer} from "electron";

const DEFAULT_TAB_NAME = "New Document.txt";

export function TabList({tabs, activeTab, onTabSelect, onTabAdd, onTabRemove}) {
    useEffect(() => {
        addTab({isTemp: true});
    }, []);

    if(activeTab) document.getElementById(activeTab.id)?.scrollIntoView();

    const tabSelect = (tabToSelect) => {
        if(onTabSelect) onTabSelect(tabToSelect);
    }

    const addTab = ({isTemp, name, file, content}) => {
        if (file && tabs.some(t => t.file === file)) {
            return;
        }

        const tabId = crypto.randomUUID();

        const tab = {
            id: tabId,
            name: generateUniqueName(tabs, name || DEFAULT_TAB_NAME),
            file: file,
            content: content,
            isTemp: isTemp,
        };

        tab.displayName = tab.name.length > 20 ? tab.name.substring(0, 20) + "..." : tab.name;

        if(onTabAdd) onTabAdd(tab);
    }

    const closeTab = (tabToRemove) => {
        if(tabToRemove.isChanged) {
            ipcRenderer.invoke("showConfirmation", {title: "Unsaved changes", message: "All unsaved changes will be lost in " + tabToRemove.name + ". Do you want to proceed?"}).then((approved) => {
                if(approved) {
                    if(onTabRemove) onTabRemove(tabToRemove);
                } else {
                    tabSelect(tabToRemove);
                }
            });
        } else {
            if(onTabRemove) onTabRemove(tabToRemove);
        }
    }

    useEffect(() => { // listen for menu accelerators
        const onNewTab = () => {
            addTab({isTemp: true});
        };

        const handleTabOpen = (event, data) => {
            addTab(data);
        };

        const onCloseTab = () => {
            closeTab(activeTab);
        };

        ipcRenderer.on("newTab", onNewTab);
        ipcRenderer.on("openTab", handleTabOpen);
        ipcRenderer.on("removeTab", onCloseTab);

        return () => {
            ipcRenderer.off("newTab", onNewTab);
            ipcRenderer.off("openTab", handleTabOpen);
            ipcRenderer.off("removeTab", onCloseTab);
        };
    }, [activeTab]);

    const handleTabClick = (event, tabIdx) => {
        if(event.button === 1) {
            closeTab(tabs[tabIdx]);
        }
        else {
            tabSelect(tabs[tabIdx]);
        }
    }

    return (
        <div id={"tabListWrapper"}>
            <div id={"tabList"}>
                {tabs && tabs.length > 0 &&
                    tabs.map((tab, idx) => (
                        <div id={tab.id} key={tab.id} className={"editorTabHeader" + getOrEmptyString(tab.id === activeTab.id, " selected") + getOrEmptyString(tab.isChanged, " changed")} onMouseUp={(event) => handleTabClick(event, idx)}>
                            <div>
                                <FontAwesomeIcon icon={faFileText}/>
                                <span className={"tabHeaderName"} style={{marginLeft: "5px"}} title={tab.file || tab.name}>{countByName(tabs, tab.displayName) > 1 ? (tab.file || tab.displayName) : tab.displayName}</span>
                            </div>
                            <div>
                                <FontAwesomeIcon className={"closeTabButton"} icon={faRectangleTimes} onClick={(e) => {e.stopPropagation(); closeTab(tab);}}/>
                            </div>
                        </div>
                    ))
                }
            </div>
            <div id={"newTabPanel"}>
                <FontAwesomeIcon icon={faPlusSquare} className={"iconButton"} onClick={() => addTab({isTemp: true})}/>
            </div>
        </div>
    );
}

function getOrEmptyString(condition, value) {
    if(condition) return value;
    else return "";
}

function generateUniqueName(tabs, initialName) {
    let count = 0;

    let generatedName = initialName;

    while (containsWithName(tabs, generatedName)) {
        count++;
        generatedName = `${initialName} (${count})`;
    }

    return generatedName;
}

function containsWithName(tabs, name) {
    return tabs.filter(tab => tab.name === name).length > 0;
}

function countByName(tabs, name) {
    return tabs.filter(tab => tab.name === name).length;
}