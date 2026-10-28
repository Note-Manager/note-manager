import React, {useEffect, useRef, useState} from "react";
import AceEditor from "react-ace";
import "ace-builds/src-noconflict/ext-language_tools";
import {Ace} from "ace-builds";
import {SupportedLanguage} from "../../../domain/SupportedLanguage";
import {fireEvent} from "../../ApplicationEvents";
import {listenPluginActions, stopListeningPluginActions} from "../../PluginActions";
import {EventType} from "../../../enums";
import {AceEditorWrapper} from "../../../domain/AceEditorWrapper";
import {useEditorContext} from "./EditorContext";
import {getAllPlugins, getUserPlugins, onUserPluginsChanged} from "../../UserPluginRegistry";

const LARGE_CONTENT_LENGTH = 2 * 1024 * 1024;

export default function Editor({content, language, newLineMode, onEditorLoad, changeListener, cursorListener, selectionListener}: {
    content: string,
    language: SupportedLanguage,
    newLineMode: "windows" | "unix",
    onEditorLoad: (editor: Ace.Editor) => void,
    changeListener: (value: string) => void,
    cursorListener: () => void,
    selectionListener: () => void
}) {
    const editorRef = useRef<Ace.Editor>();
    const containerRef = useRef<HTMLDivElement>(null);
    const wrapperRef = useRef<AceEditorWrapper>();

    const {settings} = useEditorContext();
    const editorSettings = settings.editor;

    const [mode, setMode] = useState<string>();

    const isLargeContent = content.length > LARGE_CONTENT_LENGTH;

    useEffect(() => {
        const importLanguageData = async () => {
            await import("ace-builds/src-noconflict/mode-" + language.name);
            await import("ace-builds/src-noconflict/snippets/" + language.name);
        };

        importLanguageData()
            .then(() => setMode(language.name))
            .catch(err => fireEvent(EventType.LOG_ERROR, `cannot load the ${language.name} mode: ${err}`));

        changeListener(content);

        listenPluginActions();

        if (editorRef.current) selectionListener();

        return stopListeningPluginActions;
    }, [language]);

    useEffect(() => {
        return onUserPluginsChanged(() => {
            const editorWrapper = wrapperRef.current;

            if (editorWrapper) getUserPlugins().forEach(p => p.initializePlugin(editorWrapper));

            listenPluginActions();
        });
    }, []);

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

            wrapperRef.current = editorWrapper;

            getAllPlugins().forEach(p => p.initializePlugin(editorWrapper));
        } catch (err) {
            console.error("could not initialize plugin: " + err);
        }

        onEditorLoad(editor);
    };

    return (
        <div ref={containerRef} style={{height: "100%", width: "100%"}}>
            <AceEditor
                mode={mode ?? undefined}
                theme={""}
                focus={true}
                value={content}
                onChange={changeListener}
                onCursorChange={cursorListener}
                onLoad={handleLoad}
                onSelectionChange={selectionListener}
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
                    highlightSelectedWord: false,
                    newLineMode: newLineMode,
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
