import {EditorCommand} from "../enums";
import {ShortcutId} from "./Shortcuts";
import {getAccelerator} from "./Accelerators";

type MenuItem = Electron.MenuItemConstructorOptions;
type CommandRunner = (command: EditorCommand) => void;

const SEARCH_ITEMS: Partial<Record<EditorCommand, {label: string, shortcut: ShortcutId}>> = {
    [EditorCommand.FIND]: {label: "Find...", shortcut: ShortcutId.FIND},
    [EditorCommand.REPLACE]: {label: "Replace...", shortcut: ShortcutId.REPLACE},
    [EditorCommand.FIND_IN_FILES]: {label: "Find in Files...", shortcut: ShortcutId.FIND_IN_FILES},
    [EditorCommand.FIND_NEXT]: {label: "Find Next", shortcut: ShortcutId.FIND_NEXT},
    [EditorCommand.FIND_PREVIOUS]: {label: "Find Previous", shortcut: ShortcutId.FIND_PREVIOUS},
    [EditorCommand.SELECT_AND_FIND_NEXT]: {label: "Select and Find Next", shortcut: ShortcutId.SELECT_AND_FIND_NEXT},
    [EditorCommand.SELECT_AND_FIND_PREVIOUS]: {label: "Select and Find Previous", shortcut: ShortcutId.SELECT_AND_FIND_PREVIOUS},
    [EditorCommand.GO_TO]: {label: "Go To...", shortcut: ShortcutId.GO_TO},
    [EditorCommand.GO_TO_MATCHING_BRACE]: {label: "Go to Matching Brace", shortcut: ShortcutId.GO_TO_MATCHING_BRACE},
    [EditorCommand.SEARCH_ON_WEB]: {label: "Search on the Web", shortcut: ShortcutId.SEARCH_ON_WEB},
    [EditorCommand.FIND_ALL_IN_DOCUMENT]: {label: "Find All in Current Document", shortcut: ShortcutId.FIND_ALL_IN_DOCUMENT},
    [EditorCommand.FIND_ALL_IN_OPEN_DOCUMENTS]: {label: "Find All in Open Documents", shortcut: ShortcutId.FIND_ALL_IN_OPEN_DOCUMENTS},
    [EditorCommand.NEXT_SEARCH_RESULT]: {label: "Next Search Result", shortcut: ShortcutId.NEXT_SEARCH_RESULT},
    [EditorCommand.PREVIOUS_SEARCH_RESULT]: {label: "Previous Search Result", shortcut: ShortcutId.PREVIOUS_SEARCH_RESULT},
    [EditorCommand.TOGGLE_SEARCH_RESULTS]: {label: "Search Results", shortcut: ShortcutId.TOGGLE_SEARCH_RESULTS},
    [EditorCommand.MARK_ALL]: {label: "Mark All", shortcut: ShortcutId.MARK_ALL},
    [EditorCommand.BOOKMARK_MATCHING_LINES]: {label: "Mark All and Bookmark Lines", shortcut: ShortcutId.BOOKMARK_MATCHING_LINES},
    [EditorCommand.CLEAR_MARKS]: {label: "Clear Marks", shortcut: ShortcutId.CLEAR_MARKS},
    [EditorCommand.TOGGLE_BOOKMARK]: {label: "Toggle Bookmark", shortcut: ShortcutId.TOGGLE_BOOKMARK},
    [EditorCommand.NEXT_BOOKMARK]: {label: "Next Bookmark", shortcut: ShortcutId.NEXT_BOOKMARK},
    [EditorCommand.PREVIOUS_BOOKMARK]: {label: "Previous Bookmark", shortcut: ShortcutId.PREVIOUS_BOOKMARK},
    [EditorCommand.CLEAR_BOOKMARKS]: {label: "Clear All Bookmarks", shortcut: ShortcutId.CLEAR_BOOKMARKS},
    [EditorCommand.INVERSE_BOOKMARKS]: {label: "Inverse Bookmarks", shortcut: ShortcutId.INVERSE_BOOKMARKS},
    [EditorCommand.CUT_BOOKMARKED_LINES]: {label: "Cut Bookmarked Lines", shortcut: ShortcutId.CUT_BOOKMARKED_LINES},
    [EditorCommand.COPY_BOOKMARKED_LINES]: {label: "Copy Bookmarked Lines", shortcut: ShortcutId.COPY_BOOKMARKED_LINES},
    [EditorCommand.REMOVE_BOOKMARKED_LINES]: {label: "Remove Bookmarked Lines", shortcut: ShortcutId.REMOVE_BOOKMARKED_LINES},
    [EditorCommand.REMOVE_UNBOOKMARKED_LINES]: {label: "Remove Unbookmarked Lines", shortcut: ShortcutId.REMOVE_UNBOOKMARKED_LINES},
    [EditorCommand.STYLE_1]: {label: "Style 1", shortcut: ShortcutId.STYLE_1},
    [EditorCommand.STYLE_2]: {label: "Style 2", shortcut: ShortcutId.STYLE_2},
    [EditorCommand.STYLE_3]: {label: "Style 3", shortcut: ShortcutId.STYLE_3},
    [EditorCommand.STYLE_4]: {label: "Style 4", shortcut: ShortcutId.STYLE_4},
    [EditorCommand.STYLE_5]: {label: "Style 5", shortcut: ShortcutId.STYLE_5},
    [EditorCommand.CLEAR_STYLE_1]: {label: "Style 1", shortcut: ShortcutId.CLEAR_STYLE_1},
    [EditorCommand.CLEAR_STYLE_2]: {label: "Style 2", shortcut: ShortcutId.CLEAR_STYLE_2},
    [EditorCommand.CLEAR_STYLE_3]: {label: "Style 3", shortcut: ShortcutId.CLEAR_STYLE_3},
    [EditorCommand.CLEAR_STYLE_4]: {label: "Style 4", shortcut: ShortcutId.CLEAR_STYLE_4},
    [EditorCommand.CLEAR_STYLE_5]: {label: "Style 5", shortcut: ShortcutId.CLEAR_STYLE_5},
    [EditorCommand.CLEAR_ALL_STYLES]: {label: "All Styles", shortcut: ShortcutId.CLEAR_ALL_STYLES},
};

