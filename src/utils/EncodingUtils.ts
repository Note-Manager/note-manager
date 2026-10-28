import iconv from "iconv-lite";
import * as chardet from "chardet";
import {execFileSync} from "node:child_process";
import {DecodedText, detectEol, EncodingId, EolType, isKnownEncoding, isUnicodeEncoding, toEditorText, toFileText} from "../domain/Encoding";

export interface DetectionOptions {
    asciiAsUtf8: boolean,
    autodetect: boolean,
}

const DETECTION_SAMPLE_SIZE = 64 * 1024;
const SINGLE_BYTE_CONFIDENCE = 25;
const MULTI_BYTE_CONFIDENCE = 50;

const LOCALE_CODE_PAGES: Record<string, string> = {
    tr: "windows-1254", az: "windows-1254",
    ru: "windows-1251", uk: "windows-1251", be: "windows-1251", bg: "windows-1251", sr: "windows-1251", mk: "windows-1251", kk: "windows-1251",
    pl: "windows-1250", cs: "windows-1250", sk: "windows-1250", hu: "windows-1250", sl: "windows-1250", hr: "windows-1250", ro: "windows-1250", bs: "windows-1250",
    el: "windows-1253", he: "windows-1255", ar: "windows-1256", fa: "windows-1256", ur: "windows-1256",
    lt: "windows-1257", lv: "windows-1257", et: "windows-1257", vi: "windows-1258", th: "cp874",
    ja: "shift_jis", ko: "cp949", zh: "gb2312",
};

const SCRIPTS: Record<string, string> = {
    "iso-8859-1": "latin", "iso-8859-2": "latin", "iso-8859-9": "latin", "iso-8859-15": "latin",
    "windows-1250": "latin", "windows-1252": "latin", "windows-1254": "latin", "windows-1257": "latin", "windows-1258": "latin",
    "windows-1251": "cyrillic", "iso-8859-5": "cyrillic", "koi8-r": "cyrillic",
    "windows-1253": "greek", "iso-8859-7": "greek",
    "windows-1255": "hebrew", "iso-8859-8": "hebrew",
    "windows-1256": "arabic", "iso-8859-6": "arabic",
    "shift_jis": "japanese", "euc-jp": "japanese",
    "cp949": "korean", "euc-kr": "korean",
    "gb2312": "chinese", "gb18030": "chinese", "big5": "chinese",
};

const MULTI_BYTE = new Set(["shift_jis", "euc-jp", "euc-kr", "big5", "gb18030"]);

let ansiCodePage: string | undefined;

export function getAnsiCodePage(): string {
    if (!ansiCodePage) ansiCodePage = readWindowsCodePage() || codePageFromLocale(Intl.DateTimeFormat().resolvedOptions().locale);

    return ansiCodePage;
}

export function setAnsiCodePage(codePage: string | undefined) {
    ansiCodePage = codePage;
}

function readWindowsCodePage(): string | undefined {
    if (process.platform !== "win32") return undefined;

    try {
        const output = execFileSync("reg", ["query", "HKLM\\SYSTEM\\CurrentControlSet\\Control\\Nls\\CodePage", "/v", "ACP"], {encoding: "utf8", timeout: 3000, windowsHide: true});
        const match = output.match(/ACP\s+REG_SZ\s+(\d+)/);

        if (!match) return undefined;

        const codePage = match[1] === "932" ? "shift_jis" : match[1] === "936" ? "gb2312" : match[1] === "950" ? "big5" : match[1] === "949" ? "cp949" : (Number(match[1]) >= 1250 && Number(match[1]) <= 1258 ? "windows-" + match[1] : "cp" + match[1]);

        return iconv.encodingExists(codePage) ? codePage : undefined;
    } catch (err) {
        console.warn("cannot read ANSI code page: " + err);
        return undefined;
    }
}

export function codePageFromLocale(locale: string | undefined): string {
    const language = (locale || "").toLowerCase().split(/[-_]/)[0];

    if (language === "zh" && /(tw|hk|mo|hant)/i.test(locale || "")) return "big5";

    return LOCALE_CODE_PAGES[language] || "windows-1252";
}

export function resolveCodec(encoding: string): string {
    switch (encoding) {
        case EncodingId.ANSI:
            return getAnsiCodePage();
        case EncodingId.UTF8:
        case EncodingId.UTF8_BOM:
            return "utf8";
        default:
            return encoding;
    }
}

export function hasBom(encoding: string): boolean {
    return encoding === EncodingId.UTF8_BOM || encoding === EncodingId.UTF16_LE || encoding === EncodingId.UTF16_BE;
}

