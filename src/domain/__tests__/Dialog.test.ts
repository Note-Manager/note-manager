import {describe, expect, it} from "vitest";
import {getDialogResult, getInitialFocusIndex, MessageDialog, orderDialogActions} from "../Dialog";
import {DialogRole, MessageKind} from "../../enums";

const dialog: MessageDialog<string> = {
    kind: MessageKind.WARNING,
    title: "Unsaved changes",
    message: "Save?",
    actions: [
        {label: "Save", role: DialogRole.PRIMARY, value: "save"},
        {label: "Don't Save", role: DialogRole.DESTRUCTIVE, value: "discard"},
        {label: "Cancel", role: DialogRole.CANCEL, value: "cancel"},
    ],
};

describe("Dialog", () => {
    it("returns the value of the chosen action", () => {
        expect(getDialogResult(dialog, 1)).toBe("discard");
    });

    it("falls back to the cancel action when the dialog is dismissed", () => {
        expect(getDialogResult(dialog, -1)).toBe("cancel");
        expect(getDialogResult(dialog, 7)).toBe("cancel");
    });

    it("uses the last action as cancel when none is marked", () => {
        const confirm: MessageDialog<boolean> = {...dialog, actions: [{label: "OK", role: DialogRole.PRIMARY, value: true}]};

        expect(getDialogResult(confirm, -1)).toBe(true);
    });

    it("focuses the primary action first, otherwise cancel", () => {
        expect(getInitialFocusIndex(dialog)).toBe(0);
        expect(getInitialFocusIndex({...dialog, actions: dialog.actions.slice(1)})).toBe(1);
    });

    it("lays out destructive, cancel and primary from left to right", () => {
        expect(orderDialogActions(dialog.actions).map(a => a.index)).toEqual([1, 2, 0]);
    });
});