type MenuGroups = Array<Array<SearchMenuEntry>>;
type SearchMenuEntry = EditorCommand | {label: string, groups: MenuGroups};

export const BOOKMARK_MENU: SearchMenuEntry = {
    label: "Bookmark",
    groups: [
        [EditorCommand.TOGGLE_BOOKMARK, EditorCommand.NEXT_BOOKMARK, EditorCommand.PREVIOUS_BOOKMARK],
        [EditorCommand.CLEAR_BOOKMARKS, EditorCommand.INVERSE_BOOKMARKS],
        [EditorCommand.CUT_BOOKMARKED_LINES, EditorCommand.COPY_BOOKMARKED_LINES, EditorCommand.REMOVE_BOOKMARKED_LINES, EditorCommand.REMOVE_UNBOOKMARKED_LINES],
    ],
};

export const STYLE_MENU: SearchMenuEntry = {
    label: "Style Token",
    groups: [[EditorCommand.STYLE_1, EditorCommand.STYLE_2, EditorCommand.STYLE_3, EditorCommand.STYLE_4, EditorCommand.STYLE_5]],
};

export const CLEAR_STYLE_MENU: SearchMenuEntry = {
    label: "Clear Style",
    groups: [
        [EditorCommand.CLEAR_STYLE_1, EditorCommand.CLEAR_STYLE_2, EditorCommand.CLEAR_STYLE_3, EditorCommand.CLEAR_STYLE_4, EditorCommand.CLEAR_STYLE_5],
        [EditorCommand.CLEAR_ALL_STYLES],
    ],
};

const SEARCH_MENU_GROUPS: MenuGroups = [
    [EditorCommand.FIND, EditorCommand.REPLACE, EditorCommand.FIND_IN_FILES],
    [EditorCommand.FIND_NEXT, EditorCommand.FIND_PREVIOUS, EditorCommand.SELECT_AND_FIND_NEXT, EditorCommand.SELECT_AND_FIND_PREVIOUS],
    [EditorCommand.FIND_ALL_IN_DOCUMENT, EditorCommand.FIND_ALL_IN_OPEN_DOCUMENTS],
    [EditorCommand.NEXT_SEARCH_RESULT, EditorCommand.PREVIOUS_SEARCH_RESULT, EditorCommand.TOGGLE_SEARCH_RESULTS],
    [EditorCommand.MARK_ALL, EditorCommand.BOOKMARK_MATCHING_LINES, EditorCommand.CLEAR_MARKS, STYLE_MENU, CLEAR_STYLE_MENU],
    [BOOKMARK_MENU],
    [EditorCommand.GO_TO, EditorCommand.GO_TO_MATCHING_BRACE],
    [EditorCommand.SEARCH_ON_WEB],
];

export function createSearchMenuItem(entry: SearchMenuEntry, run: CommandRunner, enabled = true): MenuItem {
    if (typeof entry === "object") return {label: entry.label, enabled: enabled, submenu: createMenuGroups(entry.groups, run)};

    const item = SEARCH_ITEMS[entry];

    return {label: item?.label, accelerator: item && getAccelerator(item.shortcut), enabled: enabled, click: () => run(entry)};
}

export function createSearchMenu(run: CommandRunner): Array<MenuItem> {
    return createMenuGroups(SEARCH_MENU_GROUPS, run);
}

function createMenuGroups(groups: MenuGroups, run: CommandRunner): Array<MenuItem> {
    return groups.flatMap((group, index) => [
        ...(index > 0 ? [{type: "separator"} as MenuItem] : []),
        ...group.map(entry => createSearchMenuItem(entry, run)),
    ]);
}
