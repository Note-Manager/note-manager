import {EditorTab} from "../domain/EditorTab";
import {fireEvent} from "./ApplicationEvents";
import {EventType, UnsavedChangesChoice} from "../enums";
import {applySavedFile} from "../utils/TabUtils";
import * as TextUtils from "../utils/TextUtils";
import {markStateChanged} from "./StateChangeTracker";

export async function saveTab(tab: EditorTab): Promise<boolean> {
    console.info("saving " + tab.name);

    let targetFile = tab.file;

    if (!targetFile) {
        targetFile = await fireEvent(EventType.SHOW_SAVE_DIALOG, {
            title: "Save " + tab.name,
            defaultName: tab.name,
        }) as string;

        if (!targetFile) return false;
    }

    const content = tab.content || "";

    await fireEvent(EventType.WRITE_FILE, {file: targetFile, content: content});

    if (!tab.file) applySavedFile(tab, targetFile);

    tab.hash = await TextUtils.hash(content);
    tab.isChanged = tab.content !== undefined && tab.content !== content;

    markStateChanged();

    console.info("saved to " + targetFile);

    return true;
}

export async function resolveUnsavedChanges(changedTabs: Array<EditorTab>): Promise<boolean> {
    if (changedTabs.length === 0) return true;

    const choice = await fireEvent(EventType.SHOW_UNSAVED_CHANGES_DIALOG, {
        names: changedTabs.map(t => t.name || "")
    });

    if (choice === UnsavedChangesChoice.DISCARD) return true;
    if (choice !== UnsavedChangesChoice.SAVE) return false;

    for (const tab of changedTabs) {
        if (!await saveTab(tab)) return false;
    }

    return true;
}
