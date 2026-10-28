import {describe, expect, it} from "vitest";
import {conversionDialog, getUnencodableMessage, getUnsavedChangesMessage, missingRecentFileNotice, unencodableSaveDialog, unsavedChangesDialog} from "../DialogUtils";
import {DialogRole, MessageKind, UnencodableChoice, UnsavedChangesChoice} from "../../enums";
import {getCancelAction} from "../../domain/Dialog";

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

    it("offers save as the primary action and don't save as the destructive one", () => {
        const actions = unsavedChangesDialog(["a.txt"]).actions;

        expect(actions.map(a => [a.role, a.value])).toEqual([
            [DialogRole.PRIMARY, UnsavedChangesChoice.SAVE],
            [DialogRole.DESTRUCTIVE, UnsavedChangesChoice.DISCARD],
            [DialogRole.CANCEL, UnsavedChangesChoice.CANCEL],
        ]);
    });

    it("cancels every question without saving or converting", () => {
        expect(getCancelAction(unsavedChangesDialog(["a.txt"])).value).toBe(UnsavedChangesChoice.CANCEL);
        expect(getCancelAction(unencodableSaveDialog("a.txt", "ANSI", 1, ["€"])).value).toBe(UnencodableChoice.CANCEL);
        expect(getCancelAction(conversionDialog("ANSI", 1, ["€"])).value).toBe(false);
    });

    it("reports a missing recent file as a warning with its path", () => {
        expect(missingRecentFileNotice("C:\\notes\\a.txt")).toMatchObject({kind: MessageKind.WARNING, detail: "C:\\notes\\a.txt"});
    });

    it("names the characters an encoding cannot hold", () => {
        expect(getUnencodableMessage("ANSI", 1, ["€"])).toBe('1 character cannot be represented in ANSI and will be replaced with "?": "€"');
        expect(getUnencodableMessage("ISO 8859-1", 12, ["ş", "ğ"])).toBe('12 characters cannot be represented in ISO 8859-1 and will be replaced with "?": "ş" "ğ" ...');
    });
});
