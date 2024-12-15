import * as React from 'react';
import {useEffect, useRef, useState} from 'react';
import AceEditor from "react-ace";
import 'ace-builds/src-noconflict/ext-searchbox';
import "ace-builds/src-noconflict/ext-language_tools";
import {Ace} from "ace-builds";
import {SupportedLanguage} from "../../../domain/SupportedLanguage";
import {fireEvent} from "../../ApplicationEvents";
import {EventType} from "../../../enums";
import {allPlugins} from "../../../utils/PluginLoader";
import {ipcRenderer} from "electron";

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

    const [mode, setMode] = useState<string>();

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

    const handleLoad = (editor: Ace.Editor) => {
        try {
            allPlugins.forEach(p => p.initializePlugin(editor));
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
        <div style={{height: '100%', width: '100%'}}>
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
                enableLiveAutocompletion={true}
                enableBasicAutocompletion={true}
                tabSize={4}
                fontSize={"1rem"}
                setOptions={{
                    fontFamily: "Courier New",
                    animatedScroll: true,
                    highlightActiveLine: true,
                    highlightGutterLine: true,
                    highlightSelectedWord: true,
                    newLineMode: "auto",
                    showPrintMargin: false,
                    useWorker: false,
                    enableSnippets: true,
                    cursorStyle: "ace"
                }}
                width={"100%"}
                height={"100%"}
            />
        </div>
    );
}

function listenPluginEvents() {
    allPlugins.forEach(plugin => {
        plugin.getAvailableActions().forEach(code => {
            ipcRenderer.on(code, () => {
                console.info("plugin event: " + code);
                plugin.doAction(code);
            })
        })
    });
}

function unListenPluginEvents() {
    allPlugins.flatMap(plugin => plugin.getAvailableActions()).forEach(code => {
        ipcRenderer.removeAllListeners(code);
    });
}