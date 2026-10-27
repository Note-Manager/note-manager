import * as React from "react";
import {useEffect, useRef} from "react";
import {FontAwesomeIcon} from "@fortawesome/react-fontawesome";
import {faFileText} from "@fortawesome/free-regular-svg-icons";
import {faRectangleTimes} from "@fortawesome/free-regular-svg-icons/faRectangleTimes";
import {faPlusSquare} from "@fortawesome/free-regular-svg-icons/faPlusSquare";
import {EditorTab} from "../../domain/EditorTab";
import {fireEvent, off, on} from "../ApplicationEvents";
import {EventType, TabAction} from "../../enums";
import * as TextUtils from "../../utils/TextUtils";
import {shortenTabName} from "../../utils/TextUtils";
import {useEditorContext} from "./editor/EditorContext";
import {findLanguageByFileName} from "../../domain/SupportedLanguage";
import {EditorState} from "../../domain/EditorState";
import {getStateRevision, markStateChanged} from "../StateChangeTracker";
import IpcRendererEvent = Electron.IpcRendererEvent;

const DEFAULT_TAB_NAME = "New Document.txt";
const AUTOSAVE_INTERVAL = 5000;
const MAX_CLOSED_TABS = 20;

export function TabList({onTabSelect, onTabAdd, onTabRemove}: {
    onTabSelect: (tab: EditorTab) => void,
    onTabAdd: (tab: EditorTab) => void,
    onTabRemove: (tab: EditorTab) => void
}) {
    const {tabs, setTabs, activeTab, setActiveTab} = useEditorContext();

    const isStateInitialized = useRef(false);
    const closedTabs = useRef<Array<EditorTab>>([]);
    const latestState = useRef<EditorState>({tabs: tabs, activeTabId: activeTab?.id});
    latestState.current = {tabs: tabs, activeTabId: activeTab?.id};

    const lastSavedRevision = useRef(-1);

    useEffect(() => {
        markStateChanged();
    }, [tabs, activeTab]);

    useEffect(() => {
        const autosaveTimer = setInterval(() => {
            if (!isStateInitialized.current) return;

            const revision = getStateRevision();

            if (revision === lastSavedRevision.current) return;

            fireEvent(EventType.SAVE_STATE, latestState.current)
                .then(() => lastSavedRevision.current = revision)
                .catch(err => console.error(err));
        }, AUTOSAVE_INTERVAL);

        return () => clearInterval(autosaveTimer);
    }, []);

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

        const newTabs = [...tabs, tab];

        setTabs(newTabs);

        tabSelect(tab);

        TextUtils.hash(tab.content || "").then((result) => {
            tab.hash = result;
        });

        if (onTabAdd) onTabAdd(tab);
    }

    const rememberClosedTab = (tab: EditorTab) => {
        closedTabs.current.push({...tab});

        if (closedTabs.current.length > MAX_CLOSED_TABS) closedTabs.current.shift();
    }

    const removeTabsFromList = (tabsToRemove: Array<EditorTab>) => {
        if (tabsToRemove.length === 0) return;

        tabsToRemove.forEach(rememberClosedTab);

        const newTabs = tabs.filter(t => !tabsToRemove.includes(t));

        setTabs(newTabs);

        if (!activeTab || tabsToRemove.includes(activeTab)) tabSelect(newTabs[newTabs.length - 1]);

        if (onTabRemove) tabsToRemove.forEach(onTabRemove);
    }

    const removeTabFromList = (tabToRemove: EditorTab) => {
        removeTabsFromList([tabToRemove]);
    }

    const closeTabs = async (tabsToClose: Array<EditorTab>) => {
        if (tabsToClose.length === 0) return;

        const changedTabs = tabsToClose.filter(t => t.isChanged);

        if (changedTabs.length > 0) {
            const approved = await fireEvent(EventType.SHOW_CONFIRMATION, {
                title: "Unsaved changes",
                message: "All unsaved changes will be lost in following tabs:\n\n" + changedTabs.map(t => t.name).join("\n") + "\n\nDo you want to proceed?"
            });

            if (!approved) return;
        }

        removeTabsFromList(tabsToClose);
    }

    const reopenClosedTab = () => {
        const closedTab = closedTabs.current.pop();

        if (!closedTab) return;

        const existing = closedTab.file ? tabs.find(t => t.file === closedTab.file) : undefined;

        if (existing) {
            tabSelect(existing);
            return;
        }

        const name = closedTab.file ? closedTab.name : generateUniqueName(tabs, closedTab.name || DEFAULT_TAB_NAME);

        const restoredTab: EditorTab = {
            ...closedTab,
            id: crypto.randomUUID(),
            name: name,
            displayName: shortenTabName(name || ""),
        };

        setTabs(orderByPinned([...tabs, restoredTab]));
        tabSelect(restoredTab);
    }

    const togglePin = (tab: EditorTab) => {
        tab.isPinned = !tab.isPinned;

        const others = tabs.filter(t => t !== tab);

        setTabs([...others.filter(t => t.isPinned), tab, ...others.filter(t => !t.isPinned)]);
    }

    const showTabContextMenu = (event: React.MouseEvent, tab: EditorTab) => {
        event.preventDefault();
        event.stopPropagation();

        fireEvent(EventType.SHOW_TAB_CONTEXT_MENU, {
            tabId: tab.id,
            isPinned: !!tab.isPinned,
            hasOtherTabs: tabs.some(t => t !== tab && !t.isPinned),
            hasUnmodifiedTabs: tabs.some(t => !t.isPinned && !t.isChanged),
            hasClosableTabs: tabs.some(t => !t.isPinned),
            canReopen: closedTabs.current.length > 0
        }).catch(err => console.error(err));
    }

    const closeTab = (tabToRemove: EditorTab) => {
        if(!tabToRemove){
            return;
        }
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
        const onNewTab = (event: IpcRendererEvent, data: any) => {
            addTab(
                generateTempTab(
                    generateUniqueName(tabs, DEFAULT_TAB_NAME)
                )
            );
        };

        const handleTabOpen = (event: IpcRendererEvent, data: any) => {
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
                activeTabId: activeTab?.id || tabs[tabs.length - 1]?.id
            };

            await fireEvent(EventType.CLOSE_WITH_STATE, data);
        };

        const onTabAction = (event: any, data: {action: TabAction, tabId?: string}) => {
            const targetTab = tabs.find(t => t.id === data?.tabId);

            switch (data?.action) {
                case TabAction.CLOSE:
                    if (targetTab) closeTab(targetTab);
                    break;
                case TabAction.CLOSE_OTHERS:
                    closeTabs(tabs.filter(t => t !== targetTab && !t.isPinned)).catch(err => console.error(err));
                    break;
                case TabAction.CLOSE_UNMODIFIED:
                    closeTabs(tabs.filter(t => !t.isPinned && !t.isChanged)).catch(err => console.error(err));
                    break;
                case TabAction.CLOSE_ALL:
                    closeTabs(tabs.filter(t => !t.isPinned)).catch(err => console.error(err));
                    break;
                case TabAction.TOGGLE_PIN:
                    if (targetTab) togglePin(targetTab);
                    break;
                case TabAction.REOPEN_CLOSED:
                    reopenClosedTab();
                    break;
            }
        };

        const initializeWithState = (event: any, data: EditorState) => {
            isStateInitialized.current = true;
            setTabs(data.tabs);
            if(data.tabs?.length>0){
                setActiveTab(data.tabs.find(t => t.id === data.activeTabId) || tabs[tabs.length - 1]);
            }
        }

        on(EventType.NEW_TAB, onNewTab);
        on(EventType.OPEN_TAB, handleTabOpen);
        on(EventType.CLOSE_TAB, onCloseTab);
        on(EventType.CLOSE_WINDOW, onCloseWindow);
        on(EventType.INIT_WITH_STATE, initializeWithState);
        on(EventType.TAB_ACTION, onTabAction);

        return () => {
            off(EventType.NEW_TAB, onNewTab);
            off(EventType.OPEN_TAB, handleTabOpen);
            off(EventType.CLOSE_TAB, onCloseTab);
            off(EventType.CLOSE_WINDOW, onCloseWindow);
            off(EventType.INIT_WITH_STATE, initializeWithState);
            off(EventType.TAB_ACTION, onTabAction);
        };
    }, [activeTab, tabs]);

    const handleTabClick = (event: React.MouseEvent<HTMLDivElement, MouseEvent>, tabIdx: number) => {
        event.stopPropagation();
        event.preventDefault();

        if (event.button === 2) return;

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
                        <div id={tab.id} key={tab.id} className={"editorTabHeader" + getOrEmptyString(tab.id === activeTab?.id, " selected") + getOrEmptyString(tab.isChanged || false, " changed") + getOrEmptyString(!!tab.isPinned, " pinned")} onMouseUp={(event) => handleTabClick(event, idx)} onContextMenu={(event) => showTabContextMenu(event, tab)}>
                            <div>
                                <FontAwesomeIcon icon={faFileText}/>
                                <span className={"tabHeaderName"} style={{marginLeft: "5px"}} title={tab.file || tab.name}>{countByName(tabs, tab.name || DEFAULT_TAB_NAME) > 1 ? (tab.file || tab.displayName) : tab.displayName}</span>
                            </div>
                            {!tab.isPinned &&
                                <div>
                                    <FontAwesomeIcon className={"closeTabButton"} icon={faRectangleTimes} onClick={(e) => {
                                        e.stopPropagation();
                                        closeTab(tab);
                                    }}/>
                                </div>
                            }
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

function orderByPinned(tabs: Array<EditorTab>) {
    return [...tabs.filter(t => t.isPinned), ...tabs.filter(t => !t.isPinned)];
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
        isTemp: true,
        state: {scroll: {left: 0, top: 0}, selection: undefined}
    }
}