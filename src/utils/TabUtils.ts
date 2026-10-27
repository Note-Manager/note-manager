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
