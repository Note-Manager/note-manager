import React, {createContext, ReactNode, useContext, useState} from "react";
import {EditorData} from "../../../domain/EditorData";
import {EditorTab} from "../../../domain/EditorTab";
import {DEFAULT_SETTINGS, Settings} from "../../../domain/Settings";
import {EncodingAction} from "../../../enums";

interface IEditorContext {
    data: EditorData;
    tabs: Array<EditorTab>;
    activeTab?: EditorTab;
    settings: Settings;
    encodingPicker?: EncodingAction;

    setEncodingPicker: (action?: EncodingAction) => void;
    setSettings: (settings: Settings) => void;
    setData: (data: EditorData) => void;
    setActiveTab: (activeTab?: EditorTab) => void;
    setTabs: (tabs: Array<EditorTab>) => void;
}

const EMPTY_DATA: EditorData = {
    length: 0,
    lineCount: 1,
    selection: {
        selectionLength: 0,
        selectionRangeCount: 0,
    },
};

const EditorContext = createContext<IEditorContext | undefined>(undefined);

export const EditorContextProvider: React.FC<{children: ReactNode}> = ({children}) => {
    const [data, setData] = useState<EditorData>(EMPTY_DATA);
    const [activeTab, setActiveTab] = useState<EditorTab>();
    const [tabs, setTabs] = useState<Array<EditorTab>>([]);
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

    if (!context) throw new Error("useEditorContext must be used within an EditorContextProvider");

    return context;
};
