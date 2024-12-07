import {EditorAction, EditorMenuItem, EditorPlugin} from "./index";
import {Ace} from "ace-builds";

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
    editor?: Ace.Editor

    doAction(code: string): void {
        if(!this.editor) throw new Error("Plugin not initialized !");
        if(!code || !this.actionMap.has(code)) throw new Error(`Unsupported operation ! (${code})`);

        const action = this.actionMap.get(code);

        action?.perform && action.perform(this.editor);
    }

    getAvailableActions(): Array<string> {
        return Array.from(this.actionMap.keys());
    }

    initializePlugin(editor: Ace.Editor): void {
        this.editor = editor;

        this.initializeActionMap();
    }

    initializeActionMap() {
        this.actionMap.set(Keys.B64_ENCODE, {
            label: "Base64 Encode",
            code: Keys.B64_ENCODE,
            perform: (editor: Ace.Editor) => {
                editor.session.replace(editor.getSelectionRange(), encode(editor.getSelectedText()));
            }
        });

        this.actionMap.set(Keys.B64_DECODE, {
            label: "Base64 Decode",
            code: Keys.B64_DECODE,
            perform: (editor: Ace.Editor) => {
                editor.session.replace(editor.getSelectionRange(), decode(editor.getSelectedText()));
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