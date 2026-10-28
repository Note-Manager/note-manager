import React, {useEffect, useState} from "react";
import {TabList} from "./TabList";
import Footer from "./Footer";
import EditorContainer from "./EditorContainer";
import {EditorContextProvider, useEditorContext} from "./editor/EditorContext";
import {fireEvent, getPathForFile} from "../ApplicationEvents";
import {useIpcEvents} from "../hooks/useIpcEvents";
import {logError} from "../../utils/Log";
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
        fireEvent(EventType.GET_SETTINGS)
            .then(result => setSettings(normalizeSettings(result?.settings)))
            .catch(logError("cannot load settings"));
    }, []);

    useIpcEvents({
        [EventType.SETTINGS_CHANGED]: (event: unknown, changed: Settings) => setSettings(normalizeSettings(changed)),
        [EventType.OPEN_SETTINGS]: () => setIsSettingsOpen(true),
    }, []);

    const allowDrop = (event: React.DragEvent) => event.preventDefault();

    const handleDrop = (event: React.DragEvent) => {
        event.preventDefault();

        const droppedFiles = Array.from(event.dataTransfer.files).map(f => getPathForFile(f));

        fireEvent(EventType.FILES_DROPPED, {files: droppedFiles}).catch(logError("cannot open dropped files"));
    };

    return (
        <div id={"tabManager"}
            className={"tabs-" + settings.ui.tabLayout}
            onDragEnter={allowDrop}
            onDragOver={allowDrop}
            onDrop={handleDrop}>

            <div id={"workspace"}>
                <TabList/>

                <EditorContainer/>
            </div>

            <Footer/>

            {isSettingsOpen && <SettingsDialog onClose={() => setIsSettingsOpen(false)}/>}
        </div>
    );
}