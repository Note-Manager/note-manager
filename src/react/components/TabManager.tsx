import React, {useEffect, useState} from 'react';
import {TabList} from "./TabList";
import {EditorTab} from "../../domain/EditorTab";
import Footer from "./Footer";
import EditorContainer from "./EditorContainer";
import {EditorContextProvider, useEditorContext} from "./editor/EditorContext";
import {fireEvent, getPathForFile, off, on} from "../ApplicationEvents";
import {EventType} from "../../enums";
import SettingsDialog from "./SettingsDialog";
import {normalizeSettings, Settings} from "../../domain/Settings";

export default function TabManager() {
    return (
        <EditorContextProvider>
            <Workbench/>
        </EditorContextProvider>
    );
}

function Workbench() {
    const {settings, setSettings} = useEditorContext();

    const [isSettingsOpen, setIsSettingsOpen] = useState(false);

    useEffect(() => {
        const onSettingsChanged = (event: any, changed: Settings) => setSettings(normalizeSettings(changed));
        const onOpenSettings = () => setIsSettingsOpen(true);

        fireEvent(EventType.GET_SETTINGS)
            .then(result => setSettings(normalizeSettings(result?.settings)))
            .catch(err => console.error("cannot load settings: " + err));

        on(EventType.SETTINGS_CHANGED, onSettingsChanged);
        on(EventType.OPEN_SETTINGS, onOpenSettings);

        return () => {
            off(EventType.SETTINGS_CHANGED, onSettingsChanged);
            off(EventType.OPEN_SETTINGS, onOpenSettings);
        };
    }, []);

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

        const droppedFiles = Array.from(event.dataTransfer.files).map(f => getPathForFile(f));

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
        <div id={"tabManager"}
             className={"tabs-" + settings.ui.tabLayout}
             onDragEnter={handleDragEnter}
             onDragOver={handleDragOver}
             onDragLeave={handleDragLeave}
             onDrop={handleDrop}>

            <div id={"workspace"}>
                <TabList
                    onTabSelect={onTabSelect}
                    onTabAdd={onTabAdd}
                    onTabRemove={onTabRemove}
                />

                <EditorContainer/>
            </div>

            <Footer/>

            {isSettingsOpen && <SettingsDialog onClose={() => setIsSettingsOpen(false)}/>}
        </div>
    );
}