import {EditorWrapper} from "../domain/EditorWrapper";

export type TextTransform = (text: string) => string;

export function getNonEmptySelections(editor: EditorWrapper) {
    return (editor.getAllSelectionRanges() || []).filter(range => editor.getTextRange(range).length > 0);
}

export function transformSelections(editor: EditorWrapper, transform: TextTransform): boolean {
    const ranges = getNonEmptySelections(editor);

    for (const range of [...ranges].reverse()) {
        const text = editor.getTextRange(range);
        const result = transform(text);

        if (result !== text) editor.replaceRange(range, result);
    }

    return ranges.length > 0;
}

export function transformSelectionsOrDocument(editor: EditorWrapper, transform: TextTransform) {
    if (transformSelections(editor, transform)) return;

    const value = editor.getValue();
    const result = transform(value);

    if (result !== value) editor.replaceRange(editor.getFullRange(), result);
}
