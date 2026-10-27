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
    REVEAL_FILE = "reveal-file"
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
