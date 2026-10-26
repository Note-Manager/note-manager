import {describe, expect, it} from "vitest";
import {getFileName, hash, shortenTabName} from "../TextUtils";

describe("TextUtils", () => {
    it("hashes content with SHA-256", async () => {
        expect(await hash("")).toBe("e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855");
        expect(await hash("abc")).toBe("ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad");
    });

    it("shortens long tab names", () => {
        expect(shortenTabName("short.txt")).toBe("short.txt");
        expect(shortenTabName("a".repeat(40))).toBe("a".repeat(25) + "...");
    });

    it("gets the file name from Windows and POSIX paths", () => {
        expect(getFileName("C:\\Users\\me\\notes.md")).toBe("notes.md");
        expect(getFileName("/home/me/notes.md")).toBe("notes.md");
        expect(getFileName("notes.md")).toBe("notes.md");
    });
});
