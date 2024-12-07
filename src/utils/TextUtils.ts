import {LanguageName, SupportedLanguage, SupportedLanguages} from "../domain/SupportedLanguage";

export async function format(content:string, language:SupportedLanguage, options?:{rangeStart:number, rangeEnd:number}):Promise<string> {
    if(!language || language === SupportedLanguages.text) return content;

    const { rangeStart = 0, rangeEnd = content.length } = {...options};

    const prefix = content.substring(0, rangeStart);
    const rangeToFormat = content.substring(rangeStart, rangeEnd);
    const suffix = content.substring(rangeEnd);

    if (LanguageName.JAVASCRIPT === language.name) {
    }
    else if (LanguageName.CSS === language.name) {
    }
    else if (LanguageName.JSON === language.name) {
    }
    else if (LanguageName.YAML === language.name) {
    }
    else if (LanguageName.MARKDOWN === language.name) {
    }
    else if([LanguageName.HTML as string, LanguageName.XML as string].includes(language.name)) {
    }

    else return prefix + rangeToFormat + suffix;

    return content;
}

export async function hash(content:string) {
    const encoder = new TextEncoder();

    const data = encoder.encode(content);

    const hashBuffer = await crypto.subtle.digest("SHA-256", data);

    return Array.from(new Uint8Array(hashBuffer))
        .map(b => b.toString(16).padStart(2, "0"))
        .join("");
}