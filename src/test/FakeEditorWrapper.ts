import {EditorWrapper} from "../domain/EditorWrapper";
import {LanguageName} from "../domain/SupportedLanguage";

export class FakeEditorWrapper implements EditorWrapper {
    text: string;
    language: LanguageName;
    selections: Array<{start: number, end: number}>;
    changeListeners: Array<() => void> = [];
    languageListeners: Array<() => void> = [];

    constructor(text: string, language: LanguageName = LanguageName.TEXT, selections?: Array<{start: number, end: number}>) {
        this.text = text;
        this.language = language;
        this.selections = selections ?? [{start: 0, end: text.length}];
    }

    getSingleSelectionRange() {
        return this.selections[0];
    }

    getAllSelectionRanges() {
        return this.selections;
    }

    replaceSelection(text: string) {
        this.replaceRange(this.selections[0], text);
    }

    replaceRange(range: {start: number, end: number}, text: string) {
        const delta = text.length - (range.end - range.start);

        this.text = this.text.substring(0, range.start) + text + this.text.substring(range.end);

        this.selections = this.selections.map(s => {
            if (s === range) return {start: s.start, end: s.start + text.length};
            if (s.start >= range.end) return {start: s.start + delta, end: s.end + delta};
            return s;
        });
    }

    replaceAllSelectionRanges(text: string) {
        [...this.selections].reverse().forEach(s => this.replaceRange(s, text));
    }

    getSelectedText() {
        return this.selections.map(s => this.text.substring(s.start, s.end)).join("");
    }

    getLanguage() {
        return this.language;
    }

    getTextRange(range: {start: number, end: number}) {
        return this.text.substring(range.start, range.end);
    }

    getValue() {
        return this.text;
    }

    getFullRange() {
        return {start: 0, end: this.text.length};
    }

    onChange(listener: () => void) {
        this.changeListeners.push(listener);

        return () => {
            this.changeListeners = this.changeListeners.filter(l => l !== listener);
        };
    }

    onLanguageChange(listener: () => void) {
        this.languageListeners.push(listener);

        return () => {
            this.languageListeners = this.languageListeners.filter(l => l !== listener);
        };
    }

    setLanguage(language: LanguageName) {
        this.language = language;
        this.languageListeners.forEach(l => l());
    }

    setValue(text: string) {
        this.text = text;
        this.changeListeners.forEach(l => l());
    }
}
