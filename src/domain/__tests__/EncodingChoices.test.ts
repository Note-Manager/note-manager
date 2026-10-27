import {describe, expect, it} from "vitest";
import {buildEncodingChoices, filterEncodingChoices} from "../EncodingChoices";

describe("EncodingChoices", () => {
    it("starts with detection, then Unicode, the system code page and the character sets", () => {
        const choices = buildEncodingChoices("windows-1254", true);

        expect(choices[0].id).toBeUndefined();
        expect(choices[0].group).toBe("Automatic");
        expect(choices.slice(1, 5).map(c => c.id)).toEqual(["utf-8", "utf-8-bom", "utf-16le", "utf-16be"]);
        expect(choices[5]).toMatchObject({id: "ansi", group: "System", description: "System code page, Windows-1254"});
        expect(choices[6]).toMatchObject({id: "windows-1254", group: "Turkish"});
    });

    it("leaves out detection when it is not possible", () => {
        expect(buildEncodingChoices(undefined, false)[0].id).toBe("utf-8");
    });

    it("finds encodings by number, name or region", () => {
        const choices = buildEncodingChoices("windows-1254", false);

        expect(filterEncodingChoices(choices, "1254").map(c => c.id)).toEqual(["ansi", "windows-1254"]);
        expect(filterEncodingChoices(choices, "latin 5").map(c => c.id)).toEqual(["iso-8859-9"]);
        expect(filterEncodingChoices(choices, "cyrillic koi8").map(c => c.id)).toEqual(["koi8-r", "koi8-u"]);
        expect(filterEncodingChoices(choices, "shift jis").map(c => c.id)).toEqual(["shift_jis"]);
        expect(filterEncodingChoices(choices, "  ").length).toBe(choices.length);
        expect(filterEncodingChoices(choices, "klingon")).toEqual([]);
    });
});
