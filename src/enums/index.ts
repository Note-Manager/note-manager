export enum SystemPaths {
    temp = "tempDir",
    home = "homeDir",
    data = "dataPath",
    resources = "resources"
}

export enum EventType {
    SAVE_TAB = "saveTab",
    FORMAT_TAB = "formatTab",
    NEW_TAB = "newTab",
    OPEN_TAB = "openTab",
    CLOSE_TAB = "closeTab",
    SET_TAB_LANGUAGE = "setTabLanguage",
    UNDO_TAB = "undoTab",
    REDO_TAB = "redoTab",
    BUILD_MENU = "buildMenu",
    SHOW_SAVE_DIALOG = "showSaveDialog",
    SHOW_CONFIRMATION = "showConfirmation",
    LOG_INFO = "log-info",
    LOG_ERROR = "log-error",
    LOG_WARN = "log-warning"
}
