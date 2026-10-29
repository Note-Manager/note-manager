import {groupLanguagesByInitial, LanguageName, SupportedLanguage, SupportedLanguages} from "../domain/SupportedLanguage";
import {EventType} from "../enums";
import type {Sender} from "./WindowUtils";

type MenuItem = Electron.MenuItemConstructorOptions;

const LANGUAGE_GROUP_SIZE = 7;

export function createLanguageMenu(send: Sender): Array<MenuItem> {
    const plainText = SupportedLanguages[LanguageName.TEXT];
    const otherLanguages = Object.values(SupportedLanguages).filter(language => language !== plainText);

    return [
        createLanguageItem(send, plainText),
        {type: "separator"},
        ...groupLanguagesByInitial(otherLanguages, LANGUAGE_GROUP_SIZE).map(group => ({
            label: group.label,
            submenu: group.languages.map(language => createLanguageItem(send, language))
        }))
    ];
}

function createLanguageItem(send: Sender, language: SupportedLanguage): MenuItem {
    return {label: language.label, click: () => send(EventType.SET_TAB_LANGUAGE, language)};
}
