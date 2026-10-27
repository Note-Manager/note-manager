import {describe, expect, it} from "vitest";
import {
    CHARACTER_SET_GROUPS,
    detectEol,
    EolType,
    getEditorNewLineMode,
    getCharacterSet,
    getEncodingLabel,
    getEolLabel,
    getShortEncodingLabel,
    isKnownEncoding,
    toEditorText,
    toFileText
} from "../Encoding";
import iconv from "iconv-lite";

describe("Encoding", () => {
    it("labels encodings and line endings", () => {
        expect(getEncodingLabel("utf-8")).toBe("UTF-8");
        expect(getEncodingLabel("utf-8-bom")).toBe("UTF-8 with BOM");
        expect(getEncodingLabel("utf-16le")).toBe("UTF-16 LE");
        expect(getEncodingLabel("ansi")).toBe("ANSI");
        expect(getEncodingLabel("iso-8859-9")).toBe("ISO-8859-9 (Latin-5)");
        expect(getShortEncodingLabel("iso-8859-9")).toBe("ISO-8859-9");
        expect(getEncodingLabel(undefined)).toBe("UTF-8");
        expect(getEolLabel(EolType.CRLF)).toBe("CRLF");
        expect(getEolLabel(EolType.CR)).toBe("CR");
        expect(getEolLabel(undefined)).toBe("LF");
        expect(getCharacterSet("cp857")).toEqual({id: "cp857", label: "DOS 857", group: "Turkish"});
    });

    it("lists every character set once", () => {
        const ids = CHARACTER_SET_GROUPS.flatMap(g => g.sets.map(s => s.id));

        expect(new Set(ids).size).toBe(ids.length);
    });

    it("knows only the listed encodings", () => {
        expect(isKnownEncoding("iso-8859-9")).toBe(true);
        expect(isKnownEncoding("utf-7")).toBe(false);
        expect(isKnownEncoding(undefined)).toBe(false);
    });

    it("lists only character sets the codec supports", () => {
        CHARACTER_SET_GROUPS.flatMap(g => g.sets).forEach(set => expect(iconv.encodingExists(set.id), set.id).toBe(true));
    });

    it("detects the first line ending", () => {
        expect(detectEol("a\r\nb\nc", EolType.LF)).toBe(EolType.CRLF);
        expect(detectEol("a\nb\r\nc", EolType.CRLF)).toBe(EolType.LF);
        expect(detectEol("a\rb", EolType.LF)).toBe(EolType.CR);
        expect(detectEol("abc", EolType.CRLF)).toBe(EolType.CRLF);
    });

    it("converts line endings for the editor and for the file", () => {
        expect(toEditorText("a\rb\nc\r\nd", EolType.CRLF)).toBe("a\r\nb\r\nc\r\nd");
        expect(toEditorText("a\rb\r\nc", EolType.CR)).toBe("a\nb\nc");
        expect(toFileText("a\nb\r\nc", EolType.CR)).toBe("a\rb\rc");
        expect(getEditorNewLineMode(EolType.CRLF)).toBe("windows");
        expect(getEditorNewLineMode(EolType.CR)).toBe("unix");
    });
});
