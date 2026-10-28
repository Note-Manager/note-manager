import {SupportedLanguage} from "./SupportedLanguage";
import {EolType} from "./Encoding";
import {MarkRule} from "./Marks";

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
    isPinned?:boolean,
    encoding?:string,
    eol?:EolType,
    state?: {
        scroll?: {
            top: number,
            left: number
        },
        selection?: any,
        undoHistory?: any,
        bookmarks?: Array<number>,
        marks?: Array<MarkRule>,
    }
}