import {EditorAction, EditorMenuItem, EditorPlugin} from "./index";
import {LanguageName} from "../../../../domain/SupportedLanguage";
import {EditorWrapper} from "../../../../domain/EditorWrapper";
import {formatCode, isFormattable} from "../../../../utils/Formatter";

enum Keys {
    FORMAT = "beautify.format",
}

export default class BeautifyPlugin implements EditorPlugin{
    name: string = "Beautify";

    applicationMenuItems: Array<EditorMenuItem> = [
        {
            label: this.name,
            actions: [
                {
                    label: "Format",
                    code: Keys.FORMAT,
                    accelerator: "CmdOrCtrl+Shift+F"
                }
            ]
        }
    ];

    contextMenuItems: Array<EditorMenuItem> = [
        {
            label: this.name,
            actions: [
                {
                    label: "Format",
                    code: Keys.FORMAT,
                    isAvailable: (editor: EditorWrapper) => isFormattable(editor.getLanguage() || LanguageName.TEXT)
                }
            ]
        }
    ];

    editor?: EditorWrapper;

    actionMap?: Map<string, EditorAction>;

    pendingFormat?: Promise<void>;

    doAction(code: string): void {
        if(!this.editor || !this.actionMap) throw Error("Plugin not initialized !");
        if(!code) return;

        const action = this.actionMap.get(code);

        action?.perform && action.perform(this.editor);
    }

    getAvailableActions(): Array<string> {
        if(!this.editor || !this.actionMap) throw Error("Plugin not initialized !");

        return Array.from(this.actionMap.keys());
    }

    initializePlugin(editor: EditorWrapper): void {
        this.editor = editor;

        this.initializeActionMap();
    }

    initializeActionMap() {
        this.actionMap = new Map();

        this.actionMap.set(Keys.FORMAT, {
            label: "Format",
            code: Keys.FORMAT,
            perform: (editor: EditorWrapper) => {
                this.pendingFormat = formatEditor(editor).catch(err => console.error("cannot format: " + err));
            }
        });
    }
}

async function formatEditor(editor: EditorWrapper) {
    const language = editor.getLanguage() || LanguageName.TEXT;

    if (!isFormattable(language)) return;

    const ranges = (editor.getAllSelectionRanges() || []).filter(r => editor.getTextRange(r).length > 0);

    if (ranges.length === 0) {
        const value = editor.getValue();
        const result = await formatCode(language, value);

        if (result !== value && editor.getValue() === value) editor.replaceRange(editor.getFullRange(), result);

        return;
    }

    const targets = ranges.map(range => ({range: range, text: editor.getTextRange(range)}));
    const results = await Promise.all(targets.map(t => formatCode(language, t.text)));

    for (let i = targets.length - 1; i >= 0; i--) {
        const {range, text} = targets[i];

        if (results[i] !== text && editor.getTextRange(range) === text) editor.replaceRange(range, results[i]);
    }
}
