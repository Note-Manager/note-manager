import {EditorAction, EditorMenuItem} from "./index";
import {BasePlugin} from "./BasePlugin";
import {TextTransform, transformSelectionsOrDocument} from "../../../../utils/EditorTransforms";

enum Keys {
    SORT_ASC = "textTools.sortAscending",
    SORT_DESC = "textTools.sortDescending",
    REVERSE = "textTools.reverseLines",
    UNIQUE = "textTools.removeDuplicateLines",
    REMOVE_EMPTY = "textTools.removeEmptyLines",
    TRIM_TRAILING = "textTools.trimTrailingWhitespace",
    UPPER = "textTools.upperCase",
    LOWER = "textTools.lowerCase",
    TITLE = "textTools.titleCase",
}

const collator = new Intl.Collator(undefined, {numeric: true, sensitivity: "base"});

export function mapLines(text: string, fn: (lines: Array<string>) => Array<string>): string {
    const eol = text.includes("\r\n") ? "\r\n" : "\n";
    const trailing = text.endsWith(eol);
    const body = trailing ? text.substring(0, text.length - eol.length) : text;
    const result = fn(body.split(/\r?\n/)).join(eol);

    return trailing ? result + eol : result;
}

export const sortAscending: TextTransform = text => mapLines(text, lines => [...lines].sort(collator.compare));

export const sortDescending: TextTransform = text => mapLines(text, lines => [...lines].sort((a, b) => collator.compare(b, a)));

export const reverseLines: TextTransform = text => mapLines(text, lines => [...lines].reverse());

export const removeDuplicateLines: TextTransform = text => mapLines(text, lines => Array.from(new Set(lines)));

export const removeEmptyLines: TextTransform = text => mapLines(text, lines => lines.filter(l => l.trim().length > 0));

export const trimTrailingWhitespace: TextTransform = text => mapLines(text, lines => lines.map(l => l.replace(/[ \t]+$/, "")));

export const toUpperCase: TextTransform = text => text.toLocaleUpperCase();

export const toLowerCase: TextTransform = text => text.toLocaleLowerCase();

export const toTitleCase: TextTransform = text => text.toLocaleLowerCase().replace(/(^|[\s\-_.(["'])(\p{L})/gu, (m, sep: string, ch: string) => sep + ch.toLocaleUpperCase());

export default class TextToolsPlugin extends BasePlugin {
    readonly name = "Text Tools";

    readonly applicationMenuItems: Array<EditorMenuItem> = [
        {
            label: "Lines",
            actions: [
                transformAction("Sort Ascending", Keys.SORT_ASC, sortAscending, "CmdOrCtrl+Alt+Shift+S"),
                transformAction("Sort Descending", Keys.SORT_DESC, sortDescending),
                transformAction("Reverse", Keys.REVERSE, reverseLines),
                transformAction("Remove Duplicates", Keys.UNIQUE, removeDuplicateLines),
                transformAction("Remove Empty Lines", Keys.REMOVE_EMPTY, removeEmptyLines),
                transformAction("Trim Trailing Whitespace", Keys.TRIM_TRAILING, trimTrailingWhitespace),
            ]
        },
        {
            label: "Case",
            actions: [
                transformAction("UPPERCASE", Keys.UPPER, toUpperCase),
                transformAction("lowercase", Keys.LOWER, toLowerCase),
                transformAction("Title Case", Keys.TITLE, toTitleCase),
            ]
        }
    ];
}

function transformAction(label: string, code: Keys, transform: TextTransform, accelerator?: string): EditorAction {
    return {
        label: label,
        code: code,
        accelerator: accelerator,
        perform: editor => transformSelectionsOrDocument(editor, transform),
    };
}
