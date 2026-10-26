import {LanguageName} from "./SupportedLanguage";

export interface EditorWrapper {
    /**
     * Returns the selection range in a single cursor editor.
     */
    getSingleSelectionRange: () => any;

    /**
     * Returns the array of selection ranges in a multi cursor editor.
     */
    getAllSelectionRanges: () => Array<any>;

    /**
     * Replaces single cursor selection with given text.
     * @param text
     */
    replaceSelection: (text: string) => void,

    /**
     * Replaces the content in the given range with provided string.
     * @param range
     * @param text
     */
    replaceRange: (range: any, text: string) => void,

    /**
     * Replaces the contents of each selection range with the given string. Supports both single cursor and multiple cursors.
     * @param text
     */
    replaceAllSelectionRanges: (text: string) => void

    /**
     * Returns the selected text. If the editor is in multi cursor mode, returns the concatenation of the all selections.
     */
    getSelectedText: () => string;

    /**
     * Returns the language mode of the editor.
     */
    getLanguage: () => LanguageName;

    /**
     * Returns the text that is included by the given range.
     * @param range
     */
    getTextRange: (range: any) => string;

    /**
     * Returns the current value of the editor.
     */
    getValue: () => string;
}