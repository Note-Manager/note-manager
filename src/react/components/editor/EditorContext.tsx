import {EditorData} from "../../../domain/EditorData";
import React, {createContext, ReactNode, useContext, useEffect, useState} from "react";
import {EditorTab} from "../../../domain/EditorTab";

interface IEditorContext {
    data: EditorData;
    tabs: Array<EditorTab>;
    activeTab: EditorTab;

    setData: (data: EditorData) => void;
    setActiveTab: (activeTab: EditorTab) => void;
    setTabs: (activeTabs: EditorTab[]) => void;
}

// Initial values for the context
export const initial = {
    data: {
        length: 0,
        lineCount: 1,
        selection: {
            selectionLength: 0,
            selectionRangeCount: 0,
        },
        openedFile: "",
    },
    tabs: []
};

// Create the context
export const EditorContext = createContext<IEditorContext>({
    ...initial,
    activeTab: initial.tabs[0],
    setData: () => {
    },
    setActiveTab: () => {
    },
    setTabs: () => {
    }
});

// Create a Provider component
export const EditorContextProvider: React.FC<{ children: ReactNode }> = ({children}) => {
    const [data, setData] = useState<EditorData>(initial.data);
    const [activeTab, setActiveTab] = useState<EditorTab>(initial.tabs[0]);
    const [tabs, setTabs] = useState<Array<EditorTab>>(initial.tabs);

    return (
        <EditorContext.Provider value={{data, tabs, activeTab, setData, setTabs, setActiveTab}}>
            {children}
        </EditorContext.Provider>
    );
};

// Custom hook for accessing the context
export const useEditorContext = () => {
    const context = useContext(EditorContext);

    if (!context) {
        throw new Error("useEditorContext must be used within an EditorProvider");
    }

    return context;
};