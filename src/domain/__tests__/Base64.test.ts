import {describe, expect, it} from "vitest";
import {decodeBase64ToBytes, decodeUtf8, normalizeBase64} from "../Base64";

describe("Base64", () => {
    it("keeps every byte of binary data", () => {
        const bytes = Uint8Array.from({length: 256}, (_, i) => i);

        expect(decodeBase64ToBytes(Buffer.from(bytes).toString("base64"))).toEqual(bytes);
    });

    it("ignores whitespace and line breaks", () => {
        expect(decodeBase64ToBytes("aGVs\r\nbG8g\n d29y bGQ=")).toEqual(new TextEncoder().encode("hello world"));
    });

    it("accepts missing padding and the URL-safe alphabet", () => {
        expect(decodeBase64ToBytes("aGk")).toEqual(new TextEncoder().encode("hi"));
        expect(normalizeBase64("-_-_")).toBe("+/+/");
    });

    it("rejects text that is not Base64", () => {
        expect(normalizeBase64("")).toBeUndefined();
        expect(normalizeBase64("abc!")).toBeUndefined();
        expect(normalizeBase64("abcde")).toBeUndefined();
        expect(normalizeBase64("ab=c")).toBeUndefined();
        expect(normalizeBase64("abc==")).toBeUndefined();
    });

    it("decodes only valid UTF-8 as text", () => {
        expect(decodeUtf8(new TextEncoder().encode("ğüş"))).toBe("ğüş");
        expect(decodeUtf8(Uint8Array.from([0x50, 0x4b, 0xff]))).toBeUndefined();
    });
});
