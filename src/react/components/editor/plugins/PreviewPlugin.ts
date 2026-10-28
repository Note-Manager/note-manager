import {EditorMenuItem, EditorPlugin, ToolbarMenuItem, ToolWindowContext} from "./index";
import {LanguageName} from "../../../../domain/SupportedLanguage";
import DOMPurify from "dompurify";
import {EditorWrapper} from "../../../../domain/EditorWrapper";
import {markdownToHtml} from "../../../../utils/Markdown";
import {highlightCodeBlocks} from "./CodeHighlighter";
import {PREVIEW_STYLES} from "./PreviewStyles";

const previewIcon = "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCA1MTIgNTEyIj48IS0tIUZvbnQgQXdlc29tZSBGcmVlIDYuNy4xIGJ5IEBmb250YXdlc29tZSAtIGh0dHBzOi8vZm9udGF3ZXNvbWUuY29tIExpY2Vuc2UgLSBodHRwczovL2ZvbnRhd2Vzb21lLmNvbS9saWNlbnNlL2ZyZWUgQ29weXJpZ2h0IDIwMjQgRm9udGljb25zLCBJbmMuLS0+PHBhdGggZD0iTTQ0OCA4MGM4LjggMCAxNiA3LjIgMTYgMTZsMCAzMTkuOC01LTYuNS0xMzYtMTc2Yy00LjUtNS45LTExLjYtOS4zLTE5LTkuM3MtMTQuNCAzLjQtMTkgOS4zTDIwMiAzNDAuN2wtMzAuNS00Mi43QzE2NyAyOTEuNyAxNTkuOCAyODggMTUyIDI4OHMtMTUgMy43LTE5LjUgMTAuMWwtODAgMTEyTDQ4IDQxNi4zbDAtLjNMNDggOTZjMC04LjggNy4yLTE2IDE2LTE2bDM4NCAwek02NCAzMkMyOC43IDMyIDAgNjAuNyAwIDk2TDAgNDE2YzAgMzUuMyAyOC43IDY0IDY0IDY0bDM4NCAwYzM1LjMgMCA2NC0yOC43IDY0LTY0bDAtMzIwYzAtMzUuMy0yOC43LTY0LTY0LTY0TDY0IDMyem04MCAxOTJhNDggNDggMCAxIDAgMC05NiA0OCA0OCAwIDEgMCAwIDk2eiIvPjwvc3ZnPg==";
const refreshIcon = "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCA1MTIgNTEyIj48IS0tIUZvbnQgQXdlc29tZSBGcmVlIDYuNy4xIGJ5IEBmb250YXdlc29tZSAtIGh0dHBzOi8vZm9udGF3ZXNvbWUuY29tIExpY2Vuc2UgLSBodHRwczovL2ZvbnRhd2Vzb21lLmNvbS9saWNlbnNlL2ZyZWUgQ29weXJpZ2h0IDIwMjQgRm9udGljb25zLCBJbmMuLS0+PHBhdGggZD0iTTQ2My41IDIyNGw4LjUgMGMxMy4zIDAgMjQtMTAuNyAyNC0yNGwwLTEyOGMwLTkuNy01LjgtMTguNS0xNC44LTIyLjJzLTE5LjMtMS43LTI2LjIgNS4yTDQxMy40IDk2LjZjLTg3LjYtODYuNS0yMjguNy04Ni4yLTMxNS44IDFjLTg3LjUgODcuNS04Ny41IDIyOS4zIDAgMzE2LjhzMjI5LjMgODcuNSAzMTYuOCAwYzEyLjUtMTIuNSAxMi41LTMyLjggMC00NS4zcy0zMi44LTEyLjUtNDUuMyAwYy02Mi41IDYyLjUtMTYzLjggNjIuNS0yMjYuMyAwcy02Mi41LTE2My44IDAtMjI2LjNjNjIuMi02Mi4yIDE2Mi43LTYyLjUgMjI1LjMtMUwzMjcgMTgzYy02LjkgNi45LTguOSAxNy4yLTUuMiAyNi4yczEyLjUgMTQuOCAyMi4yIDE0LjhsMTE5LjUgMHoiLz48L3N2Zz4=";

