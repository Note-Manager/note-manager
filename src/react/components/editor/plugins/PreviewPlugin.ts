import {EditorMenuItem, EditorPlugin, ToolbarMenuItem} from "./index";
import {Ace} from "ace-builds";
import {LanguageName} from "../../../../domain/SupportedLanguage";

const previewIcon = "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCA1MTIgNTEyIj48IS0tIUZvbnQgQXdlc29tZSBGcmVlIDYuNy4xIGJ5IEBmb250YXdlc29tZSAtIGh0dHBzOi8vZm9udGF3ZXNvbWUuY29tIExpY2Vuc2UgLSBodHRwczovL2ZvbnRhd2Vzb21lLmNvbS9saWNlbnNlL2ZyZWUgQ29weXJpZ2h0IDIwMjQgRm9udGljb25zLCBJbmMuLS0+PHBhdGggZD0iTTQ0OCA4MGM4LjggMCAxNiA3LjIgMTYgMTZsMCAzMTkuOC01LTYuNS0xMzYtMTc2Yy00LjUtNS45LTExLjYtOS4zLTE5LTkuM3MtMTQuNCAzLjQtMTkgOS4zTDIwMiAzNDAuN2wtMzAuNS00Mi43QzE2NyAyOTEuNyAxNTkuOCAyODggMTUyIDI4OHMtMTUgMy43LTE5LjUgMTAuMWwtODAgMTEyTDQ4IDQxNi4zbDAtLjNMNDggOTZjMC04LjggNy4yLTE2IDE2LTE2bDM4NCAwek02NCAzMkMyOC43IDMyIDAgNjAuNyAwIDk2TDAgNDE2YzAgMzUuMyAyOC43IDY0IDY0IDY0bDM4NCAwYzM1LjMgMCA2NC0yOC43IDY0LTY0bDAtMzIwYzAtMzUuMy0yOC43LTY0LTY0LTY0TDY0IDMyem04MCAxOTJhNDggNDggMCAxIDAgMC05NiA0OCA0OCAwIDEgMCAwIDk2eiIvPjwvc3ZnPg==";
const refreshIcon = "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCA1MTIgNTEyIj48IS0tIUZvbnQgQXdlc29tZSBGcmVlIDYuNy4xIGJ5IEBmb250YXdlc29tZSAtIGh0dHBzOi8vZm9udGF3ZXNvbWUuY29tIExpY2Vuc2UgLSBodHRwczovL2ZvbnRhd2Vzb21lLmNvbS9saWNlbnNlL2ZyZWUgQ29weXJpZ2h0IDIwMjQgRm9udGljb25zLCBJbmMuLS0+PHBhdGggZD0iTTQ2My41IDIyNGw4LjUgMGMxMy4zIDAgMjQtMTAuNyAyNC0yNGwwLTEyOGMwLTkuNy01LjgtMTguNS0xNC44LTIyLjJzLTE5LjMtMS43LTI2LjIgNS4yTDQxMy40IDk2LjZjLTg3LjYtODYuNS0yMjguNy04Ni4yLTMxNS44IDFjLTg3LjUgODcuNS04Ny41IDIyOS4zIDAgMzE2LjhzMjI5LjMgODcuNSAzMTYuOCAwYzEyLjUtMTIuNSAxMi41LTMyLjggMC00NS4zcy0zMi44LTEyLjUtNDUuMyAwYy02Mi41IDYyLjUtMTYzLjggNjIuNS0yMjYuMyAwcy02Mi41LTE2My44IDAtMjI2LjNjNjIuMi02Mi4yIDE2Mi43LTYyLjUgMjI1LjMtMUwzMjcgMTgzYy02LjkgNi45LTguOSAxNy4yLTUuMiAyNi4yczEyLjUgMTQuOCAyMi4yIDE0LjhsMTE5LjUgMHoiLz48L3N2Zz4=";


enum Keys {
    PREVIEW = "Preview.preview",
    REFRESH = "Preview.refresh",
}

export default class PreviewPlugin implements EditorPlugin {
    name: string = "Preview";

    applicationMenuItems: Array<EditorMenuItem> = [];
    contextMenuItems: Array<EditorMenuItem> = [];
    toolbarMenuItems: Array<ToolbarMenuItem> = [
        {
            label: "Preview",
            icon: previewIcon,
            onContentMount: (parent: ShadowRoot) => {
                const refreshButton = parent.getElementById('previewRefresh');
                const content = parent.getElementById('previewContent');

                if(refreshButton && content) {
                    const shadow = content.attachShadow({mode: 'open'});

                    shadow.innerHTML = preview(this.editor?.getValue(), getLanguage(this.editor)) || getEmptyPreviewResult();

                    refreshButton.addEventListener("click", () => {
                        shadow.innerHTML = "";
                        shadow.innerHTML = preview(this.editor?.getValue(), getLanguage(this.editor)) || getEmptyPreviewResult();
                    });
                }
            },
            getToolbarWindowContent: () => {
                return `
                    <div>
                        <style>
                            * {
                                font-size: 14px;
                            }
                            .warning, .warning > *{
                                background-color: rgb(195,169,90) !important;
                                color: black !important;
                            }
                            #previewRefresh {
                                transition: 0.2s all ease;
                                margin: 5px;
                                padding: 5px;
                                border: 1px solid black;
                                cursor: pointer;
                                display: flex;
                                align-items: center;
                            }
                            #previewRefresh:hover {
                                background-color: #cf681f !important;
                            }
                            
                            #previewContent {
                                width: 100%;
                                height: 100%;
                                max-width: 100%;
                                max-height: 100%;
                            }
                        </style>
                        <div id="previewButtons" style="display: flex; align-items: center; border-bottom: 1px solid; background-color: #323232;">
                            <div id="previewRefresh">
                                <img src="${refreshIcon}" alt="" width="20" style="margin: 0 5px"/>
                                <span>Refresh</span>
                            </div>
                        </div>
                        <div class="warning" style="margin-bottom: 10px;">
                            <span>Some images may not be loaded due to CSP restrictions</span>
                        </div>
                        <div id="previewContent">

                        </div>
                    </div>
                `;
            }
        }
    ];

    editor?: Ace.Editor;

    doAction(code: string): void {
        if(!this.editor) throw new Error("Plugin not initialized !");

        if(code === Keys.REFRESH) {
            const el = document.getElementById('previewContent');

            if(el) {
                el.innerHTML = this.editor?.getValue();
            }
        }
    }

    getAvailableActions(): Array<string> {
        return Object.keys(Keys);
    }

    initializePlugin(editor: Ace.Editor): void {
        this.editor = editor;
    }
}

function getLanguage(editor?: Ace.Editor): string {
    if(!editor) return LanguageName.TEXT;

    return editor?.getOption("mode").split("/").pop() || LanguageName.TEXT;
}

function preview(content?: string, lang?: string) {
    if(!content || !lang) return "";

    if(lang === LanguageName.HTML) {
        return content;
    } else {
        return content;
    }
}

function getEmptyPreviewResult() {
    return `
        <div style="display: flex; justify-content: center; align-items: center; width: 100%; height: 100%;">
            No content found for preview
        </div>
    `;
}