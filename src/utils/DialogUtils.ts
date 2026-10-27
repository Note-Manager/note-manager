import {UnsavedChangesChoice} from "../enums";

export const UNSAVED_CHANGES_BUTTONS = [
    {label: "Save", choice: UnsavedChangesChoice.SAVE},
    {label: "Don't Save", choice: UnsavedChangesChoice.DISCARD},
    {label: "Cancel", choice: UnsavedChangesChoice.CANCEL},
];

export function getUnsavedChangesMessage(names: Array<string>): {message: string, detail: string} {
    if (names.length === 1) {
        return {
            message: `Do you want to save the changes you made to ${names[0]}?`,
            detail: "Your changes will be lost if you don't save them.",
        };
    }

    return {
        message: `Do you want to save the changes you made to ${names.length} documents?`,
        detail: names.join("\n") + "\n\nYour changes will be lost if you don't save them.",
    };
}
