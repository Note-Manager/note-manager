export enum SystemPaths {
    data = "dataPath",
    resources = "resources"
}

export enum EventType {
    SAVE_TAB = "save-tab",
    NEW_TAB = "new-tab",
    OPEN_TAB = "open-tab",
    CLOSE_TAB = "close-tab",
    SET_TAB_LANGUAGE = "set-tab-language",
    BUILD_MENU = "build-menu",
    SHOW_SAVE_DIALOG = "show-save-dialog",
    SHOW_MESSAGE_DIALOG = "show-message-dialog",
    MESSAGE_DIALOG_RESPONSE = "message-dialog-response",
    SHOW_NOTICE = "show-notice",
    LOG_INFO = "log-info",
    LOG_ERROR = "log-error",
    LOG_WARN = "log-warning",
    FILES_DROPPED = "files-dropped",
    CLOSE_WINDOW = "close-window",
    CLOSE_WITH_STATE = "close-with-state",
    SAVE_STATE = "save-state",
    WRITE_FILE = "write-file",
    SHOW_TAB_CONTEXT_MENU = "show-tab-context-menu",
    SHOW_EDITOR_CONTEXT_MENU = "show-editor-context-menu",
    EDITOR_COMMAND = "editor-command",
    TAB_ACTION = "tab-action",
    INIT_WITH_STATE = "initialize-with-state",
    REVEAL_FILE = "reveal-file",
    GET_SETTINGS = "get-settings",
    SAVE_SETTINGS = "save-settings",
    SETTINGS_CHANGED = "settings-changed",
    OPEN_SETTINGS = "open-settings",
    GET_THEME_VARIABLES = "get-theme-variables",
    CREATE_THEME = "create-theme",
    RECORD_SHORTCUT = "record-shortcut",
    SHORTCUT_KEY = "shortcut-key",
    GET_USER_PLUGINS = "get-user-plugins",
    USER_PLUGINS_CHANGED = "user-plugins-changed",
    READ_FILE_AS = "read-file-as",
    CONFIRM_CONVERSION = "confirm-conversion",
    SHOW_STATUS_MENU = "show-status-menu",
    ENCODING_ACTION = "encoding-action",
    EOL_ACTION = "eol-action",
    OPEN_ENCODING_PICKER = "open-encoding-picker",
    GET_ENCODING_INFO = "get-encoding-info",
    SEARCH_ON_WEB = "search-on-web"
}

export enum EncodingAction {
    REINTERPRET = "reinterpret",
    CONVERT = "convert",
    REDETECT = "redetect",
}

export enum UnencodableChoice {
    CONVERT_TO_UTF8 = "convert-to-utf8",
    SAVE_ANYWAY = "save-anyway",
    CANCEL = "cancel",
}

export enum MessageKind {
    INFO = "info",
    QUESTION = "question",
    SUCCESS = "success",
    WARNING = "warning",
    ERROR = "error",
}

export enum DialogRole {
    PRIMARY = "primary",
    SECONDARY = "secondary",
    DESTRUCTIVE = "destructive",
    CANCEL = "cancel",
}

export enum UnsavedChangesChoice {
    SAVE = "save",
    DISCARD = "discard",
    CANCEL = "cancel",
}

export enum TabAction {
    CLOSE = "close",
    CLOSE_OTHERS = "close-others",
    CLOSE_UNMODIFIED = "close-unmodified",
    CLOSE_ALL = "close-all",
    TOGGLE_PIN = "toggle-pin",
    REOPEN_CLOSED = "reopen-closed",
    REVEAL_IN_FOLDER = "reveal-in-folder",
}

export enum EditorCommand {
    UNDO = "undo",
    REDO = "redo",
    DELETE = "delete",
    SELECT_ALL = "select-all",
    FIND = "find",
    REPLACE = "replace",
    FIND_NEXT = "find-next",
    FIND_PREVIOUS = "find-previous",
    SELECT_AND_FIND_NEXT = "select-and-find-next",
    SELECT_AND_FIND_PREVIOUS = "select-and-find-previous",
    GO_TO = "go-to",
    GO_TO_MATCHING_BRACE = "go-to-matching-brace",
    SEARCH_ON_WEB = "search-on-web",
    FIND_ALL_IN_DOCUMENT = "find-all-in-document",
    FIND_ALL_IN_OPEN_DOCUMENTS = "find-all-in-open-documents",
    NEXT_SEARCH_RESULT = "next-search-result",
    PREVIOUS_SEARCH_RESULT = "previous-search-result",
    TOGGLE_SEARCH_RESULTS = "toggle-search-results",
    TOGGLE_PREVIEW = "toggle-preview",
}
