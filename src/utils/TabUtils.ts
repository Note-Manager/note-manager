import {EditorTab} from "../domain/EditorTab";
import {findLanguageByFileName, LanguageName, SupportedLanguages} from "../domain/SupportedLanguage";
import {getFileName, shortenTabName} from "./TextUtils";

export function applySavedFile(tab: EditorTab, file: string): EditorTab {
    const name = getFileName(file);
    const detectedLanguage = findLanguageByFileName(name);

    tab.file = file;
    tab.name = name;
    tab.displayName = shortenTabName(name);
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