export function detectBom(buffer: Uint8Array): string | undefined {
    if (buffer.length >= 3 && buffer[0] === 0xEF && buffer[1] === 0xBB && buffer[2] === 0xBF) return EncodingId.UTF8_BOM;
    if (buffer.length >= 2 && buffer[0] === 0xFF && buffer[1] === 0xFE) return EncodingId.UTF16_LE;
    if (buffer.length >= 2 && buffer[0] === 0xFE && buffer[1] === 0xFF) return EncodingId.UTF16_BE;

    return undefined;
}

function isAscii(buffer: Uint8Array): boolean {
    for (let i = 0; i < buffer.length; i++) {
        if (buffer[i] > 0x7F) return false;
    }

    return true;
}

function isValidUtf8(buffer: Uint8Array): boolean {
    try {
        new TextDecoder("utf-8", {fatal: true}).decode(buffer);
        return true;
    } catch (ignored) {
        return false;
    }
}

function guessCharacterSet(buffer: Uint8Array): string | undefined {
    const ansiScript = SCRIPTS[getAnsiCodePage()];

    for (const match of chardet.analyse(buffer.subarray(0, DETECTION_SAMPLE_SIZE))) {
        const id = match.name.toLowerCase();

        if (!isKnownEncoding(id) || isUnicodeEncoding(id)) continue;

        const threshold = MULTI_BYTE.has(id) ? MULTI_BYTE_CONFIDENCE : SINGLE_BYTE_CONFIDENCE;

        if (match.confidence < threshold) return undefined;

        if (SCRIPTS[id] && SCRIPTS[id] === ansiScript) return EncodingId.ANSI;

        return id;
    }

    return undefined;
}

export function detectEncoding(buffer: Uint8Array, options: DetectionOptions): string {
    const bom = detectBom(buffer);

    if (bom) return bom;

    if (isAscii(buffer)) return options.asciiAsUtf8 ? EncodingId.UTF8 : EncodingId.ANSI;

    if (isValidUtf8(buffer)) return EncodingId.UTF8;

    if (options.autodetect) return guessCharacterSet(buffer) || EncodingId.ANSI;

    return EncodingId.ANSI;
}

export function decodeBuffer(buffer: Uint8Array, encoding: string): string {
    const bom = detectBom(buffer);

    if (bom === EncodingId.UTF8_BOM && resolveCodec(encoding) === "utf8") return iconv.decode(Buffer.from(buffer.subarray(3)), "utf8", {stripBOM: false});

    if (bom && bom === encoding) return iconv.decode(Buffer.from(buffer.subarray(2)), encoding, {stripBOM: false});

    return iconv.decode(Buffer.from(buffer), resolveCodec(encoding), {stripBOM: false});
}

export function decodeText(buffer: Uint8Array, options: DetectionOptions, preferredEncoding?: string, fallbackEol: EolType = EolType.LF): DecodedText {
    const bom = detectBom(buffer);
    const encoding = bom || (isKnownEncoding(preferredEncoding) ? preferredEncoding : detectEncoding(buffer, options));
    const text = decodeBuffer(buffer, encoding);
    const eol = detectEol(text, fallbackEol);

    return {content: toEditorText(text, eol), encoding: encoding, eol: eol};
}

export function encodeText(content: string, encoding: string, eol: EolType): Buffer {
    const encoded = iconv.encode(toFileText(content, eol), resolveCodec(encoding), {addBOM: false});

    if (!hasBom(encoding)) return encoded;

    const bom = encoding === EncodingId.UTF8_BOM ? [0xEF, 0xBB, 0xBF] : encoding === EncodingId.UTF16_LE ? [0xFF, 0xFE] : [0xFE, 0xFF];

    return Buffer.concat([Buffer.from(bom), encoded]);
}

export function findUnencodableCharacters(content: string, encoding: string, limit = 10): {count: number, samples: Array<string>} {
    const codec = resolveCodec(encoding);

    if (codec === "utf8" || codec === "utf-16le" || codec === "utf-16be") return {count: 0, samples: []};

    const checked = new Map<string, boolean>();
    const samples: Array<string> = [];
    let count = 0;

    for (const char of content) {
        let encodable = checked.get(char);

        if (encodable === undefined) {
            encodable = iconv.decode(iconv.encode(char, codec), codec) === char;
            checked.set(char, encodable);

            if (!encodable && samples.length < limit) samples.push(char);
        }

        if (!encodable) count++;
    }

    return {count: count, samples: samples};
}
