import {describe, expect, it} from "vitest";
import {getUnencodableMessage, getUnsavedChangesMessage, UNSAVED_CHANGES_BUTTONS} from "../DialogUtils";
import {UnsavedChangesChoice} from "../../enums";

describe("DialogUtils", () => {
    it("asks about a single document by name", () => {
        const {message, detail} = getUnsavedChangesMessage(["notes.md"]);

        expect(message).toBe("Do you want to save the changes you made to notes.md?");
        expect(detail).toBe("Your changes will be lost if you don't save them.");
    });

    it("lists every document when there are several", () => {
        const {message, detail} = getUnsavedChangesMessage(["a.txt", "b.txt"]);

        expect(message).toBe("Do you want to save the changes you made to 2 documents?");
        expect(detail.startsWith("a.txt\nb.txt\n\n")).toBe(true);
    });

    it("orders the buttons as save, don't save, cancel", () => {
        expect(UNSAVED_CHANGES_BUTTONS.map(b => b.choice)).toEqual([
            UnsavedChangesChoice.SAVE,
            UnsavedChangesChoice.DISCARD,
            UnsavedChangesChoice.CANCEL,
        ]);
    });

    it("names the characters an encoding cannot hold", () => {
        expect(getUnencodableMessage("ANSI", 1, ["€"])).toBe('1 character cannot be represented in ANSI and will be replaced with "?": "€"');
        expect(getUnencodableMessage("ISO 8859-1", 12, ["ş", "ğ"])).toBe('12 characters cannot be represented in ISO 8859-1 and will be replaced with "?": "ş" "ğ" ...');
    });
});
