import {EditorAction, EditorMenuItem, EditorPlugin} from "./index";
import {Ace} from "ace-builds";
import {LanguageName} from "../../../../domain/SupportedLanguage";
import xmlFormat from "xml-formatter";
import os from "os";

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

    editor?: Ace.Editor;

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

    initializePlugin(editor: Ace.Editor): void {
        this.editor = editor;

        this.initializeActionMap();
    }

    initializeActionMap() {
        this.actionMap = new Map();

        this.actionMap.set(Keys.FORMAT, {
            label: "Format",
            code: Keys.FORMAT,
            perform: () => {
                let langName = this.editor?.getOption("mode").split("/").pop() || LanguageName.TEXT;

                // multi selection
                const multiCursorRanges = this.editor?.getSelection().getAllRanges();
                if(multiCursorRanges && multiCursorRanges.length > 0 && (this.editor?.getSelectedText() || "").length > 0) {
                    for(let range of multiCursorRanges) {
                        const target = this.editor?.session.getTextRange(range) || "";

                        this.editor?.session.replace(range, format(langName, target));
                    }

                    return;
                }

                // single selection
                const singleCursorRange = this.editor?.getSelection().getRange();
                if(singleCursorRange && (this.editor?.getSelectedText() || "").length > 0) {
                    const target = this.editor?.session.getTextRange(singleCursorRange) || "";

                    this.editor?.session.replace(singleCursorRange, format(langName, target));

                    return;
                }

                // no selection
                this.editor?.setValue(format(langName, this.editor?.getValue()));
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