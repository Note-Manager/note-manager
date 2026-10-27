import {describe, expect, it} from "vitest";
import {getUnsavedChangesMessage, UNSAVED_CHANGES_BUTTONS} from "../DialogUtils";
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
});
