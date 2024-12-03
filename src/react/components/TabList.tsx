import {useEffect} from "react";
import {FontAwesomeIcon} from "@fortawesome/react-fontawesome";
import {faFileText} from "@fortawesome/free-regular-svg-icons";
import {faRectangleTimes} from "@fortawesome/free-regular-svg-icons/faRectangleTimes";
import * as React from "react";
import {faPlusSquare} from "@fortawesome/free-regular-svg-icons/faPlusSquare";
import {ipcRenderer} from "electron";
import {EditorTab} from "../../domain/EditorTab";

const DEFAULT_TAB_NAME = "New Document.txt";

export function TabList({tabs, activeTab, onTabSelect, onTabAdd, onTabRemove}: {
    tabs: Array<EditorTab>,
    activeTab: EditorTab,
    onTabSelect: (tab: EditorTab) => void,
    onTabAdd: (tab: EditorTab) => void,
    onTabRemove: (tab: EditorTab) => void
}) {

    useEffect(() => {
        addTab(
            generateTempTab(
                generateUniqueName(tabs, DEFAULT_TAB_NAME)
            )
        );
    }, []);

    if (activeTab?.id) document.getElementById(activeTab.id)?.scrollIntoView();

    const tabSelect = (tabToSelect: EditorTab) => {
        if (onTabSelect) onTabSelect(tabToSelect);
    }

    const addTab = ({isTemp, name, file, content}: EditorTab) => {
        if (file && tabs.some(t => t.file === file)) {
            return;
        }

        const tab: EditorTab = {
            id: crypto.randomUUID(),
            name: generateUniqueName(tabs, name || DEFAULT_TAB_NAME),
            file: file,
            content: content,
            isTemp: isTemp,
            state: {scroll: {left: 0, top: 0}, selection: undefined}
        };

        tab.displayName = tab.name?.length || 0 > 20 ? tab.name?.substring(0, 20) + "..." : tab.name;

        if (onTabAdd) onTabAdd(tab);
    }

    const closeTab = (tabToRemove: EditorTab) => {
        if (tabToRemove.isChanged) {
            ipcRenderer.invoke("showConfirmation", {
                title: "Unsaved changes",
                message: "All unsaved changes will be lost in " + tabToRemove.name + ". Do you want to proceed?"
            }).then((approved) => {
                if (approved) {
                    if (onTabRemove) onTabRemove(tabToRemove);
                } else {
                    tabSelect(tabToRemove);
                }
            });
        } else {
            if (onTabRemove) onTabRemove(tabToRemove);
        }
    }

    useEffect(() => { // listen for menu accelerators
        const onNewTab = () => {
            addTab(
                generateTempTab(
                    generateUniqueName(tabs, DEFAULT_TAB_NAME)
                )
            );
        };

        const handleTabOpen = (event: any, data: any) => {
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

    const handleTabClick = (event: React.MouseEvent<HTMLDivElement, MouseEvent>, tabIdx: number) => {
        if (event.button === 1) {
            closeTab(tabs[tabIdx]);
        } else {
            tabSelect(tabs[tabIdx]);
        }
    }

    return (
        <div id={"tabListWrapper"}>
            <div id={"tabList"}>
                {tabs && tabs.length > 0 &&
                    tabs.map((tab, idx) => (
                        <div id={tab.id} key={tab.id} className={"editorTabHeader" + getOrEmptyString(tab.id === activeTab.id, " selected") + getOrEmptyString(tab.isChanged || false, " changed")} onMouseUp={(event) => handleTabClick(event, idx)}>
                            <div>
                                <FontAwesomeIcon icon={faFileText}/>
                                <span className={"tabHeaderName"} style={{marginLeft: "5px"}} title={tab.file || tab.name}>{countByName(tabs, tab.name || DEFAULT_TAB_NAME) > 1 ? (tab.file || tab.displayName) : tab.displayName}</span>
                            </div>
                            <div>
                                <FontAwesomeIcon className={"closeTabButton"} icon={faRectangleTimes} onClick={(e) => {
                                    e.stopPropagation();
                                    closeTab(tab);
                                }}/>
                            </div>
                        </div>
                    ))
                }
            </div>
            <div id={"newTabPanel"}>
                <FontAwesomeIcon icon={faPlusSquare} className={"iconButton"} onClick={() => addTab(generateTempTab(generateUniqueName(tabs, DEFAULT_TAB_NAME)))}/>
            </div>
        </div>
    );
}

function getOrEmptyString(condition: boolean, value: string) {
    if (condition) return value;
    else return "";
}

function generateUniqueName(tabs: Array<EditorTab>, initialName: string) {
    let count = 0;

    let generatedName = initialName;

    while (containsWithName(tabs, generatedName)) {
        count++;
        generatedName = `${initialName} (${count})`;
    }

    return generatedName;
}

function containsWithName(tabs: Array<EditorTab>, name: string) {
    return tabs.filter(tab => tab.name === name).length > 0;
}

function countByName(tabs: Array<EditorTab>, name: string) {
    return tabs.filter(tab => tab.name === name).length;
}

function generateTempTab(name:string): EditorTab {
    return {
        id: crypto.randomUUID(),
        name: name,
        state: {scroll: {left: 0, top: 0}, selection: undefined}
    }
}