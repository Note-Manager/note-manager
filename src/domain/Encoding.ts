export enum EncodingId {
    ANSI = "ansi",
    UTF8 = "utf-8",
    UTF8_BOM = "utf-8-bom",
    UTF16_BE = "utf-16be",
    UTF16_LE = "utf-16le",
}

export enum EolType {
    CRLF = "CRLF",
    LF = "LF",
    CR = "CR",
}

export interface CharacterSet {
    id: string,
    label: string,
}

export interface CharacterSetGroup {
    label: string,
    sets: Array<CharacterSet>,
}

export const UNICODE_ENCODINGS: Array<{id: EncodingId, label: string}> = [
    {id: EncodingId.ANSI, label: "ANSI"},
    {id: EncodingId.UTF8, label: "UTF-8"},
    {id: EncodingId.UTF8_BOM, label: "UTF-8-BOM"},
    {id: EncodingId.UTF16_BE, label: "UTF-16 BE BOM"},
    {id: EncodingId.UTF16_LE, label: "UTF-16 LE BOM"},
];

export const CHARACTER_SET_GROUPS: Array<CharacterSetGroup> = [
    {label: "Arabic", sets: [{id: "iso-8859-6", label: "ISO 8859-6"}, {id: "cp720", label: "OEM 720"}, {id: "windows-1256", label: "Windows-1256"}]},
    {label: "Baltic", sets: [{id: "iso-8859-4", label: "ISO 8859-4"}, {id: "iso-8859-13", label: "ISO 8859-13"}, {id: "cp775", label: "OEM 775"}, {id: "windows-1257", label: "Windows-1257"}]},
    {label: "Celtic", sets: [{id: "iso-8859-14", label: "ISO 8859-14"}]},
    {label: "Cyrillic", sets: [{id: "iso-8859-5", label: "ISO 8859-5"}, {id: "koi8-r", label: "KOI8-R"}, {id: "koi8-u", label: "KOI8-U"}, {id: "maccyrillic", label: "Macintosh"}, {id: "cp855", label: "OEM 855"}, {id: "cp866", label: "OEM 866"}, {id: "windows-1251", label: "Windows-1251"}]},
    {label: "Central European", sets: [{id: "cp852", label: "OEM 852"}, {id: "windows-1250", label: "Windows-1250"}]},
    {label: "Chinese", sets: [{id: "big5", label: "Big5 (Traditional)"}, {id: "gb2312", label: "GB2312 (Simplified)"}, {id: "gb18030", label: "GB18030"}]},
    {label: "Eastern European", sets: [{id: "iso-8859-2", label: "ISO 8859-2"}]},
    {label: "Greek", sets: [{id: "iso-8859-7", label: "ISO 8859-7"}, {id: "cp737", label: "OEM 737"}, {id: "cp869", label: "OEM 869"}, {id: "windows-1253", label: "Windows-1253"}]},
    {label: "Hebrew", sets: [{id: "iso-8859-8", label: "ISO 8859-8"}, {id: "cp862", label: "OEM 862"}, {id: "windows-1255", label: "Windows-1255"}]},
    {label: "Japanese", sets: [{id: "shift_jis", label: "Shift-JIS"}, {id: "euc-jp", label: "EUC-JP"}]},
    {label: "Korean", sets: [{id: "cp949", label: "Windows 949"}, {id: "euc-kr", label: "EUC-KR"}]},
    {label: "North European", sets: [{id: "cp861", label: "OEM 861 : Icelandic"}, {id: "cp865", label: "OEM 865 : Nordic"}]},
    {label: "Thai", sets: [{id: "tis620", label: "TIS-620"}]},
    {label: "Turkish", sets: [{id: "iso-8859-3", label: "ISO 8859-3"}, {id: "iso-8859-9", label: "ISO 8859-9"}, {id: "cp857", label: "OEM 857"}, {id: "windows-1254", label: "Windows-1254"}]},
    {label: "Western European", sets: [{id: "iso-8859-1", label: "ISO 8859-1"}, {id: "iso-8859-15", label: "ISO 8859-15"}, {id: "cp850", label: "OEM 850"}, {id: "cp858", label: "OEM 858"}, {id: "cp860", label: "OEM 860 : Portuguese"}, {id: "cp863", label: "OEM 863 : French"}, {id: "cp437", label: "OEM-US"}, {id: "windows-1252", label: "Windows-1252"}]},
    {label: "Vietnamese", sets: [{id: "windows-1258", label: "Windows-1258"}]},
];

export const EOL_TYPES: Array<{id: EolType, label: string}> = [
    {id: EolType.CRLF, label: "Windows (CR LF)"},
    {id: EolType.LF, label: "Unix (LF)"},
    {id: EolType.CR, label: "Macintosh (CR)"},
];

export const DEFAULT_ENCODING = EncodingId.UTF8;

const CHARACTER_SETS = new Map(CHARACTER_SET_GROUPS.flatMap(g => g.sets).map(s => [s.id, s]));

export function isUnicodeEncoding(encoding: string): boolean {
    return encoding === EncodingId.UTF8 || encoding === EncodingId.UTF8_BOM || encoding === EncodingId.UTF16_BE || encoding === EncodingId.UTF16_LE;
}

export function isKnownEncoding(encoding: any): encoding is string {
    return typeof encoding === "string" && (UNICODE_ENCODINGS.some(e => e.id === encoding) || CHARACTER_SETS.has(encoding));
}

export function isKnownEol(eol: any): eol is EolType {
    return Object.values(EolType).includes(eol);
}

export function getEncodingLabel(encoding?: string): string {
    if (!encoding) return getEncodingLabel(DEFAULT_ENCODING);

    return UNICODE_ENCODINGS.find(e => e.id === encoding)?.label || CHARACTER_SETS.get(encoding)?.label || encoding;
}

export function getEolLabel(eol?: EolType): string {
    return EOL_TYPES.find(e => e.id === eol)?.label || getEolLabel(EolType.LF);
}

export function getEolCharacters(eol?: EolType): string {
    switch (eol) {
        case EolType.CRLF:
            return "\r\n";
        case EolType.CR:
            return "\r";
        default:
            return "\n";
    }
}

export function getEditorNewLineMode(eol?: EolType): "windows" | "unix" {
    return eol === EolType.CRLF ? "windows" : "unix";
}

export function detectEol(text: string, fallback: EolType): EolType {
    const match = text.match(/\r\n|\r|\n/);

    if (!match) return fallback;

    if (match[0] === "\r\n") return EolType.CRLF;

    return match[0] === "\r" ? EolType.CR : EolType.LF;
}

export function toEditorText(text: string, eol: EolType): string {
    return text.replace(/\r\n|\r|\n/g, eol === EolType.CRLF ? "\r\n" : "\n");
}

export function toFileText(text: string, eol: EolType): string {
    return text.replace(/\r\n|\r|\n/g, getEolCharacters(eol));
}

export function getSystemDefaultEol(): EolType {
    const platform = typeof process !== "undefined" && process?.platform
        ? process.platform
        : (typeof navigator !== "undefined" && /Windows/i.test(navigator.userAgent) ? "win32" : "");

    return platform === "win32" ? EolType.CRLF : EolType.LF;
}
