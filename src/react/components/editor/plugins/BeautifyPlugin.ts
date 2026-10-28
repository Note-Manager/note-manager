import {EditorMenuItem} from "./index";
import {BasePlugin} from "./BasePlugin";
import {LanguageName} from "../../../../domain/SupportedLanguage";
import {EditorWrapper} from "../../../../domain/EditorWrapper";
import {formatCode, isFormattable} from "../../../../utils/Formatter";
import {getNonEmptySelections} from "../../../../utils/EditorTransforms";
import {logError} from "../../../../utils/Log";

enum Keys {
    FORMAT = "beautify.format",
}

export default class BeautifyPlugin extends BasePlugin {
    readonly name = "Beautify";

    pendingFormat?: Promise<void>;

    readonly applicationMenuItems: Array<EditorMenuItem> = [
        {
            label: this.name,
            actions: [
                {
                    label: "Format",
                    code: Keys.FORMAT,
                    accelerator: "CmdOrCtrl+Shift+F",
                    isAvailable: editor => isFormattable(getLanguage(editor)),
                    perform: editor => {
                        this.pendingFormat = formatEditor(editor).catch(logError("cannot format"));
                    }
                }
            ]
        }
    ];
}

function getLanguage(editor: EditorWrapper) {
    return editor.getLanguage() || LanguageName.TEXT;
}

async function formatEditor(editor: EditorWrapper) {
    const language = getLanguage(editor);

    if (!isFormattable(language)) return;

    const ranges = getNonEmptySelections(editor);

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
