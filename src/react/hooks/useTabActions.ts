import {useRef} from "react";
import {EditorTab} from "../../domain/EditorTab";
import {EventType} from "../../enums";
import {fireEvent} from "../ApplicationEvents";
import {resolveUnsavedChanges} from "../TabSaver";
import {useEditorContext} from "../components/editor/EditorContext";
import {findLanguageByFileName} from "../../domain/SupportedLanguage";
import {createEmptyTab, DEFAULT_TAB_NAME, generateUniqueName, hashTab, orderByPinned, renameTab} from "../../utils/TabUtils";
import {logError} from "../../utils/Log";

const MAX_CLOSED_TABS = 20;

export function useTabActions() {
    const {tabs, setTabs, activeTab, setActiveTab, settings} = useEditorContext();
    const closedTabs = useRef<Array<EditorTab>>([]);

    const refreshTabs = () => setTabs([...tabs]);

    const findOpenFile = (file: string | undefined) => file ? tabs.find(t => t.file === file) : undefined;

    const showTab = (tab: EditorTab) => {
        setTabs(orderByPinned([...tabs, tab]));
        setActiveTab(tab);
    };

    const openTab = (source: EditorTab) => {
        const openFile = findOpenFile(source.file);

        if (openFile) return setActiveTab(openFile);

        const tab: EditorTab = {
            ...createEmptyTab(generateUniqueName(tabs, source.name || DEFAULT_TAB_NAME), source.encoding || settings.files.defaultEncoding, source.eol || settings.files.defaultEol),
            file: source.file,
            content: source.content ?? "",
            isTemp: source.isTemp,
            language: findLanguageByFileName(source.file),
        };

        showTab(tab);

        hashTab(tab).then(hash => tab.hash = hash);
    };

    const openNewTab = () => openTab({isTemp: true});

    const removeTabs = (tabsToRemove: Array<EditorTab>) => {
        closedTabs.current.push(...tabsToRemove.map(tab => ({...tab})));
        closedTabs.current.splice(0, closedTabs.current.length - MAX_CLOSED_TABS);

        const remaining = tabs.filter(t => !tabsToRemove.includes(t));

        setTabs(remaining);

        if (!activeTab || tabsToRemove.includes(activeTab)) setActiveTab(remaining[remaining.length - 1]);
    };

    const closeTabs = async (tabsToClose: Array<EditorTab>) => {
        if (tabsToClose.length === 0) return true;

        if (!await resolveUnsavedChanges(tabsToClose.filter(t => t.isChanged))) {
            refreshTabs();
            return false;
        }

        removeTabs(tabsToClose);

        return true;
    };

    const closeTab = (tab: EditorTab | undefined) => {
        if (!tab) return;

        closeTabs([tab])
            .then(isClosed => isClosed || setActiveTab(tab))
            .catch(logError("cannot close " + tab.name));
    };

    const reopenClosedTab = () => {
        const closedTab = closedTabs.current.pop();

        if (!closedTab) return;

        const openFile = findOpenFile(closedTab.file);

        if (openFile) return setActiveTab(openFile);

        const tab: EditorTab = {...closedTab, id: crypto.randomUUID()};

        if (!tab.file) renameTab(tab, generateUniqueName(tabs, tab.name || DEFAULT_TAB_NAME));

        showTab(tab);
    };

    const togglePin = (tab: EditorTab) => {
        tab.isPinned = !tab.isPinned;

        setTabs(orderByPinned(tabs));
    };

    const revealInFolder = (tab: EditorTab | undefined) => {
        if (!tab?.file) return;

        fireEvent(EventType.REVEAL_FILE, {file: tab.file})
            .then(isRevealed => isRevealed || console.warn("cannot reveal missing file " + tab.file))
            .catch(logError("cannot reveal " + tab.file));
    };

    const closeWindow = async () => {
        if (!await resolveUnsavedChanges(tabs.filter(t => !t.isTemp && t.file && t.isChanged))) return refreshTabs();

        await fireEvent(EventType.CLOSE_WITH_STATE, {tabs: tabs, activeTabId: activeTab?.id || tabs[tabs.length - 1]?.id});
    };

    return {
        openTab,
        openNewTab,
        closeTab,
        closeTabs,
        reopenClosedTab,
        togglePin,
        revealInFolder,
        closeWindow,
        canReopen: () => closedTabs.current.length > 0,
    };
}
