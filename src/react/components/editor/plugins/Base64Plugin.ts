import {EditorAction, EditorMenuItem, EditorPlugin} from "./index";
import {EditorWrapper} from "../../../../domain/EditorWrapper";

enum Keys {
    B64_ENCODE = "Base64_base64Encode",
    B64_DECODE = "Base64_base64Decode"
}

export default class Base64Plugin implements EditorPlugin {
    actionMap = new Map<string, EditorAction>();

    name: string = "Base64";
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
    contextMenuItems: Array<EditorMenuItem> = this.applicationMenuItems;
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
                    for(const range of selectionRanges) {
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
                    for(const range of selectionRanges) {
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
    const binary = atob(str.replace(/\s/g, ""));

    return new TextDecoder().decode(Uint8Array.from(binary, c => c.charCodeAt(0)));
}

function encode(str: string):string {
    const bytes = new TextEncoder().encode(str);

    let binary = "";
    for (let i = 0; i < bytes.length; i += 0x8000) {
        binary += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
    }

    return btoa(binary);
}