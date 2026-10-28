import {EditorWrapper} from "./EditorWrapper";
import {Ace} from "ace-builds";
import {LanguageName} from "./SupportedLanguage";

export class AceEditorWrapper implements EditorWrapper {
    private readonly editor: Ace.Editor;

    constructor(editor: Ace.Editor) {
        this.editor = editor;
    }

    getSingleSelectionRange(): Ace.Range {
        return this.editor.getSelectionRange();
    }

    getAllSelectionRanges(): Array<Ace.Range> {
        const ranges = this.editor.getSelection().getAllRanges();

        return ranges.length > 0 ? ranges : [this.getSingleSelectionRange()];
    }

    replaceSelection(text: string): void {
        this.replaceRange(this.getSingleSelectionRange(), text);
    }

    replaceRange(range: Ace.Range, text: string): void {
        if (!range) return;

        this.editor.session.replace(range, text);
    }

    replaceAllSelectionRanges(text: string): void {
        [...this.getAllSelectionRanges()].reverse().forEach(range => this.replaceRange(range, text));
    }

    getSelectedText() {
        return this.editor.getSelectedText() || "";
    }

    getLanguage(): LanguageName {
        const mode = this.editor.getOption("mode");
        const modeId = typeof mode === "string" ? mode : String((mode as any)?.$id || "");

        return modeId.split("/").pop() as LanguageName || LanguageName.TEXT;
    }

    getTextRange(range: Ace.Range): string {
        return this.editor.session.getTextRange(range) || "";
    }

    getValue(): string {
        return this.editor.session.getValue();
    }

    getFullRange() {
        const doc = this.editor.session.getDocument();
        const lastRow = doc.getLength() - 1;

        return {start: {row: 0, column: 0}, end: {row: lastRow, column: doc.getLine(lastRow).length}};
    }

    onChange(listener: () => void): () => void {
        this.editor.on("change", listener);

        return () => this.editor.off("change", listener);
    }

    onLanguageChange(listener: () => void): () => void {
        this.editor.on("changeMode", listener);

        return () => this.editor.off("changeMode", listener);
    }
}
