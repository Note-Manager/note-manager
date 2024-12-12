import React from 'react';
import {TabList} from "./TabList";
import {EditorTab} from "../../domain/EditorTab";
import Footer from "./Footer";
import EditorContainer from "./EditorContainer";
import {EditorContextProvider} from "./editor/EditorContext";
import {fireEvent} from "../ApplicationEvents";
import {EventType} from "../../enums";
import electron from "electron";

export default function TabManager() {

    const handleDragEnter = (event: any) => {
        event.preventDefault();
    };

    const handleDragOver = (event: any) => {
        event.preventDefault();
    };

    const handleDragLeave = () => {
    };

    const handleDrop = (event: React.DragEvent) => {
        event.preventDefault();

        const droppedFiles = Array.from(event.dataTransfer.files).map(f => electron.webUtils.getPathForFile(f));

        fireEvent(EventType.FILES_DROPPED, {files: droppedFiles}).then(ignore => ignore);
    };

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
            <div id={"tabManager"}
                 onDragEnter={handleDragEnter}
                 onDragOver={handleDragOver}
                 onDragLeave={handleDragLeave}
                 onDrop={handleDrop}>

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