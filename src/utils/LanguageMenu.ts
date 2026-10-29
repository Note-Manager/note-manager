import {groupLanguagesByInitial, LanguageGroup, LanguageName, SupportedLanguage, SupportedLanguages} from "../domain/SupportedLanguage";
import {EventType} from "../enums";
import type {Sender} from "./WindowUtils";

type MenuItem = Electron.MenuItemConstructorOptions;

export function createLanguageMenu(send: Sender): Array<MenuItem> {
    const plainText = SupportedLanguages[LanguageName.TEXT];
    const otherLanguages = Object.values(SupportedLanguages).filter(language => language !== plainText);

    return [
        createLanguageItem(send, plainText),
        {type: "separator"},
        ...groupLanguagesByInitial(otherLanguages).map(group => createGroupItem(send, group))
    ];
}

function createGroupItem(send: Sender, group: LanguageGroup): MenuItem {
    if (group.languages.length === 1) return createLanguageItem(send, group.languages[0]);

    return {label: group.initial, submenu: group.languages.map(language => createLanguageItem(send, language))};
}

function createLanguageItem(send: Sender, language: SupportedLanguage): MenuItem {
    return {label: language.label, click: () => send(EventType.SET_TAB_LANGUAGE, language)};
}
