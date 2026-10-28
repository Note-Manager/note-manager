import {bundledPlugins} from "./PluginLoader";
import {PluginManifest} from "../domain/PluginManifest";

export interface ShortcutDefinition {
    id: string,
    label: string,
    defaultAccelerator?: string,
}

export enum ShortcutId {
    NEW = "file.new",
    OPEN = "file.open",
    SAVE = "file.save",
    REOPEN_CLOSED = "file.reopenClosed",
    CLOSE = "file.close",
    FIND = "search.find",
    REPLACE = "search.replace",
    FIND_NEXT = "search.findNext",
    FIND_PREVIOUS = "search.findPrevious",
    SELECT_AND_FIND_NEXT = "search.selectAndFindNext",
    SELECT_AND_FIND_PREVIOUS = "search.selectAndFindPrevious",
    GO_TO = "search.goTo",
    GO_TO_MATCHING_BRACE = "search.goToMatchingBrace",
    SEARCH_ON_WEB = "search.searchOnWeb",
    FIND_ALL_IN_DOCUMENT = "search.findAllInDocument",
    FIND_ALL_IN_OPEN_DOCUMENTS = "search.findAllInOpenDocuments",
    NEXT_SEARCH_RESULT = "search.nextResult",
    PREVIOUS_SEARCH_RESULT = "search.previousResult",
    TOGGLE_SEARCH_RESULTS = "search.toggleResults",
    FIND_IN_FILES = "search.findInFiles",
    TOGGLE_BOOKMARK = "bookmark.toggle",
    NEXT_BOOKMARK = "bookmark.next",
    PREVIOUS_BOOKMARK = "bookmark.previous",
    CLEAR_BOOKMARKS = "bookmark.clear",
    INVERSE_BOOKMARKS = "bookmark.inverse",
    CUT_BOOKMARKED_LINES = "bookmark.cutLines",
    COPY_BOOKMARKED_LINES = "bookmark.copyLines",
    REMOVE_BOOKMARKED_LINES = "bookmark.removeLines",
    REMOVE_UNBOOKMARKED_LINES = "bookmark.removeOtherLines",
    MARK_ALL = "mark.all",
    BOOKMARK_MATCHING_LINES = "mark.bookmarkLines",
    CLEAR_MARKS = "mark.clear",
    STYLE_1 = "style.apply1",
    STYLE_2 = "style.apply2",
    STYLE_3 = "style.apply3",
    STYLE_4 = "style.apply4",
    STYLE_5 = "style.apply5",
    CLEAR_STYLE_1 = "style.clear1",
    CLEAR_STYLE_2 = "style.clear2",
    CLEAR_STYLE_3 = "style.clear3",
    CLEAR_STYLE_4 = "style.clear4",
    CLEAR_STYLE_5 = "style.clear5",
    CLEAR_ALL_STYLES = "style.clearAll",
    SETTINGS = "preferences.settings",
}

const IS_MAC = typeof process !== "undefined" && process.platform === "darwin";

