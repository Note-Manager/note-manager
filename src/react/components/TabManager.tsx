import React from 'react';
import {TabList} from "./TabList";
import {EditorTab} from "../../domain/EditorTab";
import Footer from "./Footer";
import EditorContainer from "./EditorContainer";
import {EditorContextProvider} from "./editor/EditorContext";

export default function TabManager() {
    const onTabSelect = (tab: EditorTab) => {
        // do nothing
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

                <EditorContainer/>

                <Footer/>
            </div>
        </EditorContextProvider>
    );
}