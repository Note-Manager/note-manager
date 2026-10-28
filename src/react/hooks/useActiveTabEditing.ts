import {MutableRefObject} from "react";
import {Ace} from "ace-builds";
import {EditorTab} from "../../domain/EditorTab";
import {SupportedLanguage} from "../../domain/SupportedLanguage";
import {EncodingAction, EventType} from "../../enums";
import {EolType, getEditorNewLineMode, isKnownEncoding, isKnownEol} from "../../domain/Encoding";
import {fireEvent} from "../ApplicationEvents";
import {saveTab} from "../TabSaver";
import {markStateChanged} from "../StateChangeTracker";
import {useEditorContext} from "../components/editor/EditorContext";
import {useIpcEvents} from "./useIpcEvents";
import {hashTab, refreshIsChanged, renameTab} from "../../utils/TabUtils";
import {logError} from "../../utils/Log";

export type EncodingActionRunner = (action: EncodingAction, encoding?: string) => void;

export function useActiveTabEditing(editorRef: MutableRefObject<Ace.Editor | undefined>, onTabUpdated: () => void): EncodingActionRunner {
    const {activeTab, setEncodingPicker} = useEditorContext();

    const tabUpdated = () => {
        markStateChanged();
        onTabUpdated();
    };

    const refreshChangedState = async (tab: EditorTab) => {
        const editor = editorRef.current;

        if (editor) tab.content = editor.getValue();

        await refreshIsChanged(tab);

        tabUpdated();
    };

    const setLanguage = (tab: EditorTab, language: SupportedLanguage) => {
        tab.language = language;

        if (tab.isTemp && tab.name) renameTab(tab, tab.name.substring(0, tab.name.lastIndexOf(".")) + language.extensions[0]);

        tabUpdated();
    };

    const save = (tab: EditorTab) => {
        if (!tab.isChanged) return;

        saveTab(tab)
            .then(isSaved => isSaved && onTabUpdated())
            .catch(logError("cannot save " + tab.name));
    };

    const reinterpret = async (tab: EditorTab, encoding?: string) => {
        if (!tab.file) {
            if (!encoding) return;

            tab.encoding = encoding;
            return refreshChangedState(tab);
        }

        if (tab.isChanged && !await fireEvent(EventType.CONFIRM_REINTERPRET, {name: tab.name, encoding: encoding})) return;

        const result = await fireEvent(EventType.READ_FILE_AS, {file: tab.file, encoding: encoding, fallbackEol: tab.eol});

        tab.encoding = result.encoding;
        tab.eol = result.eol;
        tab.content = result.content;
        tab.hash = await hashTab(tab);
        tab.isChanged = false;

        const editor = editorRef.current;

        if (editor) {
            editor.session.setNewLineMode(getEditorNewLineMode(result.eol));
            editor.session.setValue(result.content);
            tab.state = {...tab.state, undoHistory: undefined};
        }

        tabUpdated();
    };

    const convert = async (tab: EditorTab, encoding: string) => {
        if (encoding === tab.encoding) return;

        if (!await fireEvent(EventType.CONFIRM_CONVERSION, {content: editorRef.current?.getValue() ?? tab.content ?? "", encoding: encoding})) return;

        tab.encoding = encoding;

        await refreshChangedState(tab);
    };

    const runEncodingAction: EncodingActionRunner = (action, encoding) => {
        const tab = activeTab;

        if (!tab) return;

        const run = action === EncodingAction.REDETECT
            ? reinterpret(tab)
            : isKnownEncoding(encoding) ? (action === EncodingAction.CONVERT ? convert(tab, encoding) : reinterpret(tab, encoding)) : undefined;

        run?.catch(logError("cannot change encoding of " + tab.name));
    };

    const changeEol = (tab: EditorTab, eol: EolType) => {
        if (!isKnownEol(eol) || eol === tab.eol) return;

        tab.eol = eol;
        editorRef.current?.session.setNewLineMode(getEditorNewLineMode(eol));

        refreshChangedState(tab).catch(logError("cannot change line endings of " + tab.name));
    };

    useIpcEvents(activeTab ? {
        [EventType.SAVE_TAB]: () => save(activeTab),
        [EventType.SET_TAB_LANGUAGE]: (event: unknown, language: SupportedLanguage) => setLanguage(activeTab, language),
        [EventType.ENCODING_ACTION]: (event: unknown, data: {action: EncodingAction, encoding?: string}) => runEncodingAction(data?.action, data?.encoding),
        [EventType.EOL_ACTION]: (event: unknown, data: {eol: EolType}) => changeEol(activeTab, data?.eol),
        [EventType.OPEN_ENCODING_PICKER]: (event: unknown, data: {action: EncodingAction}) => setEncodingPicker(data?.action === EncodingAction.CONVERT ? EncodingAction.CONVERT : EncodingAction.REINTERPRET),
    } : {}, [activeTab]);

    return runEncodingAction;
}