const BUILT_IN_SHORTCUTS: Array<ShortcutDefinition> = [
    {id: ShortcutId.NEW, label: "File > New", defaultAccelerator: "CmdOrCtrl+N"},
    {id: ShortcutId.OPEN, label: "File > Open", defaultAccelerator: "CmdOrCtrl+T"},
    {id: ShortcutId.SAVE, label: "File > Save", defaultAccelerator: "CmdOrCtrl+S"},
    {id: ShortcutId.REOPEN_CLOSED, label: "File > Reopen Closed Tab", defaultAccelerator: "CmdOrCtrl+Shift+T"},
    {id: ShortcutId.CLOSE, label: "File > Close", defaultAccelerator: "CmdOrCtrl+W"},
    {id: ShortcutId.FIND, label: "Search > Find", defaultAccelerator: "CmdOrCtrl+F"},
    {id: ShortcutId.REPLACE, label: "Search > Replace", defaultAccelerator: IS_MAC ? "Cmd+Alt+F" : "Ctrl+H"},
    {id: ShortcutId.FIND_NEXT, label: "Search > Find Next", defaultAccelerator: "F3"},
    {id: ShortcutId.FIND_PREVIOUS, label: "Search > Find Previous", defaultAccelerator: "Shift+F3"},
    {id: ShortcutId.SELECT_AND_FIND_NEXT, label: "Search > Select and Find Next", defaultAccelerator: "CmdOrCtrl+F3"},
    {id: ShortcutId.SELECT_AND_FIND_PREVIOUS, label: "Search > Select and Find Previous", defaultAccelerator: "CmdOrCtrl+Shift+F3"},
    {id: ShortcutId.GO_TO, label: "Search > Go To", defaultAccelerator: "CmdOrCtrl+G"},
    {id: ShortcutId.GO_TO_MATCHING_BRACE, label: "Search > Go to Matching Brace", defaultAccelerator: "CmdOrCtrl+B"},
    {id: ShortcutId.SEARCH_ON_WEB, label: "Search > Search on the Web"},
    {id: ShortcutId.FIND_ALL_IN_DOCUMENT, label: "Search > Find All in Current Document"},
    {id: ShortcutId.FIND_ALL_IN_OPEN_DOCUMENTS, label: "Search > Find All in Open Documents"},
    {id: ShortcutId.NEXT_SEARCH_RESULT, label: "Search > Next Search Result", defaultAccelerator: "F4"},
    {id: ShortcutId.PREVIOUS_SEARCH_RESULT, label: "Search > Previous Search Result", defaultAccelerator: "Shift+F4"},
    {id: ShortcutId.TOGGLE_SEARCH_RESULTS, label: "Search > Search Results", defaultAccelerator: "F7"},
    {id: ShortcutId.FIND_IN_FILES, label: "Search > Find in Files", defaultAccelerator: IS_MAC ? "Cmd+Alt+Shift+F" : "Ctrl+Alt+F"},
    {id: ShortcutId.TOGGLE_BOOKMARK, label: "Search > Bookmark > Toggle Bookmark", defaultAccelerator: "CmdOrCtrl+F2"},
    {id: ShortcutId.NEXT_BOOKMARK, label: "Search > Bookmark > Next Bookmark", defaultAccelerator: "F2"},
    {id: ShortcutId.PREVIOUS_BOOKMARK, label: "Search > Bookmark > Previous Bookmark", defaultAccelerator: "Shift+F2"},
    {id: ShortcutId.CLEAR_BOOKMARKS, label: "Search > Bookmark > Clear All Bookmarks"},
    {id: ShortcutId.INVERSE_BOOKMARKS, label: "Search > Bookmark > Inverse Bookmarks"},
    {id: ShortcutId.CUT_BOOKMARKED_LINES, label: "Search > Bookmark > Cut Bookmarked Lines"},
    {id: ShortcutId.COPY_BOOKMARKED_LINES, label: "Search > Bookmark > Copy Bookmarked Lines"},
    {id: ShortcutId.REMOVE_BOOKMARKED_LINES, label: "Search > Bookmark > Remove Bookmarked Lines"},
    {id: ShortcutId.REMOVE_UNBOOKMARKED_LINES, label: "Search > Bookmark > Remove Unbookmarked Lines"},
    {id: ShortcutId.MARK_ALL, label: "Search > Mark All"},
    {id: ShortcutId.BOOKMARK_MATCHING_LINES, label: "Search > Bookmark Matching Lines"},
    {id: ShortcutId.CLEAR_MARKS, label: "Search > Clear Marks"},
    {id: ShortcutId.STYLE_1, label: "Search > Style Token > Style 1"},
    {id: ShortcutId.STYLE_2, label: "Search > Style Token > Style 2"},
    {id: ShortcutId.STYLE_3, label: "Search > Style Token > Style 3"},
    {id: ShortcutId.STYLE_4, label: "Search > Style Token > Style 4"},
    {id: ShortcutId.STYLE_5, label: "Search > Style Token > Style 5"},
    {id: ShortcutId.CLEAR_STYLE_1, label: "Search > Clear Style > Style 1"},
    {id: ShortcutId.CLEAR_STYLE_2, label: "Search > Clear Style > Style 2"},
    {id: ShortcutId.CLEAR_STYLE_3, label: "Search > Clear Style > Style 3"},
    {id: ShortcutId.CLEAR_STYLE_4, label: "Search > Clear Style > Style 4"},
    {id: ShortcutId.CLEAR_STYLE_5, label: "Search > Clear Style > Style 5"},
    {id: ShortcutId.CLEAR_ALL_STYLES, label: "Search > Clear Style > All Styles"},
    {id: ShortcutId.SETTINGS, label: "Preferences > Settings", defaultAccelerator: "CmdOrCtrl+,"},
];

export function getShortcutDefinitions(userPlugins: Array<PluginManifest> = []): Array<ShortcutDefinition> {
    const pluginShortcuts = bundledPlugins.flatMap(plugin => (plugin.applicationMenuItems || []).flatMap(item => item.actions.map(action => ({
        id: action.code,
        label: `Plugins > ${item.label} > ${action.label}`,
        defaultAccelerator: action.accelerator,
    }))));

    const userPluginShortcuts = userPlugins.flatMap(plugin => plugin.actions.map(action => ({
        id: action.code,
        label: `Plugins > ${plugin.name} > ${action.label}`,
        defaultAccelerator: action.accelerator,
    })));

    return [...BUILT_IN_SHORTCUTS, ...pluginShortcuts, ...userPluginShortcuts];
}

export function getDefaultAccelerator(id: string, userPlugins: Array<PluginManifest> = []): string | undefined {
    return getShortcutDefinitions(userPlugins).find(s => s.id === id)?.defaultAccelerator;
}
