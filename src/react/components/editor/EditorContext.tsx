import {SupportedLanguage, SupportedLanguages} from "../../../domain/SupportedLanguage";
import {EditorData} from "../../../domain/EditorData";
import React, {createContext, ReactNode, useContext, useEffect, useState} from "react";
import {EditorTab} from "../../../domain/EditorTab";
import {hash} from "../../../utils/TextUtils";

interface IEditorContext {
    language: SupportedLanguage;
    data: EditorData;
    tabs: Array<EditorTab>;
    activeTab: EditorTab;

    setLanguage: (language: SupportedLanguage) => void;
    setData: (data: EditorData) => void;
    setActiveTab: (activeTab: EditorTab) => void;
    setTabs: (activeTabs: EditorTab[]) => void;
}

const initialTabs: Array<EditorTab> = [
    {
        id: crypto.randomUUID(),
        name: "New Document.txt",
        displayName: "New Document.txt",
        content: "",
        language: SupportedLanguages.text,
    }
];

// Initial values for the context
export const initial = {
    language: SupportedLanguages.text,
    data: {
        length: 0,
        lineCount: 1,
        selection: {
            selectionLength: 0,
            selectionRangeCount: 0,
        },
        openedFile: "",
    },
    tabs: initialTabs
};

// Create the context
export const EditorContext = createContext<IEditorContext>({
    ...initial,
    activeTab: initial.tabs[0],
    setLanguage: () => {
    },
    setData: () => {
    },
    setActiveTab: () => {
    },
    setTabs: () => {
    }
});

// Create a Provider component
export const EditorContextProvider: React.FC<{ children: ReactNode }> = ({children}) => {
    const [language, setLanguage] = useState<SupportedLanguage>(initial.language);
    const [data, setData] = useState<EditorData>(initial.data);
    const [activeTab, setActiveTab] = useState<EditorTab>(initial.tabs[0]);
    const [tabs, setTabs] = useState<Array<EditorTab>>(initial.tabs);

    useEffect(() => {
        const init = async() => {
            activeTab.hash = await hash(activeTab.content||"");
        }

        init().then(r => r);
    }, []);

    return (
        <EditorContext.Provider value={{language, data, tabs, activeTab, setLanguage, setData, setTabs, setActiveTab}}>
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