import {EditorTab} from "../domain/EditorTab";
import {findLanguageByFileName, LanguageName, SupportedLanguages} from "../domain/SupportedLanguage";
import {EolType} from "../domain/Encoding";
import {documentHash, getFileName, shortenTabName} from "./TextUtils";

export const DEFAULT_TAB_NAME = "New Document.txt";

export function createEmptyTab(name: string, encoding: string, eol: EolType): EditorTab {
    return {
        id: crypto.randomUUID(),
        name: name,
        displayName: shortenTabName(name),
        isTemp: true,
        content: "",
        encoding: encoding,
        eol: eol,
        language: SupportedLanguages[LanguageName.TEXT],
        state: {scroll: {left: 0, top: 0}},
    };
}

export function hashTab(tab: EditorTab) {
    return documentHash(tab.content || "", tab.encoding, tab.eol);
}

export async function refreshIsChanged(tab: EditorTab) {
    tab.isChanged = await hashTab(tab) !== tab.hash;
}

export function countTabsNamed(tabs: Array<EditorTab>, name: string) {
    return tabs.filter(tab => tab.name === name).length;
}

export function generateUniqueName(tabs: Array<EditorTab>, name: string) {
    let uniqueName = name;

    for (let count = 1; countTabsNamed(tabs, uniqueName) > 0; count++) {
        uniqueName = `${name} (${count})`;
    }

    return uniqueName;
}

export function renameTab(tab: EditorTab, name: string) {
    tab.name = name;
    tab.displayName = shortenTabName(name);
}

export function applySavedFile(tab: EditorTab, file: string): EditorTab {
    const name = getFileName(file);
    const detectedLanguage = findLanguageByFileName(name);

    renameTab(tab, name);
    tab.file = file;
    tab.isTemp = false;

    if (!tab.language || detectedLanguage !== SupportedLanguages[LanguageName.TEXT]) {
        tab.language = detectedLanguage;
    }

    return tab;
}

export function orderByPinned(tabs: Array<EditorTab>): Array<EditorTab> {
    return [...tabs.filter(t => t.isPinned), ...tabs.filter(t => !t.isPinned)];
}

export function moveTab(tabs: Array<EditorTab>, tabId: string, targetId: string, placeAfter: boolean): Array<EditorTab> {
    const tab = tabs.find(t => t.id === tabId);

    if (!tab || tabId === targetId || !tabs.some(t => t.id === targetId)) return tabs;

    const remaining = tabs.filter(t => t !== tab);
    const targetIndex = remaining.findIndex(t => t.id === targetId);

    remaining.splice(placeAfter ? targetIndex + 1 : targetIndex, 0, tab);

    return orderByPinned(remaining);
}
