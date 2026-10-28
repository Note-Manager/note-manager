import {EditorCommand, EncodingAction, EventType, TabAction, UnsavedChangesChoice} from "../enums";
import {EditorTab} from "./EditorTab";
import {EditorState} from "./EditorState";
import {Settings} from "./Settings";
import {SupportedLanguage} from "./SupportedLanguage";
import {DecodedText, EolType} from "./Encoding";
import {ThemeInfo} from "./ThemeInfo";
import {UserPluginInfo} from "./PluginManifest";
import type {ThemeVariable} from "../utils/ThemeVariables";
import type {ShortcutDefinition} from "../utils/Shortcuts";
import type {ContextMenuGroup} from "../react/components/editor/plugins";

export interface KeyPress {
    code: string,
    ctrlKey: boolean,
    metaKey: boolean,
    altKey: boolean,
    shiftKey: boolean,
}

export interface TabMenuRequest {
    tabId: string,
    isPinned: boolean,
    hasOtherTabs: boolean,
    hasUnmodifiedTabs: boolean,
    hasClosableTabs: boolean,
    hasFile: boolean,
    canReopen: boolean,
}

export interface EditorMenuRequest {
    hasSelection: boolean,
    canUndo: boolean,
    canRedo: boolean,
    file?: string,
    canPreview: boolean,
    isPreviewOpen: boolean,
    groups: Array<ContextMenuGroup>,
    x?: number,
    y?: number,
}

export interface WriteFileRequest {
    file: string,
    content: string,
    encoding?: string,
    eol?: EolType,
}

export interface SaveSettingsRequest {
    settings: Settings,
    themeFile?: string,
    themeVariables?: {file: string, values: Record<string, string>},
}

export interface SettingsResponse {
    settings: Settings,
    themes: Array<ThemeInfo>,
    themeFile: string,
    shortcuts: Array<ShortcutDefinition>,
}

export interface RendererEvents {
    [EventType.NEW_TAB]: void,
    [EventType.OPEN_TAB]: EditorTab,
    [EventType.SAVE_TAB]: void,
    [EventType.CLOSE_TAB]: void,
    [EventType.SET_TAB_LANGUAGE]: SupportedLanguage,
    [EventType.TAB_ACTION]: {action: TabAction, tabId?: string},
    [EventType.EDITOR_COMMAND]: {command: EditorCommand},
    [EventType.INIT_WITH_STATE]: EditorState,
    [EventType.CLOSE_WINDOW]: void,
    [EventType.BUILD_MENU]: {icon: unknown},
    [EventType.SETTINGS_CHANGED]: Settings,
    [EventType.OPEN_SETTINGS]: void,
    [EventType.SHORTCUT_KEY]: KeyPress,
    [EventType.USER_PLUGINS_CHANGED]: void,
    [EventType.ENCODING_ACTION]: {action: EncodingAction, encoding?: string},
    [EventType.EOL_ACTION]: {eol: EolType},
    [EventType.OPEN_ENCODING_PICKER]: {action: EncodingAction},
}

export interface InvokeRequests {
    [EventType.FILES_DROPPED]: {files: Array<string>},
    [EventType.SHOW_SAVE_DIALOG]: {title?: string, defaultName?: string},
    [EventType.SHOW_UNSAVED_CHANGES_DIALOG]: {names: Array<string>},
    [EventType.SAVE_STATE]: EditorState,
    [EventType.CLOSE_WITH_STATE]: EditorState,
    [EventType.WRITE_FILE]: WriteFileRequest,
    [EventType.READ_FILE_AS]: {file: string, encoding?: string, fallbackEol?: EolType},
    [EventType.REVEAL_FILE]: {file: string},
    [EventType.SHOW_TAB_CONTEXT_MENU]: TabMenuRequest,
    [EventType.SHOW_EDITOR_CONTEXT_MENU]: EditorMenuRequest,
    [EventType.SHOW_STATUS_MENU]: {eol?: EolType, x?: number, y?: number},
    [EventType.GET_SETTINGS]: void,
    [EventType.SAVE_SETTINGS]: SaveSettingsRequest,
    [EventType.GET_THEME_VARIABLES]: {file: string},
    [EventType.CREATE_THEME]: {name: string, baseFile: string},
    [EventType.RECORD_SHORTCUT]: {active: boolean},
    [EventType.GET_USER_PLUGINS]: void,
    [EventType.CONFIRM_REINTERPRET]: {name?: string, encoding?: string},
    [EventType.CONFIRM_CONVERSION]: {content: string, encoding: string},
    [EventType.GET_ENCODING_INFO]: void,
    [EventType.LOG_INFO]: string,
    [EventType.LOG_WARN]: string,
    [EventType.LOG_ERROR]: string,
}

export interface InvokeResponses {
    [EventType.FILES_DROPPED]: void,
    [EventType.SHOW_SAVE_DIALOG]: string | undefined,
    [EventType.SHOW_UNSAVED_CHANGES_DIALOG]: UnsavedChangesChoice,
    [EventType.SAVE_STATE]: void,
    [EventType.CLOSE_WITH_STATE]: void,
    [EventType.WRITE_FILE]: {saved: boolean, encoding: string},
    [EventType.READ_FILE_AS]: DecodedText,
    [EventType.REVEAL_FILE]: boolean,
    [EventType.SHOW_TAB_CONTEXT_MENU]: void,
    [EventType.SHOW_EDITOR_CONTEXT_MENU]: void,
    [EventType.SHOW_STATUS_MENU]: void,
    [EventType.GET_SETTINGS]: SettingsResponse,
    [EventType.SAVE_SETTINGS]: Settings,
    [EventType.GET_THEME_VARIABLES]: Array<ThemeVariable>,
    [EventType.CREATE_THEME]: {file: string, themes: Array<ThemeInfo>},
    [EventType.RECORD_SHORTCUT]: void,
    [EventType.GET_USER_PLUGINS]: Array<UserPluginInfo>,
    [EventType.CONFIRM_REINTERPRET]: boolean,
    [EventType.CONFIRM_CONVERSION]: boolean,
    [EventType.GET_ENCODING_INFO]: {ansiCodePage: string},
    [EventType.LOG_INFO]: void,
    [EventType.LOG_WARN]: void,
    [EventType.LOG_ERROR]: void,
}

export type RendererChannel = keyof RendererEvents;
export type InvokeChannel = keyof InvokeRequests;

export type RendererEventHandlers = {[C in RendererChannel]?: (data: RendererEvents[C]) => void};

export type RendererPayload<C extends RendererChannel> = RendererEvents[C] extends void ? [] : [RendererEvents[C]];
export type InvokePayload<C extends InvokeChannel> = InvokeRequests[C] extends void ? [] : [InvokeRequests[C]];
