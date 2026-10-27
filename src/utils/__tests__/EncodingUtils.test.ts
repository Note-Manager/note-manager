import {afterEach, beforeEach, describe, expect, it} from "vitest";
import iconv from "iconv-lite";
import {codePageFromLocale, decodeBuffer, decodeText, detectEncoding, encodeText, findUnencodableCharacters, setAnsiCodePage} from "../EncodingUtils";
import {EncodingId, EolType} from "../../domain/Encoding";

const options = {asciiAsUtf8: true, autodetect: true};
const turkish = "Çalışma günü öğleden sonra şirketteki toplantıya katılıyoruz.";
const russian = "Привет мир, как дела? Сегодня хорошая погода, и мы идём гулять в парк.";

beforeEach(() => setAnsiCodePage("windows-1254"));
afterEach(() => setAnsiCodePage(undefined));

describe("detectEncoding", () => {
    it("uses the BOM first", () => {
        expect(detectEncoding(Buffer.from([0xEF, 0xBB, 0xBF, 0x61]), options)).toBe(EncodingId.UTF8_BOM);
        expect(detectEncoding(Buffer.from([0xFF, 0xFE, 0x61, 0x00]), options)).toBe(EncodingId.UTF16_LE);
        expect(detectEncoding(Buffer.from([0xFE, 0xFF, 0x00, 0x61]), options)).toBe(EncodingId.UTF16_BE);
    });

    it("opens ASCII files as UTF-8 only when asked", () => {
        expect(detectEncoding(Buffer.from("plain text"), options)).toBe(EncodingId.UTF8);
        expect(detectEncoding(Buffer.from("plain text"), {...options, asciiAsUtf8: false})).toBe(EncodingId.ANSI);
    });

    it("keeps valid UTF-8 as UTF-8", () => {
        expect(detectEncoding(Buffer.from(turkish, "utf8"), options)).toBe(EncodingId.UTF8);
    });

    it("falls back to ANSI for text in the system script", () => {
        expect(detectEncoding(iconv.encode(turkish, "windows-1254"), options)).toBe(EncodingId.ANSI);
    });

    it("detects a character set of another script", () => {
        expect(detectEncoding(iconv.encode(russian, "windows-1251"), options)).toBe("windows-1251");
        expect(detectEncoding(iconv.encode(russian, "windows-1251"), {...options, autodetect: false})).toBe(EncodingId.ANSI);
    });
});

describe("decodeText", () => {
    it("decodes ANSI with the system code page and normalizes line endings", () => {
        const decoded = decodeText(iconv.encode("şı\r\nğ\nx", "windows-1254"), options);

        expect(decoded).toEqual({content: "şı\r\nğ\r\nx", encoding: EncodingId.ANSI, eol: EolType.CRLF});
    });

    it("strips the BOM and keeps old Mac line endings", () => {
        const decoded = decodeText(Buffer.from([0xEF, 0xBB, 0xBF, 0x61, 0x0D, 0x62]), options);

        expect(decoded).toEqual({content: "a\nb", encoding: EncodingId.UTF8_BOM, eol: EolType.CR});
    });

    it("prefers the BOM over the saved encoding", () => {
        const buffer = Buffer.concat([Buffer.from([0xFF, 0xFE]), iconv.encode("ğ", "utf-16le")]);

        expect(decodeText(buffer, options, "windows-1252").encoding).toBe(EncodingId.UTF16_LE);
        expect(decodeText(buffer, options, "windows-1252").content).toBe("ğ");
    });

    it("uses the saved encoding when there is no BOM", () => {
        expect(decodeText(Buffer.from([0xFD]), options, "iso-8859-1").content).toBe("ý");
    });

    it("uses the default line ending when the file has none", () => {
        expect(decodeText(Buffer.from("one line"), options, undefined, EolType.CRLF).eol).toBe(EolType.CRLF);
    });
});

describe("decodeBuffer", () => {
    it("reinterprets the bytes exactly as asked", () => {
        const utf8 = Buffer.from("ş", "utf8");

        expect(decodeBuffer(utf8, "windows-1254")).toBe("ÅŸ");
        expect(decodeBuffer(iconv.encode("ş", "windows-1254"), EncodingId.UTF8)).toBe("�");
    });
});

describe("encodeText", () => {
    it("writes the BOM and the line endings of the document", () => {
        expect([...encodeText("a\nb", EncodingId.UTF8_BOM, EolType.CRLF)]).toEqual([0xEF, 0xBB, 0xBF, 0x61, 0x0D, 0x0A, 0x62]);
        expect([...encodeText("a\r\nb", EncodingId.UTF8, EolType.LF)]).toEqual([0x61, 0x0A, 0x62]);
        expect([...encodeText("a\nb", EncodingId.UTF8, EolType.CR)]).toEqual([0x61, 0x0D, 0x62]);
        expect([...encodeText("ğ", EncodingId.UTF16_LE, EolType.LF)]).toEqual([0xFF, 0xFE, 0x1F, 0x01]);
        expect([...encodeText("ğ", EncodingId.UTF16_BE, EolType.LF)]).toEqual([0xFE, 0xFF, 0x01, 0x1F]);
        expect([...encodeText("ğ", EncodingId.ANSI, EolType.LF)]).toEqual([0xF0]);
    });

    it("round trips every character set", () => {
        const sample = "Hello\r\nWorld";

        ["windows-1251", "koi8-r", "shift_jis", "big5", "cp437", "tis620"].forEach(encoding => {
            const decoded = decodeText(encodeText(sample, encoding, EolType.CRLF), options, encoding);

            expect(decoded.content).toBe(sample);
        });
    });
});

describe("findUnencodableCharacters", () => {
    it("counts characters the encoding cannot hold", () => {
        expect(findUnencodableCharacters("şğ €😀😀", EncodingId.ANSI)).toEqual({count: 2, samples: ["😀"]});
        expect(findUnencodableCharacters("şж", "iso-8859-1")).toEqual({count: 2, samples: ["ş", "ж"]});
        expect(findUnencodableCharacters("😀", EncodingId.UTF8).count).toBe(0);
    });
});

describe("codePageFromLocale", () => {
    it("maps the system language to its ANSI code page", () => {
        expect(codePageFromLocale("tr-TR")).toBe("windows-1254");
        expect(codePageFromLocale("ru")).toBe("windows-1251");
        expect(codePageFromLocale("zh-TW")).toBe("big5");
        expect(codePageFromLocale("en-US")).toBe("windows-1252");
        expect(codePageFromLocale(undefined)).toBe("windows-1252");
    });
});
