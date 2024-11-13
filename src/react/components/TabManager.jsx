import * as React from 'react';
import {useEffect, useRef, useState} from 'react';

import {SupportedLanguages} from "../../contants/Enums.js";
import {FontAwesomeIcon} from "@fortawesome/react-fontawesome";
import {faPlusSquare} from "@fortawesome/free-regular-svg-icons/faPlusSquare";
import {faRectangleTimes} from "@fortawesome/free-regular-svg-icons/faRectangleTimes";
import {faFileText} from "@fortawesome/free-regular-svg-icons";
import Editor from "./Editor.jsx";

const DEFAULT_TAB_NAME = "New Document.txt";

let currentTabs = [];

export function TabManager() {
    const [tabs, setTabs] = useState(currentTabs);

    const selectedTabRef = useRef(tabs[0]);
    const tabsRef = useRef(currentTabs);

    useEffect(() => {
        currentTabs = tabs;
        tabsRef.current = tabs;
    }, [tabs]);

    useEffect(() => {
        addTab({isTemp: true});
    }, []);

    const [editorData, setEditorData] = useState({
        length: 0,
        lineCount: 1,
        selection: {
            selectionLength: 0
        }
    });

    useEffect(() => {
        const handleTabFormat = () => {
            const selectedTab = selectedTabRef.current;

            if (!selectedTab) return;

            window.StringUtils.format({
                content: selectedTab.content,
                file: selectedTab.file,
                options: undefined
            }).then(result => {
                log.info("formatting..");

                selectedTab.content = result;

                setTabs([...tabsRef.current]);
            });
        };

        const handleTabOpen = (event, data) => {
            addTab(data);
        };

        const onTabRemove = (event) => {
            removeTab(event, {tab: selectedTabRef.current});
        };

        const onNewTab = () => {
          addTab({isTemp: true});
        };

        const onSetTabLanguage = (event, language) => {
            selectedTabRef.current.language = language;
            setTabs([...tabsRef.current]);
        }

        window.ApplicationEvents.onTabFormat(handleTabFormat);
        window.ApplicationEvents.onTabOpen(handleTabOpen);
        window.ApplicationEvents.onRemoveTab(onTabRemove);
        window.ApplicationEvents.onNewTab(onNewTab);
        window.ApplicationEvents.onSetTabLanguage(onSetTabLanguage);

        return () => {
            window.ApplicationEvents.removeListeners("formatTab", handleTabFormat);
            window.ApplicationEvents.removeListeners("openTab", handleTabOpen);
            window.ApplicationEvents.removeListeners("removeTab", onTabRemove);
            window.ApplicationEvents.removeListeners("newTab", onNewTab);
            window.ApplicationEvents.removeListeners("setTabLanguage", onSetTabLanguage);
        };
    }, []);

    const selectTab = (tab) => {
        if (tab?.id === selectedTabRef.current?.id) return;

        if (tabsRef.current.indexOf(tab) >= 0) {
            selectedTabRef.current = tab;
        }

        setTabs([...tabsRef.current]);
    };

    const addTab = ({isTemp, name, file, content}) => {
        if (file && tabsRef.current.some(t => t.file === file)) {
            return selectTab(tabsRef.current.find(t => t.file === file));
        }

        const tabId = crypto.randomUUID();

        const tab = {
            id: tabId,
            name: generateUniqueName(name || DEFAULT_TAB_NAME),
            file: file,
            content: content,
            isTemp: isTemp
        };

        tab.displayName = tab.name.length > 20 ? tab.name.substring(0, 20) + "..." : tab.name;

        const newTabs = [...tabsRef.current, tab];

        setTabs(newTabs);

        selectedTabRef.current = tab;
    }

    const removeTab = (event, data) => {
        const newTabs = currentTabs.filter(t => t !== data.tab);
        
        if(newTabs.length > 0) selectedTabRef.current = newTabs[newTabs.length-1]; // select the last tab after remove
        else selectedTabRef.current = null;
            
        setTabs(newTabs);

        if(event && event.stopPropagation) event.stopPropagation();
    }

    const handleChange = (content) => {
        selectedTabRef.current.content = content;
    }

    const handleStatistics = (data) => {
        const newMetadata = {
            length: selectedTabRef.current?.content?.length,
            lineCount: data.lineCount,
            selection: {
                selectionLength: data.selectedText ? data.selections.map(sel => sel.length).reduce((previous, current) => previous + current, 0) : 0
            }
        };

        if (JSON.stringify(editorData) !== JSON.stringify(newMetadata)) setEditorData(newMetadata); // sometimes this causing an infinite loop
    }

    document.getElementById(selectedTabRef.current?.id)?.scrollIntoView(); // if a newly created tab is not in view area, scroll it!

    return (
        <div id={"tabManager"}>
            <div id={"tabListWrapper"}>
                <div id={"tabList"}>
                    {tabs && tabs.length > 0 &&
                        tabs.map(tab => (
                            <div id={tab.id} key={tab.id} className={"editorTabHeader" + (tab.id === selectedTabRef?.current?.id ? " selected" : "")} onClick={() => selectTab(tab)}>
                                <div>
                                    <FontAwesomeIcon icon={faFileText}/>
                                    <span className={"tabHeaderName"} style={{marginLeft: "5px"}} title={tab.fileName || tab.name}>{tab.displayName}</span>
                                </div>
                                <div>
                                    <FontAwesomeIcon className={"closeTabButton"} icon={faRectangleTimes} onClick={(e) => removeTab(e, {tab})}/>
                                </div>
                            </div>
                        ))
                    }
                </div>
                <div id={"newTabPanel"}>
                    <FontAwesomeIcon icon={faPlusSquare} className={"iconButton"} onClick={() => addTab({isTemp: true})}/>
                </div>
            </div>

            <div id={"tabContent"}>
                {selectedTabRef.current &&
                    <Editor key={selectedTabRef.current.id}
                            language={selectedTabRef.current.language || SupportedLanguages.findByFileName(selectedTabRef.current.file)}
                            content={selectedTabRef.current.content}
                            changeListener={(val, viewUpdate) => handleChange(val, viewUpdate)}
                            statisticListener={(data) => handleStatistics(data)}
                    />
                }
            </div>

            <div id={"footer"}>
                <div id={"footerLeft"}>
                    {selectedTabRef.current?.file}
                </div>
                {editorData &&
                    <div id={"footerRight"}>
                        <label className={"editorDataLabel"}>
                            length: <span className={"editorDataContent"}>{editorData.length}</span>
                        </label>
                        <label className={"editorDataLabel"}>
                            lines: <span className={"editorDataContent"}>{editorData.lineCount}</span>
                        </label>
                        <label className={"editorDataLabel"}>
                            selection: <span className={"editorDataContent"}>{editorData.selection?.selectionLength}</span>
                        </label>
                    </div>
                }
            </div>
        </div>
    );
}

function generateUniqueName(initialName) {
    let count = 0;

    let generatedName = initialName;

    while (containsWithName(generatedName)) {
        count++;
        generatedName = `${initialName} (${count})`;
    }

    return generatedName;
}

function containsWithName(name) {
    return currentTabs.filter(tab => tab.name === name).length > 0;
}