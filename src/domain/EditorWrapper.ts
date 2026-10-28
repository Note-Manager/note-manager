import {LanguageName} from "./SupportedLanguage";

export interface EditorWrapper {
    getSingleSelectionRange: () => any;
    getAllSelectionRanges: () => Array<any>;
    replaceSelection: (text: string) => void,
    replaceRange: (range: any, text: string) => void,
    replaceAllSelectionRanges: (text: string) => void,
    getSelectedText: () => string;
    getLanguage: () => LanguageName;
    getTextRange: (range: any) => string;
    getValue: () => string;
    getFullRange: () => any;
    onChange: (listener: () => void) => () => void;
    onLanguageChange: (listener: () => void) => () => void;
}
