import {SupportedLanguage} from "./SupportedLanguage";

export interface EditorTab {
    id?:string,
    isTemp?:boolean,
    file?:string,
    language?:SupportedLanguage,
    name?:string,
    displayName?:string,
    content?:string,
    hash?:string,
    isChanged?:boolean,
    state?: {
        scroll?: {
            top: number,
            left: number
        },
        selection?: any
    }
}