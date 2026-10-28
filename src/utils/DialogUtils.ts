import type {MessageBoxSyncOptions} from "electron";
import {UnencodableChoice, UnsavedChangesChoice} from "../enums";

export const UNSAVED_CHANGES_BUTTONS = [
    {label: "Save", choice: UnsavedChangesChoice.SAVE},
    {label: "Don't Save", choice: UnsavedChangesChoice.DISCARD},
    {label: "Cancel", choice: UnsavedChangesChoice.CANCEL},
];

export const UNENCODABLE_SAVE_BUTTONS = [
    {label: "Convert to UTF-8 and Save", choice: UnencodableChoice.CONVERT_TO_UTF8},
    {label: "Save Anyway", choice: UnencodableChoice.SAVE_ANYWAY},
    {label: "Cancel", choice: UnencodableChoice.CANCEL},
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

export function getUnencodableMessage(encodingLabel: string, count: number, samples: Array<string>): string {
    const characters = samples.map(c => `"${c}"`).join(" ");

    return `${count} character${count === 1 ? "" : "s"} cannot be represented in ${encodingLabel} and will be replaced with "?": ${characters}${count > samples.length ? " ..." : ""}`;
}

export function unsavedChangesDialog(names: Array<string>): MessageBoxSyncOptions {
    return {
        type: "warning",
        buttons: UNSAVED_CHANGES_BUTTONS.map(b => b.label),
        defaultId: 0,
        cancelId: UNSAVED_CHANGES_BUTTONS.length - 1,
        noLink: true,
        title: "Unsaved changes",
        ...getUnsavedChangesMessage(names),
    };
}

export function unencodableSaveDialog(file: string, encodingLabel: string, count: number, samples: Array<string>): MessageBoxSyncOptions {
    return {
        type: "warning",
        buttons: UNENCODABLE_SAVE_BUTTONS.map(b => b.label),
        defaultId: 0,
        cancelId: UNENCODABLE_SAVE_BUTTONS.length - 1,
        noLink: true,
        title: "Save",
        message: getUnencodableMessage(encodingLabel, count, samples),
        detail: file,
    };
}

export function reinterpretDialog(name: string | undefined, encodingLabel: string | undefined): MessageBoxSyncOptions {
    return {
        type: "question",
        buttons: ["Reopen", "Cancel"],
        defaultId: 1,
        cancelId: 1,
        noLink: true,
        title: "Reopen with Encoding",
        message: `Reopen ${name || "this file"} with ${encodingLabel || "the detected encoding"}?`,
        detail: "The file is read again from disk. Your unsaved changes in this tab will be lost.",
    };
}

export function conversionDialog(encodingLabel: string, count: number, samples: Array<string>): MessageBoxSyncOptions {
    return {
        type: "warning",
        buttons: ["Convert", "Cancel"],
        defaultId: 1,
        cancelId: 1,
        noLink: true,
        title: "Convert to " + encodingLabel,
        message: getUnencodableMessage(encodingLabel, count, samples),
        detail: "Do you want to convert anyway?",
    };
}

export function openLargeOrBinaryFileDialog(fileName: string, sizeInBytes: number, isBinary: boolean): MessageBoxSyncOptions {
    const reason = isBinary
        ? "This file looks like a binary file."
        : `This file is ${(sizeInBytes / 1024 / 1024).toFixed(1)} MB. Large files may make the editor slow.`;

    return {
        type: "warning",
        buttons: ["Cancel", "Open"],
        defaultId: 1,
        cancelId: 0,
        title: "Open file",
        message: fileName,
        detail: reason + "\n\nDo you want to open it anyway?",
    };
}

export function missingRecentFileDialog(file: string): MessageBoxSyncOptions {
    return {
        type: "warning",
        title: "Open Recent",
        message: "File not found",
        detail: file + "\n\nIt will be removed from the recent files list.",
    };
}
