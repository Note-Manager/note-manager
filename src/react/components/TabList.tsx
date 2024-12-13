import * as React from "react";
import {useEffect} from "react";
import {FontAwesomeIcon} from "@fortawesome/react-fontawesome";
import {faFileText} from "@fortawesome/free-regular-svg-icons";
import {faRectangleTimes} from "@fortawesome/free-regular-svg-icons/faRectangleTimes";
import {faPlusSquare} from "@fortawesome/free-regular-svg-icons/faPlusSquare";
import {EditorTab} from "../../domain/EditorTab";
import {fireEvent, off, on} from "../ApplicationEvents";
import {EventType} from "../../enums";
import * as TextUtils from "../../utils/TextUtils";
import {shortenTabName} from "../../utils/TextUtils";
import {useEditorContext} from "./editor/EditorContext";
import {findLanguageByFileName} from "../../domain/SupportedLanguage";
import {EditorState} from "../../domain/EditorState";

const DEFAULT_TAB_NAME = "New Document.txt";

export function TabList({onTabSelect, onTabAdd, onTabRemove}: {
    onTabSelect: (tab: EditorTab) => void,
    onTabAdd: (tab: EditorTab) => void,
    onTabRemove: (tab: EditorTab) => void
}) {
    const {tabs, setTabs, activeTab, setActiveTab} = useEditorContext();

    useEffect(() => {
        if(activeTab?.id) document.getElementById(activeTab.id)?.scrollIntoView();
    }, [activeTab]);

    const tabSelect = (tabToSelect: EditorTab) => {
        setActiveTab(tabToSelect);

        if (onTabSelect) onTabSelect(tabToSelect);
    }

    const addTab = ({isTemp, name, file, content}: EditorTab) => {
        if (file && tabs.some(t => t.file === file)) {
            const existing = tabs.find(t => t.file === file);
            if(existing) tabSelect(existing);
            return;
        }

        const tab: EditorTab = {
            id: crypto.randomUUID(),
            name: generateUniqueName(tabs, name || DEFAULT_TAB_NAME),
            file: file,
            content: content,
            isTemp: isTemp,
            language: findLanguageByFileName(file),
            state: {scroll: {left: 0, top: 0}, selection: undefined}
        };

        tab.displayName = shortenTabName(tab.name||"");

        tabs.push(tab);

        setTabs(tabs);

        tabSelect(tabs[tabs.length - 1]);

        TextUtils.hash(tab.content || "").then((result) => {
            tab.hash = result;
        });

        if (onTabAdd) onTabAdd(tab);
    }

    const removeTabFromList = (tabToRemove: EditorTab) => {
        tabs.splice(tabs.indexOf(tabToRemove), 1);

        const newTabs = [...tabs];

        setTabs(newTabs);
        tabSelect(newTabs[newTabs.length - 1]);

        if (onTabRemove) onTabRemove(tabToRemove);
    }

    const closeTab = (tabToRemove: EditorTab) => {
        if (tabToRemove.isChanged) {
            fireEvent(EventType.SHOW_CONFIRMATION, {
                title: "Unsaved changes",
                message: "All unsaved changes will be lost in " + tabToRemove.name + ". Do you want to proceed?"
            }).then((approved) => {
                if (approved) {
                    removeTabFromList(tabToRemove);
                } else {
                    tabSelect(tabToRemove);
                }
            });
        } else {
            removeTabFromList(tabToRemove);
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

        const onCloseWindow = async () => {
            const unsavedTabs = tabs.filter(t => !t.isTemp && t.file && t.isChanged);
            if(unsavedTabs && unsavedTabs.length > 0) {
                const approved = await fireEvent(EventType.SHOW_CONFIRMATION, {
                    title: "Unsaved changes",
                    message: "All unsaved changes will be lost in following tabs:\n\n" + unsavedTabs.map(t => t.name).join("\n") + "\n\nDo you want to proceed?"
                });

                if(!approved) return;
            }

            const data: EditorState = {
                tabs: tabs,
                activeTabId: activeTab.id || tabs[tabs.length - 1].id
            };

            await fireEvent(EventType.CLOSE_WITH_STATE, data);
        };

        const initializeWithState = (event: any, data: EditorState) => {
            setTabs(data.tabs);
            setActiveTab(data.tabs.find(t => t.id === data.activeTabId) || tabs[tabs.length - 1]);
        }

        on(EventType.NEW_TAB, onNewTab);
        on(EventType.OPEN_TAB, handleTabOpen);
        on(EventType.CLOSE_TAB, onCloseTab);
        on(EventType.CLOSE_WINDOW, onCloseWindow);
        on(EventType.INIT_WITH_STATE, initializeWithState);

        return () => {
            off(EventType.NEW_TAB, onNewTab);
            off(EventType.OPEN_TAB, handleTabOpen);
            off(EventType.CLOSE_TAB, onCloseTab);
            off(EventType.CLOSE_WINDOW, onCloseWindow);
            off(EventType.INIT_WITH_STATE, initializeWithState);
        };
    }, [activeTab]);

    const handleTabClick = (event: React.MouseEvent<HTMLDivElement, MouseEvent>, tabIdx: number) => {
        event.stopPropagation();
        event.preventDefault();

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