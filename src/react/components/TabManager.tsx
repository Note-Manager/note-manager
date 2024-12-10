import React, {useState} from 'react';
import {TabList} from "./TabList";
import {EditorTab} from "../../domain/EditorTab";
import Footer from "./Footer";
import EditorContainer from "./EditorContainer";
import {EditorContextProvider} from "./editor/EditorContext";
import {fireEvent} from "../ApplicationEvents";
import {EventType} from "../../enums";
import electron from "electron";

export default function TabManager() {
    const [isDragging, setDragging] = useState(false);

    const handleDragEnter = (event: any) => {
        event.preventDefault();
        setDragging(true);
    };

    const handleDragOver = (event: any) => {
        event.preventDefault();
    };

    const handleDragLeave = () => {
        setDragging(false);
    };

    const handleDrop = (event: React.DragEvent) => {
        event.preventDefault();
        setDragging(false);

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

                {!isDragging &&
                    <EditorContainer/>
                }

                <Footer/>
            </div>
        </EditorContextProvider>
    );
}