const LIVE_PREVIEW_DELAY = 300;
const ALLOWED_URI_REGEXP = /^(?:(?:(?:f|ht)tps?|mailto|tel|file):|[^a-z]|[a-z+.-]+(?:[^a-z+.\-:]|$))/i;

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
            onContentMount: (parent: ShadowRoot, context: ToolWindowContext) => {
                const refreshButton = parent.getElementById("previewRefresh");
                const content = parent.getElementById("previewContent");

                if(!refreshButton || !content) return;

                const shadow = content.attachShadow({mode: "open"});
                const style = document.createElement("style");
                const body = document.createElement("div");

                style.textContent = PREVIEW_STYLES;
                shadow.append(style, body);

                let generation = 0;
                let timer: ReturnType<typeof setTimeout> | undefined;
                let language = context.language || this.editor?.getLanguage();

                const render = () => {
                    const current = ++generation;

                    body.className = language === LanguageName.MARKDOWN ? "markdown-body" : "html-body";
                    body.innerHTML = preview(this.editor?.getValue(), language, context.filePath) || getEmptyPreviewResult();

                    if(language === LanguageName.MARKDOWN) {
                        highlightCodeBlocks(body, () => current === generation && parent.host.isConnected)
                            .catch(err => console.error("cannot highlight code blocks: " + err));
                    }
                };

                const unsubscribeAll = () => {
                    clearTimeout(timer);
                    unsubscribeContent?.();
                    unsubscribeLanguage?.();
                };

                const unsubscribeContent = this.editor?.onChange(() => {
                    if(!parent.host.isConnected) return unsubscribeAll();

                    clearTimeout(timer);
                    timer = setTimeout(render, LIVE_PREVIEW_DELAY);
                });

                const unsubscribeLanguage = this.editor?.onLanguageChange(() => {
                    if(!parent.host.isConnected) return unsubscribeAll();

                    language = this.editor?.getLanguage();
                    clearTimeout(timer);
                    render();
                });

                shadow.addEventListener("click", (event) => {
                    const anchor = (event.target as Element)?.closest?.("a");
                    const href = anchor?.getAttribute("href");

                    if(!anchor || !href) return;

                    if(href.startsWith("#")) {
                        event.preventDefault();
                        shadow.getElementById(decodeURIComponent(href.substring(1)))?.scrollIntoView({block: "start"});
                    } else if(!/^https?:/i.test(href)) {
                        event.preventDefault();
                    }
                });

                this.refresh = render;
                refreshButton.addEventListener("click", render);

                render();
            },
            getToolbarWindowContent: () => {
                return `
                    <div id="previewWrapper">
                        <style>
                            #previewWrapper {
                                width: 100%;
                                height: 100%;
                                display: flex;
                                flex-direction: column;
                            }

                            #previewButtons {
                                display: flex;
                                align-items: center;
                                padding: 4px 6px;
                                border-bottom: 1px solid var(--border-color);
                            }

                            #previewRefresh {
                                display: flex;
                                align-items: center;
                                gap: 6px;
                                padding: 3px 8px;
                                border: 1px solid var(--border-color);
                                border-radius: 4px;
                                background-color: var(--action-bg);
                                color: var(--color);
                                font-size: 12px;
                                cursor: pointer;
                                transition: 0.2s background-color ease;
                            }

                            #previewRefresh:hover {
                                background-color: var(--positive-color);
                            }

                            #previewRefresh img {
                                width: 12px;
                                height: 12px;
                                filter: invert(0.6);
                            }

                            ::-webkit-scrollbar {
                                width: 8px;
                                height: 8px;
                            }

                            ::-webkit-scrollbar-track, ::-webkit-scrollbar-corner {
                                background: transparent;
                            }

                            ::-webkit-scrollbar-thumb {
                                background: var(--scrollbar-thumb-color);
                                border-radius: 5px;
                            }

                            #previewContent {
                                flex: 1;
                                min-height: 0;
                                overflow: auto;
                            }
                        </style>
                        <div id="previewButtons">
                            <div id="previewRefresh" title="The preview follows your changes, refresh redraws it now">
                                <img src="${refreshIcon}" alt=""/>
                                <span>Refresh</span>
                            </div>
                        </div>
                        <div id="previewContent"></div>
                    </div>
                `;
            }
        }
    ];

    editor?: EditorWrapper;

    private refresh?: () => void;

    doAction(code: string): void {
        if(!this.editor) throw new Error("Plugin not initialized !");

        if(code === Keys.REFRESH) this.refresh?.();
    }

    getAvailableActions(): Array<string> {
        return Object.values(Keys);
    }

    initializePlugin(editor: EditorWrapper): void {
        this.editor = editor;
    }
}

export function preview(content?: string, lang?: string, filePath?: string) {
    if(!content || !lang) return "";

    if(lang === LanguageName.MARKDOWN) {
        return DOMPurify.sanitize(markdownToHtml(content, {filePath}), {ALLOWED_URI_REGEXP});
    }

    return DOMPurify.sanitize(content);
}

function getEmptyPreviewResult() {
    return `<div class="empty">No content found for preview</div>`;
}
