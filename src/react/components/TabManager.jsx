import * as React from 'react';
import {useEffect, useState} from 'react';

import {SupportedLanguages} from "../../contants/Enums.js";
import {FontAwesomeIcon} from "@fortawesome/react-fontawesome";
import {faPlusSquare} from "@fortawesome/free-regular-svg-icons/faPlusSquare";
import {faRectangleTimes} from "@fortawesome/free-regular-svg-icons/faRectangleTimes";
import {faFileText} from "@fortawesome/free-regular-svg-icons";
import Editor from "./Editor.jsx";

export function TabManager() {
    const [tabs, setTabs] = useState([]);
    const [selectedTab, setSelectedTab] = useState(tabs[0]);
    const [editorData, setEditorData] = useState({
        length: 0,
        lineCount: 1,
        selection: {
            selectionLength: 0
        }
    });

    useEffect(() => {
        TabsAPI.getTabs().then((tabList) => {
            setTabs(tabList);
            setSelectedTab(tabList[0]);
        });
    }, []);

    const selectTab = (data) => {
        if(data.tab?.id === selectedTab?.id) return;
        TabsAPI.selectTab(data).then(async () => {
            setSelectedTab(await TabsAPI.getSelectedTab());
        });
    };

    const addTab = () => {
        TabsAPI.addTab({isTemp: true}).then(async (tab) => {
            setTabs(await TabsAPI.getTabs());
            selectTab({tab: tab});

            return tab;
        });
    };

    const removeTab = (event, data) => {
        TabsAPI.removeTab(data).then(async () => {
            setTabs(await TabsAPI.getTabs());
            setSelectedTab(await TabsAPI.getSelectedTab());
        });

        event.stopPropagation();
    }

    const handleChange = (content, viewUpdate) => {
        console.log("change happened");
        const newTab = {...selectedTab, content: content};
        setSelectedTab(newTab);
    }

    const handleStatistics = (data) => {
        const newMetadata = {
            length: selectedTab?.content?.length,
            lineCount: data.lineCount,
            selection: {
                selectionLength: data.selectedText ? data.selections.map(sel => sel.length).reduce((previous, current) => previous + current, 0) : 0
            }
        };

        // if(JSON.stringify(newMetadata) !== JSON.stringify(editorData)) setEditorData(newMetadata); this is causing an infinite loop
    }

    document.getElementById(selectedTab?.id)?.scrollIntoView();

    return (
        <div id={"tabManager"}>
            <div id={"tabListWrapper"}>
                <div id={"tabList"}>
                    {
                        tabs.map(tab => (
                            <div id={tab.id} className={"editorTabHeader" + (tab.id === selectedTab?.id ? " selected" : "")} key={tab.id} onClick={() => selectTab({tab})}>
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
                    <FontAwesomeIcon icon={faPlusSquare} className={"iconButton"} onClick={addTab}/>
                </div>
            </div>

            <div id={"tabContent"}>
                {selectedTab &&
                    <Editor
                        language={SupportedLanguages.findByFileName(selectedTab.fileName)}
                        content={selectedTab.content}
                        changeListener={(val, viewUpdate) => handleChange(val, viewUpdate)}
                        statisticListener={(data) => handleStatistics(data)}
                    />
                }
            </div>

            <div id={"footer"}>
                <div id={"footerLeft"}>
                    {selectedTab?.fileName}
                </div>
                { editorData &&
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