import * as React from 'react';
import {useState} from 'react';
import Editor from "./Editor.jsx";
import {TabList} from "./TabList.jsx";
import * as TextUtils from "../../utils/TextUtils";

const initialEditorData = {
    length: 0,
    lineCount: 1,
    selection: {
        selectionLength: 0,
        selectionRangeCount: 0
    }
};

export function TabManager() {
    const [tabs, setTabs] = useState([]);
    const [selectedTab, setSelectedTab] = useState();
    const [selectedTabFile, setSelectedTabFile] = useState(selectedTab?.file);

    const [editorData, setEditorData] = useState(initialEditorData);

    const onTabSelect = (tab) => {
        setSelectedTab(tab);
        setSelectedTabFile(tab?.file);
    }

    const onTabSave = (savedTab) => {
        TextUtils.hash(savedTab.content).then(result => {
            savedTab.initialHash = result;

            setSelectedTabFile(savedTab?.file);
        });
    }

    const onTabRemove = (tabToRemove) => {
        tabs.splice(tabs.indexOf(tabToRemove), 1);

        const newTabs = [...tabs];

        setTabs(newTabs);
        onTabSelect(newTabs[newTabs.length-1]);
    }

    const onTabAdd = (tabToAdd) => {
        tabs.push(tabToAdd)

        setTabs(tabs);
        setEditorData(initialEditorData);

        onTabSelect(tabs[tabs.length-1]);

        TextUtils.hash(tabToAdd.content).then((result) => {
            tabToAdd.initialHash = result;
        });
    }

    const onSelectionChange = ({isTextSelected, selectedText, selectionRanges}) => {
        setEditorData({
            ...editorData,
            selection: {
                selectionLength: selectedText?.length,
                selectionRangeCount: !isTextSelected
                ? 0
                : Array.isArray(selectionRanges)
                    ? selectionRanges?.length
                    : 1
            }
        });
    }

    const onContentChange = ({value, lineCount}) => {
        setEditorData({
            ...editorData,
            length: value.length,
            lineCount: lineCount
        });

        TextUtils.hash(value).then(result => {
            selectedTab.isChanged = result !== selectedTab.initialHash;

            const newTab = {...selectedTab};

            tabs[tabs.indexOf(selectedTab)] = newTab;

            setTabs(tabs);
            setSelectedTab(newTab);
        });
    }

    return (
        <div id={"tabManager"}>
            <TabList
                tabs={tabs}
                activeTab={selectedTab}
                onTabSelect={onTabSelect}
                onTabAdd={onTabAdd}
                onTabRemove={onTabRemove}
            />

            { selectedTab?.id &&
                <div className={"tabContentWrapper"} key={selectedTab.id}>
                    <Editor
                        tab={selectedTab}
                        selectionListener={onSelectionChange}
                        changeListener={onContentChange}
                        onTabSave={onTabSave}/>
                </div>
            }

            <div id={"footer"}>
                <div id={"footerLeft"}>
                    <span>{selectedTabFile}</span>
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
                            selection <span className={"editorDataContent"}>{"main: " + editorData.selection?.selectionLength} ({"RNG: " + editorData.selection.selectionRangeCount})</span>
                        </label>
                    </div>
                }
            </div>
        </div>
    );
}