export enum SystemPaths {
    temp = "tempDir",
    home = "homeDir",
    data = "dataPath",
    resources = "resources"
}

export enum EventType {
    SAVE_TAB = "saveTab",
    NEW_TAB = "newTab",
    OPEN_TAB = "openTab",
    CLOSE_TAB = "closeTab",
    SET_TAB_LANGUAGE = "setTabLanguage",
    UNDO_TAB = "undoTab",
    REDO_TAB = "redoTab",
    BUILD_MENU = "buildMenu",
    SHOW_SAVE_DIALOG = "showSaveDialog",
    SHOW_UNSAVED_CHANGES_DIALOG = "showUnsavedChangesDialog",
    LOG_INFO = "log-info",
    LOG_ERROR = "log-error",
    LOG_WARN = "log-warning",
    FILES_DROPPED = "files-dropped",
    CLOSE_WINDOW = "close",
    CLOSE_WITH_STATE = "close-with-state",
    SAVE_STATE = "save-state",
    WRITE_FILE = "write-file",
    SHOW_TAB_CONTEXT_MENU = "show-tab-context-menu",
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
    CONFIRM_REINTERPRET = "confirm-reinterpret",
    CONFIRM_CONVERSION = "confirm-conversion",
    SHOW_STATUS_MENU = "show-status-menu",
    ENCODING_ACTION = "encoding-action",
    EOL_ACTION = "eol-action"
}

export enum EncodingAction {
    REINTERPRET = "reinterpret",
    CONVERT = "convert",
}

export enum UnencodableChoice {
    CONVERT_TO_UTF8 = "convert-to-utf8",
    SAVE_ANYWAY = "save-anyway",
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
