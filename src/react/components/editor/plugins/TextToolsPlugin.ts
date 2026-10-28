import {EditorAction, EditorMenuItem, EditorPlugin} from "./index";
import {EditorWrapper} from "../../../../domain/EditorWrapper";

enum Keys {
    SORT_ASC = "TextTools_sortAscending",
    SORT_DESC = "TextTools_sortDescending",
    REVERSE = "TextTools_reverseLines",
    UNIQUE = "TextTools_removeDuplicateLines",
    REMOVE_EMPTY = "TextTools_removeEmptyLines",
    TRIM_TRAILING = "TextTools_trimTrailingWhitespace",
    UPPER = "TextTools_upperCase",
    LOWER = "TextTools_lowerCase",
    TITLE = "TextTools_titleCase",
}

type Transform = (text: string) => string;

const collator = new Intl.Collator(undefined, {numeric: true, sensitivity: "base"});

export function mapLines(text: string, fn: (lines: Array<string>) => Array<string>): string {
    const eol = text.includes("\r\n") ? "\r\n" : "\n";
    const trailing = text.endsWith(eol);
    const body = trailing ? text.substring(0, text.length - eol.length) : text;
    const result = fn(body.split(/\r?\n/)).join(eol);

    return trailing ? result + eol : result;
}

export const sortAscending: Transform = text => mapLines(text, lines => [...lines].sort(collator.compare));

export const sortDescending: Transform = text => mapLines(text, lines => [...lines].sort((a, b) => collator.compare(b, a)));

export const reverseLines: Transform = text => mapLines(text, lines => [...lines].reverse());

export const removeDuplicateLines: Transform = text => mapLines(text, lines => Array.from(new Set(lines)));

export const removeEmptyLines: Transform = text => mapLines(text, lines => lines.filter(l => l.trim().length > 0));

export const trimTrailingWhitespace: Transform = text => mapLines(text, lines => lines.map(l => l.replace(/[ \t]+$/, "")));

export const toUpperCase: Transform = text => text.toLocaleUpperCase();

export const toLowerCase: Transform = text => text.toLocaleLowerCase();

export const toTitleCase: Transform = text => text.toLocaleLowerCase().replace(/(^|[\s\-_.(["'])(\p{L})/gu, (m, sep: string, ch: string) => sep + ch.toLocaleUpperCase());

export default class TextToolsPlugin implements EditorPlugin {
    actionMap = new Map<string, EditorAction>();

    name: string = "Text Tools";
    applicationMenuItems: Array<EditorMenuItem> = [
        {
            label: "Lines",
            actions: [
                {label: "Sort Ascending", code: Keys.SORT_ASC, accelerator: "CmdOrCtrl+Alt+Shift+S"},
                {label: "Sort Descending", code: Keys.SORT_DESC},
                {label: "Reverse", code: Keys.REVERSE},
                {label: "Remove Duplicates", code: Keys.UNIQUE},
                {label: "Remove Empty Lines", code: Keys.REMOVE_EMPTY},
                {label: "Trim Trailing Whitespace", code: Keys.TRIM_TRAILING},
            ]
        },
        {
            label: "Case",
            actions: [
                {label: "UPPERCASE", code: Keys.UPPER},
                {label: "lowercase", code: Keys.LOWER},
                {label: "Title Case", code: Keys.TITLE},
            ]
        }
    ];
    contextMenuItems: Array<EditorMenuItem> = this.applicationMenuItems;
    editor?: EditorWrapper;

    doAction(code: string): void {
        if (!this.editor) throw new Error("Plugin not initialized !");
        if (!code || !this.actionMap.has(code)) throw new Error(`Unsupported operation ! (${code})`);

        const action = this.actionMap.get(code);

        action?.perform && action.perform(this.editor);
    }

    getAvailableActions(): Array<string> {
        return Array.from(this.actionMap.keys());
    }

    initializePlugin(editor: EditorWrapper): void {
        this.editor = editor;

        this.initializeActionMap();
    }

    initializeActionMap() {
        const transforms: Array<[Keys, string, Transform]> = [
            [Keys.SORT_ASC, "Sort Lines Ascending", sortAscending],
            [Keys.SORT_DESC, "Sort Lines Descending", sortDescending],
            [Keys.REVERSE, "Reverse Lines", reverseLines],
            [Keys.UNIQUE, "Remove Duplicate Lines", removeDuplicateLines],
            [Keys.REMOVE_EMPTY, "Remove Empty Lines", removeEmptyLines],
            [Keys.TRIM_TRAILING, "Trim Trailing Whitespace", trimTrailingWhitespace],
            [Keys.UPPER, "UPPERCASE", toUpperCase],
            [Keys.LOWER, "lowercase", toLowerCase],
            [Keys.TITLE, "Title Case", toTitleCase],
        ];

        for (const [code, label, transform] of transforms) {
            this.actionMap.set(code, {
                label: label,
                code: code,
                perform: (editor: EditorWrapper) => applyTransform(editor, transform)
            });
        }
    }
}

function applyTransform(editor: EditorWrapper, transform: Transform) {
    const ranges = (editor.getAllSelectionRanges() || []).filter(r => editor.getTextRange(r).length > 0);

    if (ranges.length === 0) {
        const value = editor.getValue();
        const result = transform(value);

        if (result !== value) editor.replaceRange(editor.getFullRange(), result);

        return;
    }

    for (const range of [...ranges].reverse()) {
        const target = editor.getTextRange(range);
        const result = transform(target);

        if (result !== target) editor.replaceRange(range, result);
    }
}
