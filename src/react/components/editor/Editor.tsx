import * as React from 'react';
import {useEffect, useRef, useState} from 'react';
import AceEditor from "react-ace";
import 'ace-builds/src-noconflict/ext-searchbox';
import "ace-builds/src-noconflict/ext-language_tools";
import {Ace} from "ace-builds";
import {SupportedLanguage} from "../../../domain/SupportedLanguage";
import {fireEvent, off, on} from "../../ApplicationEvents";
import {EventType} from "../../../enums";
import {allPlugins} from "../../../utils/PluginLoader";
import {AceEditorWrapper} from "../../../domain/AceEditorWrapper";
import {useEditorContext} from "./EditorContext";

const LARGE_CONTENT_LENGTH = 2 * 1024 * 1024;

export default function Editor({content, language, onEditorLoad, changeListener, cursorListener, selectionListener}: {
    content: string,
    language: SupportedLanguage
    onEditorLoad: ((editor: Ace.Editor) => void) | undefined,
    changeListener: ({value, lineCount}: { value: string, lineCount: number }) => void,
    cursorListener: (value: any) => void,
    selectionListener: ({isTextSelected, selectedText, ranges}: {
        isTextSelected: boolean,
        selectedText: string,
        ranges: Array<Ace.Range>
    }) => void
}) {
    const editorRef = useRef<Ace.Editor>();
    const containerRef = useRef<HTMLDivElement>(null);

    const {settings} = useEditorContext();
    const editorSettings = settings.editor;

    const [mode, setMode] = useState<string>();

    const isLargeContent = content.length > LARGE_CONTENT_LENGTH;

    const isTextSelected = (): boolean => {
        const selectionRange = editorRef.current?.getSelectionRange();

        if (!selectionRange) return false;

        return selectionRange.start.row !== selectionRange.end.row ||
            selectionRange.start.column !== selectionRange.end.column;
    }

    useEffect(() => {
        const importLanguageData = async () => {
            await import('ace-builds/src-noconflict/mode-' + language.name);
            await import('ace-builds/src-noconflict/snippets/' + language.name);
        }

        importLanguageData().then(() => {
            setMode(language.name);
        }).catch(async (err) => {
            await fireEvent(EventType.LOG_ERROR, "trying to import invalid mode: " + language.name + " with error: " + err);
        });

        onChange(content);

        listenPluginEvents();

        if (editorRef.current) handleSelectionChange();

        return () => {
            unListenPluginEvents();
        }
    }, [language]);

    useEffect(() => {
        const container = containerRef.current;

        if (!container) return;

        const observer = new ResizeObserver(() => editorRef.current?.resize());

        observer.observe(container);

        return () => observer.disconnect();
    }, []);

    const handleLoad = (editor: Ace.Editor) => {
        editorRef.current = editor;

        try {
            const editorWrapper = new AceEditorWrapper(editor);

            allPlugins.forEach(p => {
                console.log("initializing plugin... ("+p.name+")");
                p.initializePlugin(editorWrapper)
            });
        } catch (err) {
            console.error("could not initialize plugin: " + err);
        }

        if (onEditorLoad) onEditorLoad(editor);
    }

    const onChange = (value: string) => {
        if (changeListener) {
            changeListener({
                value: value,
                lineCount: editorRef.current?.session.getLength() || 0,
            });
        }
    }

    const handleSelectionChange = () => {
        if (selectionListener) {
            selectionListener({
                isTextSelected: isTextSelected(),
                selectedText: editorRef.current?.getSelectedText() || "",
                ranges: editorRef.current?.session.getSelection().getAllRanges() || []
            });
        }
    }

    const handleCursorChange = (value: any) => {
        if (cursorListener) cursorListener(value);
    }

    return (
        <div ref={containerRef} style={{height: '100%', width: '100%'}}>
            <AceEditor
                mode={mode ?? undefined}
                theme={""}
                focus={true}
                value={content}
                onChange={onChange}
                onCursorChange={handleCursorChange}
                onLoad={handleLoad}
                onSelectionChange={handleSelectionChange}
                placeholder={"Empty document.."}
                enableLiveAutocompletion={!isLargeContent}
                enableBasicAutocompletion={!isLargeContent}
                tabSize={editorSettings.tabSize}
                fontSize={editorSettings.fontSize}
                wrapEnabled={editorSettings.wrap}
                showGutter={editorSettings.showLineNumbers}
                setOptions={{
                    fontFamily: editorSettings.fontFamily,
                    showInvisibles: editorSettings.showInvisibles,
                    animatedScroll: !isLargeContent,
                    highlightActiveLine: true,
                    highlightGutterLine: true,
                    highlightSelectedWord: !isLargeContent,
                    newLineMode: "auto",
                    showPrintMargin: false,
                    useWorker: false,
                    enableSnippets: !isLargeContent,
                    cursorStyle: "ace",
                    scrollPastEnd: false,
                    useSoftTabs: editorSettings.useSoftTabs,
                    navigateWithinSoftTabs: false,
                }}
                width={"100%"}
                height={"100%"}
            />
        </div>
    );
}

let pluginEventSubscriptions: Array<() => void> = [];

function listenPluginEvents() {
    unListenPluginEvents();

    allPlugins.forEach(plugin => {
        plugin.getAvailableActions().forEach(code => {
            const listener = () => {
                console.info("plugin event: " + code);
                plugin.doAction(code);
            };

            on(code, listener);
            pluginEventSubscriptions.push(() => off(code, listener));
        })
    });
}

function unListenPluginEvents() {
    pluginEventSubscriptions.forEach(unsubscribe => unsubscribe());
    pluginEventSubscriptions = [];
}
