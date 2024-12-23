import {EditorWrapper} from "./EditorWrapper";
import {Ace} from "ace-builds";
import {LanguageName} from "./SupportedLanguage";

export class AceEditorWrapper implements EditorWrapper {
    private _editor: Ace.Editor;

    constructor(editor: Ace.Editor) {
        this._editor = editor;
    }

    getAllSelectionRanges(): Array<Ace.Range> {
        const multiCursorRanges = this._editor?.getSelection().getAllRanges();

        if(multiCursorRanges?.length > 0) {
            return multiCursorRanges;
        } else {
            const singleSelectionRange = this.getSingleSelectionRange();

            return singleSelectionRange ? [singleSelectionRange] : [];
        }
    }

    getSingleSelectionRange(): Ace.Range {
        return this._editor.getSelectionRange();
    }

    replaceRange(range: Ace.Range, text: string): void {
        if(!range) return;

        this._editor.session.replace(range, text);
    }

    getSelectedText() {
        return this._editor.getSelectedText() || "";
    }

    replaceAllSelectionRanges(text: string): void {
        const ranges = this.getAllSelectionRanges();

        if(ranges?.length > 0) { // multi cursor
            for(let range of ranges) {
                this.replaceRange(range, text);
            }
        }
    }

    replaceSelection(text: string): void {
        const selectionRange = this.getSingleSelectionRange();

        this.replaceRange(selectionRange, text);
    }

    getLanguage(): LanguageName {
        return this._editor.getOption("mode").split("/").pop() as LanguageName || LanguageName.TEXT;
    }

    getTextRange(range: Ace.Range): string {
        return this._editor.session.getTextRange(range) || "";
    }

    getValue(): string {
        return this._editor.session.getValue();
    }
}