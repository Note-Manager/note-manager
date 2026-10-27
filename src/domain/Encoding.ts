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

export const UNICODE_ENCODINGS: Array<{id: EncodingId, label: string, description: string}> = [
    {id: EncodingId.UTF8, label: "UTF-8", description: "Unicode, no signature"},
    {id: EncodingId.UTF8_BOM, label: "UTF-8 with BOM", description: "Unicode with a signature"},
    {id: EncodingId.UTF16_LE, label: "UTF-16 LE", description: "Unicode, little endian with BOM"},
    {id: EncodingId.UTF16_BE, label: "UTF-16 BE", description: "Unicode, big endian with BOM"},
    {id: EncodingId.ANSI, label: "ANSI", description: "System code page"},
];

export const CHARACTER_SET_GROUPS: Array<CharacterSetGroup> = [
    {label: "Turkish", sets: [{id: "windows-1254", label: "Windows-1254"}, {id: "iso-8859-9", label: "ISO-8859-9 (Latin-5)"}, {id: "iso-8859-3", label: "ISO-8859-3 (Latin-3)"}, {id: "cp857", label: "DOS 857"}]},
    {label: "Western", sets: [{id: "windows-1252", label: "Windows-1252"}, {id: "iso-8859-1", label: "ISO-8859-1 (Latin-1)"}, {id: "iso-8859-15", label: "ISO-8859-15 (Latin-9)"}, {id: "macintosh", label: "Mac Roman"}, {id: "cp437", label: "DOS 437 (US)"}, {id: "cp850", label: "DOS 850"}, {id: "cp858", label: "DOS 858"}, {id: "cp860", label: "DOS 860 (Portuguese)"}, {id: "cp863", label: "DOS 863 (French)"}]},
    {label: "Central European", sets: [{id: "windows-1250", label: "Windows-1250"}, {id: "iso-8859-2", label: "ISO-8859-2 (Latin-2)"}, {id: "cp852", label: "DOS 852"}]},
    {label: "Nordic and Baltic", sets: [{id: "windows-1257", label: "Windows-1257"}, {id: "iso-8859-4", label: "ISO-8859-4 (Latin-4)"}, {id: "iso-8859-13", label: "ISO-8859-13 (Latin-7)"}, {id: "iso-8859-14", label: "ISO-8859-14 (Celtic)"}, {id: "cp775", label: "DOS 775"}, {id: "cp861", label: "DOS 861 (Icelandic)"}, {id: "cp865", label: "DOS 865 (Nordic)"}]},
    {label: "Cyrillic", sets: [{id: "windows-1251", label: "Windows-1251"}, {id: "koi8-r", label: "KOI8-R"}, {id: "koi8-u", label: "KOI8-U"}, {id: "iso-8859-5", label: "ISO-8859-5"}, {id: "maccyrillic", label: "Mac Cyrillic"}, {id: "cp855", label: "DOS 855"}, {id: "cp866", label: "DOS 866"}]},
    {label: "Greek", sets: [{id: "windows-1253", label: "Windows-1253"}, {id: "iso-8859-7", label: "ISO-8859-7"}, {id: "cp737", label: "DOS 737"}, {id: "cp869", label: "DOS 869"}]},
    {label: "Arabic", sets: [{id: "windows-1256", label: "Windows-1256"}, {id: "iso-8859-6", label: "ISO-8859-6"}, {id: "cp720", label: "DOS 720"}]},
    {label: "Hebrew", sets: [{id: "windows-1255", label: "Windows-1255"}, {id: "iso-8859-8", label: "ISO-8859-8"}, {id: "cp862", label: "DOS 862"}]},
    {label: "East Asian", sets: [{id: "shift_jis", label: "Shift_JIS (Japanese)"}, {id: "euc-jp", label: "EUC-JP (Japanese)"}, {id: "gb18030", label: "GB18030 (Chinese)"}, {id: "gb2312", label: "GB2312 (Simplified Chinese)"}, {id: "big5", label: "Big5 (Traditional Chinese)"}, {id: "cp949", label: "CP949 (Korean)"}, {id: "euc-kr", label: "EUC-KR (Korean)"}]},
    {label: "Southeast Asian", sets: [{id: "tis620", label: "TIS-620 (Thai)"}, {id: "windows-1258", label: "Windows-1258 (Vietnamese)"}]},
];

export const EOL_TYPES: Array<{id: EolType, label: string, description: string}> = [
    {id: EolType.CRLF, label: "CRLF", description: "Windows"},
    {id: EolType.LF, label: "LF", description: "Linux and macOS"},
    {id: EolType.CR, label: "CR", description: "Classic Mac OS"},
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

export function getCharacterSet(encoding: string): (CharacterSet & {group: string}) | undefined {
    const group = CHARACTER_SET_GROUPS.find(g => g.sets.some(s => s.id === encoding));
    const set = group?.sets.find(s => s.id === encoding);

    return group && set ? {...set, group: group.label} : undefined;
}

export function getShortEncodingLabel(encoding?: string): string {
    return getEncodingLabel(encoding).replace(/\s*\(.*\)$/, "");
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
