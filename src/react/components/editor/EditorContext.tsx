import {EditorData} from "../../../domain/EditorData";
import React, {createContext, ReactNode, useContext, useState} from "react";
import {EditorTab} from "../../../domain/EditorTab";
import {DEFAULT_SETTINGS, Settings} from "../../../domain/Settings";
import {EncodingAction} from "../../../enums";

interface IEditorContext {
    data: EditorData;
    tabs: Array<EditorTab>;
    activeTab: EditorTab;
    settings: Settings;
    encodingPicker?: EncodingAction;

    setEncodingPicker: (action?: EncodingAction) => void;
    setSettings: (settings: Settings) => void;
    setData: (data: EditorData) => void;
    setActiveTab: (activeTab: EditorTab) => void;
    setTabs: (activeTabs: EditorTab[]) => void;
}

export const initial = {
    data: {
        length: 0,
        lineCount: 1,
        selection: {
            selectionLength: 0,
            selectionRangeCount: 0,
        },
    },
    tabs: []
};

export const EditorContext = createContext<IEditorContext>({
    ...initial,
    activeTab: initial.tabs[0],
    settings: DEFAULT_SETTINGS,
    setEncodingPicker: () => {
    },
    setSettings: () => {
    },
    setData: () => {
    },
    setActiveTab: () => {
    },
    setTabs: () => {
    }
});

export const EditorContextProvider: React.FC<{children: ReactNode}> = ({children}) => {
    const [data, setData] = useState<EditorData>(initial.data);
    const [activeTab, setActiveTab] = useState<EditorTab>(initial.tabs[0]);
    const [tabs, setTabs] = useState<Array<EditorTab>>(initial.tabs);
    const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);
    const [encodingPicker, setEncodingPicker] = useState<EncodingAction>();

    return (
        <EditorContext.Provider value={{data, tabs, activeTab, settings, encodingPicker, setData, setTabs, setActiveTab, setSettings, setEncodingPicker}}>
            {children}
        </EditorContext.Provider>
    );
};

export const useEditorContext = () => {
    const context = useContext(EditorContext);

    if (!context) {
        throw new Error("useEditorContext must be used within an EditorProvider");
    }

    return context;
};