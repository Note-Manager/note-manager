import {MessageKind, DialogRole, UnencodableChoice, UnsavedChangesChoice} from "../enums";
import {DialogAction, MessageDialog, Notice} from "../domain/Dialog";

const BYTES_PER_MEGABYTE = 1024 * 1024;

function confirmActions(label: string): Array<DialogAction<boolean>> {
    return [
        {label: "Cancel", role: DialogRole.CANCEL, value: false},
        {label: label, role: DialogRole.PRIMARY, value: true},
    ];
}

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

export function unsavedChangesDialog(names: Array<string>): MessageDialog<UnsavedChangesChoice> {
    return {
        kind: MessageKind.WARNING,
        title: "Unsaved changes",
        ...getUnsavedChangesMessage(names),
        actions: [
            {label: "Save", role: DialogRole.PRIMARY, value: UnsavedChangesChoice.SAVE},
            {label: "Don't Save", role: DialogRole.DESTRUCTIVE, value: UnsavedChangesChoice.DISCARD},
            {label: "Cancel", role: DialogRole.CANCEL, value: UnsavedChangesChoice.CANCEL},
        ],
    };
}

export function unencodableSaveDialog(file: string, encodingLabel: string, count: number, samples: Array<string>): MessageDialog<UnencodableChoice> {
    return {
        kind: MessageKind.WARNING,
        title: "Save",
        message: getUnencodableMessage(encodingLabel, count, samples),
        detail: file,
        actions: [
            {label: "Convert to UTF-8 and Save", role: DialogRole.PRIMARY, value: UnencodableChoice.CONVERT_TO_UTF8},
            {label: "Save Anyway", role: DialogRole.SECONDARY, value: UnencodableChoice.SAVE_ANYWAY},
            {label: "Cancel", role: DialogRole.CANCEL, value: UnencodableChoice.CANCEL},
        ],
    };
}

export function reinterpretDialog(name: string | undefined, encodingLabel: string | undefined): MessageDialog<boolean> {
    return {
        kind: MessageKind.QUESTION,
        title: "Reopen with Encoding",
        message: `Reopen ${name || "this file"} with ${encodingLabel || "the detected encoding"}?`,
        detail: "The file is read again from disk. Your unsaved changes in this tab will be lost.",
        actions: confirmActions("Reopen"),
    };
}

export function conversionDialog(encodingLabel: string, count: number, samples: Array<string>): MessageDialog<boolean> {
    return {
        kind: MessageKind.WARNING,
        title: "Convert to " + encodingLabel,
        message: getUnencodableMessage(encodingLabel, count, samples),
        detail: "Do you want to convert anyway?",
        actions: confirmActions("Convert"),
    };
}

export function openLargeOrBinaryFileDialog(fileName: string, sizeInBytes: number, isBinary: boolean): MessageDialog<boolean> {
    const reason = isBinary
        ? "This file looks like a binary file."
        : `This file is ${(sizeInBytes / BYTES_PER_MEGABYTE).toFixed(1)} MB. Large files may make the editor slow.`;

    return {
        kind: MessageKind.WARNING,
        title: "Open " + fileName,
        message: reason,
        detail: "Do you want to open it anyway?",
        actions: confirmActions("Open"),
    };
}

export function missingFileNotice(file: string): Notice {
    return {kind: MessageKind.WARNING, message: "File not found.", detail: file};
}

export function missingRecentFileNotice(file: string): Notice {
    return {
        kind: MessageKind.WARNING,
        message: "File not found. It was removed from the recent files.",
        detail: file,
    };
}

export function openFailedNotice(fileName: string, error: unknown): Notice {
    return errorNotice("Cannot open " + fileName, error);
}

export function preferencesFailedNotice(error: unknown): Notice {
    return errorNotice("Your preferences could not be loaded. The defaults are used.", error);
}

export function errorNotice(message: string, error: unknown): Notice {
    return {kind: MessageKind.ERROR, message: message, detail: String(error)};
}
