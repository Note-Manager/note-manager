import * as React from "react";
import {useEffect, useRef, useState} from "react";
import {FontAwesomeIcon} from "@fortawesome/react-fontawesome";
import {faFileText} from "@fortawesome/free-regular-svg-icons";
import {faRectangleTimes} from "@fortawesome/free-regular-svg-icons/faRectangleTimes";
import {faPlusSquare} from "@fortawesome/free-regular-svg-icons/faPlusSquare";
import {faBookmark} from "@fortawesome/free-regular-svg-icons/faBookmark";
import {EditorTab} from "../../domain/EditorTab";
import {fireEvent, off, on} from "../ApplicationEvents";
import {EventType, TabAction} from "../../enums";
import * as TextUtils from "../../utils/TextUtils";
import {shortenTabName} from "../../utils/TextUtils";
import {useEditorContext} from "./editor/EditorContext";
import {findLanguageByFileName} from "../../domain/SupportedLanguage";
import {EditorState} from "../../domain/EditorState";
import {getStateRevision, markStateChanged} from "../StateChangeTracker";
import {resolveUnsavedChanges} from "../TabSaver";
import {moveTab, orderByPinned} from "../../utils/TabUtils";
import {TabLayout} from "../../domain/Settings";
import IpcRendererEvent = Electron.IpcRendererEvent;

const DEFAULT_TAB_NAME = "New Document.txt";
const AUTOSAVE_INTERVAL = 5000;
const MAX_CLOSED_TABS = 20;
const TAB_DRAG_TYPE = "application/x-note-manager-tab";

