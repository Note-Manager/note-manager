import {EditorAction, EditorMenuItem, EditorPlugin} from "./index";
import {LanguageName} from "../../../../domain/SupportedLanguage";
import xmlFormat from "xml-formatter";
import os from "os";
import {EditorWrapper} from "../../../../domain/EditorWrapper";

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

    ];

    editor?: EditorWrapper;

    actionMap?: Map<string, EditorAction>;

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
            perform: () => {
                let langName = this.editor?.getLanguage() || LanguageName.TEXT;

                const selectionRanges = this.editor?.getAllSelectionRanges();
                if(selectionRanges && selectionRanges.length > 0 && (this.editor?.getSelectedText() || "").length > 0) {
                    for(let range of selectionRanges) {
                        const target = this.editor?.getTextRange(range) || "";

                        this.editor?.replaceRange(range, format(langName, target));
                    }

                    return;
                }
            }
        });
    }
}

function format(lang: string, content: string) {
    if(lang === LanguageName.TEXT) return content;

    try {
        if([LanguageName.XML, LanguageName.HTML].includes(lang as LanguageName)) {
            return handleXML(content);
        } else if(lang === LanguageName.JSON) {
            return JSON.stringify(JSON.parse(content), null, 4);
        }
    } catch (ignored) {
        console.warn("cannot format content: " + ignored);
        return content;
    }

    return content;
}

function handleXML(content: string) {
    return xmlFormat(content, {lineSeparator: os.EOL, strictMode: false, collapseContent: true, indentation: "    "});
}