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
};

const SEARCH_MENU_GROUPS = [
    [EditorCommand.FIND, EditorCommand.REPLACE, EditorCommand.FIND_IN_FILES],
    [EditorCommand.FIND_NEXT, EditorCommand.FIND_PREVIOUS, EditorCommand.SELECT_AND_FIND_NEXT, EditorCommand.SELECT_AND_FIND_PREVIOUS],
    [EditorCommand.FIND_ALL_IN_DOCUMENT, EditorCommand.FIND_ALL_IN_OPEN_DOCUMENTS],
    [EditorCommand.NEXT_SEARCH_RESULT, EditorCommand.PREVIOUS_SEARCH_RESULT, EditorCommand.TOGGLE_SEARCH_RESULTS],
    [EditorCommand.GO_TO, EditorCommand.GO_TO_MATCHING_BRACE],
    [EditorCommand.SEARCH_ON_WEB],
];

export function createSearchMenuItem(command: EditorCommand, run: CommandRunner, enabled = true): MenuItem {
    const item = SEARCH_ITEMS[command];

    return {label: item?.label, accelerator: item && getAccelerator(item.shortcut), enabled: enabled, click: () => run(command)};
}

export function createSearchMenu(run: CommandRunner): Array<MenuItem> {
    return SEARCH_MENU_GROUPS.flatMap((group, index) => [
        ...(index > 0 ? [{type: "separator"} as MenuItem] : []),
        ...group.map(command => createSearchMenuItem(command, run)),
    ]);
}
