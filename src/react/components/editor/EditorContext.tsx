import {SupportedLanguage, SupportedLanguages} from "../../../domain/SupportedLanguage";
import {EditorData} from "../../../domain/EditorData";
import React, {createContext, ReactNode, useContext, useState} from "react";

interface IEditorContext {
    language: SupportedLanguage;
    data: EditorData;
    setLanguage: (language: SupportedLanguage) => void;
    setData: (data: EditorData) => void;
}

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
};

// Create the context
export const EditorContext = createContext<IEditorContext>({
    ...initial,
    setLanguage: () => {
    },
    setData: () => {
    },
});

// Create a Provider component
export const EditorContextProvider: React.FC<{ children: ReactNode }> = ({children}) => {
    const [language, setLanguage] = useState<SupportedLanguage>(initial.language);
    const [data, setData] = useState<EditorData>(initial.data);

    return (
        <EditorContext.Provider value={{language, data, setLanguage, setData}}>
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