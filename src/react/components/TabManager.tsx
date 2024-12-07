import React, {useState} from 'react';
import {TabList} from "./TabList";
import {EditorTab} from "../../domain/EditorTab";
import Footer from "./Footer";
import EditorContainer from "./EditorContainer";
import {EditorContextProvider} from "./editor/EditorContext";

export default function TabManager() {
    const [activeTab, setActiveTab] = useState<EditorTab>();

    const onTabSelect = (tab: EditorTab) => {
        setActiveTab(tab);
    }

    const onTabRemove = (tabToRemove: EditorTab) => {
        // do nothing
    }

    const onTabAdd = (tabToAdd: EditorTab) => {
        // do nothing
    }

    return (
        <EditorContextProvider>
            <div id={"tabManager"}>
                <TabList
                    onTabSelect={onTabSelect}
                    onTabAdd={onTabAdd}
                    onTabRemove={onTabRemove}
                />

                {activeTab?.id &&
                    <EditorContainer tab={activeTab}/>
                }

                <Footer/>
            </div>
        </EditorContextProvider>
    );
}