export function TabList() {
    const {tabs, setTabs, activeTab, setActiveTab, settings} = useEditorContext();

    const isStateInitialized = useRef(false);
    const closedTabs = useRef<Array<EditorTab>>([]);
    const latestState = useRef<EditorState>({tabs: tabs, activeTabId: activeTab?.id});
    latestState.current = {tabs: tabs, activeTabId: activeTab?.id};

    const lastSavedRevision = useRef(-1);

    const [draggedTabId, setDraggedTabId] = useState<string>();
    const [dropTarget, setDropTarget] = useState<{id: string, placeAfter: boolean}>();

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
        if (activeTab?.id) document.getElementById(activeTab.id)?.scrollIntoView();
    }, [activeTab]);

    const tabSelect = (tabToSelect: EditorTab) => {
        setActiveTab(tabToSelect);
    };

    const addTab = ({isTemp, name, file, content, encoding, eol}: EditorTab) => {
        if (file && tabs.some(t => t.file === file)) {
            const existing = tabs.find(t => t.file === file);
            if (existing) tabSelect(existing);
            return;
        }

        const tab: EditorTab = {
            id: crypto.randomUUID(),
            name: generateUniqueName(tabs, name || DEFAULT_TAB_NAME),
            file: file,
            content: content,
            isTemp: isTemp,
            encoding: encoding || settings.files.defaultEncoding,
            eol: eol || settings.files.defaultEol,
            language: findLanguageByFileName(file),
            state: {scroll: {left: 0, top: 0}, selection: undefined}
        };

        tab.displayName = shortenTabName(tab.name || "");

        const newTabs = [...tabs, tab];

        setTabs(newTabs);

        tabSelect(tab);

        TextUtils.documentHash(tab.content || "", tab.encoding, tab.eol).then((result) => {
            tab.hash = result;
        });
    };

    const rememberClosedTab = (tab: EditorTab) => {
        closedTabs.current.push({...tab});

        if (closedTabs.current.length > MAX_CLOSED_TABS) closedTabs.current.shift();
    };

    const removeTabsFromList = (tabsToRemove: Array<EditorTab>) => {
        if (tabsToRemove.length === 0) return;

        tabsToRemove.forEach(rememberClosedTab);

        const newTabs = tabs.filter(t => !tabsToRemove.includes(t));

        setTabs(newTabs);

        if (!activeTab || tabsToRemove.includes(activeTab)) tabSelect(newTabs[newTabs.length - 1]);
    };

    const removeTabFromList = (tabToRemove: EditorTab) => {
        removeTabsFromList([tabToRemove]);
    };

    const closeTabs = async (tabsToClose: Array<EditorTab>) => {
        if (tabsToClose.length === 0) return;

        const approved = await resolveUnsavedChanges(tabsToClose.filter(t => t.isChanged));

        if (!approved) {
            setTabs([...tabs]);
            return;
        }

        removeTabsFromList(tabsToClose);
    };

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
    };

    const togglePin = (tab: EditorTab) => {
        tab.isPinned = !tab.isPinned;

        const others = tabs.filter(t => t !== tab);

        setTabs([...others.filter(t => t.isPinned), tab, ...others.filter(t => !t.isPinned)]);
    };

    const revealInFolder = (tab: EditorTab | undefined) => {
        if (!tab?.file) return;

        fireEvent(EventType.REVEAL_FILE, {file: tab.file}).then(isRevealed => {
            if (!isRevealed) console.warn("cannot reveal missing file " + tab.file);
        }).catch(err => console.error(err));
    };

    const showTabContextMenu = (event: React.MouseEvent, tab: EditorTab) => {
        event.preventDefault();
        event.stopPropagation();

        fireEvent(EventType.SHOW_TAB_CONTEXT_MENU, {
            tabId: tab.id,
            isPinned: !!tab.isPinned,
            hasOtherTabs: tabs.some(t => t !== tab && !t.isPinned),
            hasUnmodifiedTabs: tabs.some(t => !t.isPinned && !t.isChanged),
            hasClosableTabs: tabs.some(t => !t.isPinned),
            hasFile: !!tab.file,
            canReopen: closedTabs.current.length > 0
        }).catch(err => console.error(err));
    };

    const closeTab = (tabToRemove: EditorTab) => {
        if (!tabToRemove) {
            return;
        }
        if (tabToRemove.isChanged) {
            resolveUnsavedChanges([tabToRemove]).then((approved) => {
                if (approved) {
                    removeTabFromList(tabToRemove);
                } else {
                    setTabs([...tabs]);
                    tabSelect(tabToRemove);
                }
            }).catch(err => console.error(err));
        } else {
            removeTabFromList(tabToRemove);
        }
    };

    useEffect(() => {
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
            const approved = await resolveUnsavedChanges(tabs.filter(t => !t.isTemp && t.file && t.isChanged));

            if (!approved) {
                setTabs([...tabs]);
                return;
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
                case TabAction.REVEAL_IN_FOLDER:
                    revealInFolder(targetTab || activeTab);
                    break;
            }
        };

        const initializeWithState = (event: any, data: EditorState) => {
            isStateInitialized.current = true;
            setTabs(data.tabs);
            if (data.tabs?.length > 0) {
                setActiveTab(data.tabs.find(t => t.id === data.activeTabId) || tabs[tabs.length - 1]);
            }
        };

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
    }, [activeTab, tabs, settings]);

    const handleTabClick = (event: React.MouseEvent<HTMLDivElement, MouseEvent>, tabIdx: number) => {
        event.stopPropagation();
        event.preventDefault();

        if (event.button === 2) return;

        if (event.button === 1) {
            closeTab(tabs[tabIdx]);
        } else {
            tabSelect(tabs[tabIdx]);
        }
    };

    const isTabDrag = (event: React.DragEvent) => event.dataTransfer.types.includes(TAB_DRAG_TYPE);

    const isDropAfter = (event: React.DragEvent<HTMLDivElement>) => {
        const rect = event.currentTarget.getBoundingClientRect();

        return settings.ui.tabLayout === TabLayout.VERTICAL
            ? event.clientY > rect.top + rect.height / 2
            : event.clientX > rect.left + rect.width / 2;
    };

    const handleTabDragStart = (event: React.DragEvent<HTMLDivElement>, tab: EditorTab) => {
        if (!tab.id) return;

        event.dataTransfer.setData(TAB_DRAG_TYPE, tab.id);
        event.dataTransfer.effectAllowed = "move";

        setDraggedTabId(tab.id);
    };

    const handleTabDragOver = (event: React.DragEvent<HTMLDivElement>, tab: EditorTab) => {
        if (!isTabDrag(event) || !tab.id) return;

        event.preventDefault();
        event.stopPropagation();
        event.dataTransfer.dropEffect = "move";

        const placeAfter = isDropAfter(event);

        if (dropTarget?.id !== tab.id || dropTarget.placeAfter !== placeAfter) setDropTarget({id: tab.id, placeAfter: placeAfter});
    };

    const handleTabDrop = (event: React.DragEvent<HTMLDivElement>, tab: EditorTab) => {
        if (!isTabDrag(event)) return;

        event.preventDefault();
        event.stopPropagation();

        const movedTabId = event.dataTransfer.getData(TAB_DRAG_TYPE);
        const reordered = tab.id ? moveTab(tabs, movedTabId, tab.id, isDropAfter(event)) : tabs;

        if (reordered !== tabs) setTabs(reordered);

        handleTabDragEnd();
    };

    const handleTabDragEnd = () => {
        setDraggedTabId(undefined);
        setDropTarget(undefined);
    };

    const getDropClass = (tab: EditorTab) => {
        if (!dropTarget || dropTarget.id !== tab.id || draggedTabId === tab.id) return "";

        return dropTarget.placeAfter ? " dropAfter" : " dropBefore";
    };

    return (
        <div id={"tabListWrapper"}>
            <div id={"tabList"}>
                {tabs && tabs.length > 0 &&
                    tabs.map((tab, idx) => (
                        <div id={tab.id} key={tab.id} className={"editorTabHeader" + getOrEmptyString(tab.id === activeTab?.id, " selected") + getOrEmptyString(tab.isChanged || false, " changed") + getOrEmptyString(!!tab.isPinned, " pinned") + getOrEmptyString(draggedTabId === tab.id, " dragging") + getDropClass(tab)}
                            draggable={true}
                            onDragStart={(event) => handleTabDragStart(event, tab)}
                            onDragOver={(event) => handleTabDragOver(event, tab)}
                            onDrop={(event) => handleTabDrop(event, tab)}
                            onDragEnd={handleTabDragEnd}
                            onMouseUp={(event) => handleTabClick(event, idx)} onContextMenu={(event) => showTabContextMenu(event, tab)}>
                            <div>
                                <FontAwesomeIcon className={"tabFileIcon"} icon={faFileText}/>
                                <span className={"tabHeaderName"} title={tab.file || tab.name}>{countByName(tabs, tab.name || DEFAULT_TAB_NAME) > 1 ? (tab.file || tab.displayName) : tab.displayName}</span>
                            </div>
                            {tab.isPinned ?
                                <div>
                                    <span className={"tabPinIcon"} title={"Pinned"} aria-label={"Pinned"}>
                                        <FontAwesomeIcon icon={faBookmark}/>
                                    </span>
                                </div> :
                                <div>
                                    <button type={"button"} className={"iconButton danger closeTabButton"} aria-label={"Close tab"} title={"Close tab"} onClick={(e) => {
                                        e.stopPropagation();
                                        closeTab(tab);
                                    }}>
                                        <FontAwesomeIcon icon={faRectangleTimes}/>
                                    </button>
                                </div>
                            }
                        </div>
                    ))
                }
            </div>
            <div id={"newTabPanel"}>
                <button type={"button"} className={"iconButton"} aria-label={"New tab"} title={"New tab"} onClick={() => addTab(generateTempTab(generateUniqueName(tabs, DEFAULT_TAB_NAME)))}>
                    <FontAwesomeIcon icon={faPlusSquare}/>
                </button>
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
        isTemp: true,
        state: {scroll: {left: 0, top: 0}, selection: undefined}
    };
}