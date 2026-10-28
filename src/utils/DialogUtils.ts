import {UnencodableChoice, UnsavedChangesChoice} from "../enums";

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

export const UNENCODABLE_SAVE_BUTTONS = [
    {label: "Convert to UTF-8 and Save", choice: UnencodableChoice.CONVERT_TO_UTF8},
    {label: "Save Anyway", choice: UnencodableChoice.SAVE_ANYWAY},
    {label: "Cancel", choice: UnencodableChoice.CANCEL},
];

export function getUnencodableMessage(encodingLabel: string, count: number, samples: Array<string>): string {
    const characters = samples.map(c => `"${c}"`).join(" ");

    return `${count} character${count === 1 ? "" : "s"} cannot be represented in ${encodingLabel} and will be replaced with "?": ${characters}${count > samples.length ? " ..." : ""}`;
}
