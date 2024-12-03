import {useState} from 'react';
import Editor from "./Editor";
import {TabList} from "./TabList";
import * as TextUtils from "../../utils/TextUtils";
import {Ace} from "ace-builds";
import React from 'react';
import {EditorTab} from "../../domain/EditorTab";
import {EditorData} from "../../domain/EditorData";

const initialEditorData:EditorData = {
    length: 0,
    lineCount: 1,
    selection: {
        selectionLength: 0,
        selectionRangeCount: 0
    }
};

export default function TabManager() {
    const [tabs, setTabs] = useState<Array<EditorTab>>([]);
    const [selectedTab, setSelectedTab] = useState<EditorTab>(tabs[0]);
    const [selectedTabFile, setSelectedTabFile] = useState<string>(selectedTab?.file || "");

    const [editorData, setEditorData] = useState<EditorData>(initialEditorData);

    const onTabSelect = (tab:EditorTab) => {
        setSelectedTab(tab);
        setSelectedTabFile(tab?.file||"");
    }

    const onTabSave = ({isSaved, savedFile, tab}: {isSaved: boolean, savedFile:string, tab: EditorTab}) => {
        TextUtils.hash(tab.content||"").then(result => {
            tab.hash = result;

            setSelectedTabFile(tab?.file||"");
        });
    }

    const onTabRemove = (tabToRemove:EditorTab) => {
        tabs.splice(tabs.indexOf(tabToRemove), 1);

        const newTabs = [...tabs];

        setTabs(newTabs);
        onTabSelect(newTabs[newTabs.length-1]);
    }

    const onTabAdd = (tabToAdd:EditorTab) => {
        tabs.push(tabToAdd)

        setTabs(tabs);
        setEditorData(initialEditorData);

        onTabSelect(tabs[tabs.length-1]);

        TextUtils.hash(tabToAdd.content||"").then((result) => {
            tabToAdd.hash = result;
        });
    }

    const onSelectionChange = ({isTextSelected, selectedText, ranges}: {isTextSelected:boolean, selectedText:string, ranges:Array<Ace.Range>}) => {
        setEditorData({
            ...editorData,
            selection: {
                selectionLength: selectedText?.length,
                selectionRangeCount: !isTextSelected
                ? 0
                : ranges.length
            }
        });
    }

    const onContentChange = ({value, lineCount}: {value:string, lineCount:number}) => {
        setEditorData({
            ...editorData,
            length: value.length,
            lineCount: lineCount
        });

        TextUtils.hash(value).then((result:string) => {
            if(!selectedTab) return;

            selectedTab.isChanged = result !== selectedTab.hash;

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
                        onTabSave={onTabSave}
                        onEditorLoad={undefined}/>
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