import React, {useEffect} from "react";
import {FontAwesomeIcon} from "@fortawesome/react-fontawesome";
import {faPlusSquare} from "@fortawesome/free-regular-svg-icons/faPlusSquare";
import {EditorTab} from "../../domain/EditorTab";
import {EditorState} from "../../domain/EditorState";
import {EventType, TabAction} from "../../enums";
import {fireEvent} from "../ApplicationEvents";
import {useEditorContext} from "./editor/EditorContext";
import {useIpcEvents} from "../hooks/useIpcEvents";
import {useTabActions} from "../hooks/useTabActions";
import {useTabDrag} from "../hooks/useTabDrag";
import {useStateAutosave} from "../hooks/useStateAutosave";
import {countTabsNamed, DEFAULT_TAB_NAME} from "../../utils/TabUtils";
import {logError} from "../../utils/Log";
import TabHeader from "./TabHeader";

export function TabList() {
    const {tabs, setTabs, activeTab, setActiveTab, settings} = useEditorContext();
    const actions = useTabActions();
    const drag = useTabDrag(tabs, setTabs, settings.ui.tabLayout);
    const enableAutosave = useStateAutosave(tabs, activeTab);

    useEffect(() => {
        if (activeTab?.id) document.getElementById(activeTab.id)?.scrollIntoView();
    }, [activeTab]);

    const runTabAction = (action: TabAction, tabId?: string) => {
        const tab = tabs.find(t => t.id === tabId);
        const closable = tabs.filter(t => !t.isPinned);

        switch (action) {
            case TabAction.CLOSE:
                return actions.closeTab(tab);
            case TabAction.CLOSE_OTHERS:
                return actions.closeTabs(closable.filter(t => t !== tab)).catch(logError("cannot close other tabs"));
            case TabAction.CLOSE_UNMODIFIED:
                return actions.closeTabs(closable.filter(t => !t.isChanged)).catch(logError("cannot close unmodified tabs"));
            case TabAction.CLOSE_ALL:
                return actions.closeTabs(closable).catch(logError("cannot close all tabs"));
            case TabAction.TOGGLE_PIN:
                return tab && actions.togglePin(tab);
            case TabAction.REOPEN_CLOSED:
                return actions.reopenClosedTab();
            case TabAction.REVEAL_IN_FOLDER:
                return actions.revealInFolder(tab || activeTab);
        }
    };

    const initializeWithState = (state: EditorState) => {
        enableAutosave();
        setTabs(state.tabs);

        if (state.tabs?.length > 0) setActiveTab(state.tabs.find(t => t.id === state.activeTabId) || state.tabs[state.tabs.length - 1]);
    };

    useIpcEvents({
        [EventType.NEW_TAB]: actions.openNewTab,
        [EventType.OPEN_TAB]: (tab) => actions.openTab(tab),
        [EventType.CLOSE_TAB]: () => actions.closeTab(activeTab),
        [EventType.CLOSE_WINDOW]: () => actions.closeWindow().catch(logError("cannot close the window")),
        [EventType.INIT_WITH_STATE]: (state) => initializeWithState(state),
        [EventType.TAB_ACTION]: (data) => runTabAction(data?.action, data?.tabId),
    }, [activeTab, tabs, settings]);

    const showContextMenu = (event: React.MouseEvent, tab: EditorTab) => {
        event.preventDefault();
        event.stopPropagation();

        if (!tab.id) return;

        fireEvent(EventType.SHOW_TAB_CONTEXT_MENU, {
            tabId: tab.id,
            isPinned: !!tab.isPinned,
            hasOtherTabs: tabs.some(t => t !== tab && !t.isPinned),
            hasUnmodifiedTabs: tabs.some(t => !t.isPinned && !t.isChanged),
            hasClosableTabs: tabs.some(t => !t.isPinned),
            hasFile: !!tab.file,
            canReopen: actions.canReopen()
        }).catch(logError("cannot show the tab menu"));
    };

    const getLabel = (tab: EditorTab) => countTabsNamed(tabs, tab.name || DEFAULT_TAB_NAME) > 1 ? (tab.file || tab.displayName || "") : (tab.displayName || "");

    return (
        <div id={"tabListWrapper"}>
            <div id={"tabList"}>
                {tabs.map(tab => (
                    <TabHeader key={tab.id}
                        tab={tab}
                        label={getLabel(tab)}
                        isSelected={tab.id === activeTab?.id}
                        isDragged={drag.isDragged(tab)}
                        dropPosition={drag.getDropPosition(tab)}
                        onSelect={setActiveTab}
                        onClose={actions.closeTab}
                        onContextMenu={showContextMenu}
                        onDragStart={drag.onDragStart}
                        onDragOver={drag.onDragOver}
                        onDrop={drag.onDrop}
                        onDragEnd={drag.onDragEnd}/>
                ))}
            </div>
            <div id={"newTabPanel"}>
                <button type={"button"} className={"iconButton"} aria-label={"New tab"} title={"New tab"} onClick={actions.openNewTab}>
                    <FontAwesomeIcon icon={faPlusSquare}/>
                </button>
            </div>
        </div>
    );
}
