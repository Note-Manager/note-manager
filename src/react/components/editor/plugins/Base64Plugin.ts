import {EditorAction, EditorMenuItem, EditorPlugin} from "./index";
import {EditorWrapper} from "../../../../domain/EditorWrapper";

enum Keys {
    B64_ENCODE = "Base64_base64Encode",
    B64_DECODE = "Base64_base64Decode"
}

export default class Base64Plugin implements EditorPlugin {
    actionMap = new Map<string, EditorAction>();

    name: string = "Base64";
    contextMenuItems: Array<EditorMenuItem> = []
    applicationMenuItems: Array<EditorMenuItem> = [
        {
            label: "Base64",
            actions: [
                {
                    label: "Encode",
                    code: Keys.B64_ENCODE,
                    accelerator: "CmdOrCtrl+Alt+Shift+E"
                },
                {
                    label: "Decode",
                    code: Keys.B64_DECODE,
                    accelerator: "CmdOrCtrl+Alt+Shift+D"
                }
            ]
        }
    ];
    editor?: EditorWrapper

    doAction(code: string): void {
        if(!this.editor) throw new Error("Plugin not initialized !");
        if(!code || !this.actionMap.has(code)) throw new Error(`Unsupported operation ! (${code})`);

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
        this.actionMap.set(Keys.B64_ENCODE, {
            label: "Base64 Encode",
            code: Keys.B64_ENCODE,
            perform: (editor: EditorWrapper) => {
                const selectionRanges = editor.getAllSelectionRanges();

                if(selectionRanges && selectionRanges.length > 0 && (editor.getSelectedText() || "").length > 0) {
                    for(let range of selectionRanges) {
                        const target = editor.getTextRange(range);

                        target && editor.replaceRange(range, encode(target));
                    }

                    return;
                }
            }
        });

        this.actionMap.set(Keys.B64_DECODE, {
            label: "Base64 Decode",
            code: Keys.B64_DECODE,
            perform: (editor: EditorWrapper) => {
                const selectionRanges = editor.getAllSelectionRanges();

                if(selectionRanges && selectionRanges.length > 0 && (editor.getSelectedText() || "").length > 0) {
                    for(let range of selectionRanges) {
                        const target = editor.getTextRange(range);

                        target && editor.replaceRange(range, decode(target));
                    }

                    return;
                }
            }
        });
    }
}

function decode(str: string):string {
    return Buffer.from(str, 'base64').toString('utf-8');
}

function encode(str: string):string {
    return Buffer.from(str, 'utf-8').toString('base64');
}