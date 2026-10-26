import {afterEach, beforeEach, describe, expect, it, vi} from "vitest";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import {EditorState} from "../../domain/EditorState";

const paths = vi.hoisted(() => ({stateFile: ""}));

vi.mock("electron", () => ({
    default: {app: {isPackaged: false}},
    app: {getPath: () => os.tmpdir(), isPackaged: false},
    BrowserWindow: {getFocusedWindow: () => null},
    dialog: {},
}));

vi.mock("../EnvironmentUtils", () => ({
    getStateFilePath: () => paths.stateFile,
}));

import {readEditorState, writeEditorState} from "../EditorUtils";
import {hash} from "../TextUtils";

let dir: string;

beforeEach(() => {
    dir = fs.mkdtempSync(path.join(os.tmpdir(), "note-manager-"));
    paths.stateFile = path.join(dir, "State.json");
});

afterEach(() => {
    fs.rmSync(dir, {recursive: true, force: true});
});

function readState(): EditorState {
    return JSON.parse(fs.readFileSync(paths.stateFile, "utf8"));
}

describe("writeEditorState", () => {
    it("keeps unsaved content of file tabs in autosave and drops it on close", () => {
        const file = path.join(dir, "a.txt");

        writeEditorState({tabs: [
            {id: "1", file: file, content: "edited", isChanged: true},
            {id: "2", file: file + "2", content: "saved", isChanged: false},
            {id: "3", isTemp: true, content: "draft"},
        ]}, false);

        let state = readState();
        expect(state.tabs[0].content).toBe("edited");
        expect(state.tabs[1].content).toBeUndefined();
        expect(state.tabs[2].content).toBe("draft");

        writeEditorState({tabs: [
            {id: "1", file: file, content: "edited", isChanged: true},
            {id: "3", isTemp: true, content: "draft"},
        ]}, true);

        state = readState();
        expect(state.tabs[0].content).toBeUndefined();
        expect(state.tabs[0].isChanged).toBe(false);
        expect(state.tabs[1].content).toBe("draft");
    });
});

describe("readEditorState", () => {
    it("returns undefined when there is no state", async () => {
        expect(await readEditorState()).toBeUndefined();
    });

    it("backs up a corrupt state file", async () => {
        fs.writeFileSync(paths.stateFile, "{not json");

        expect(await readEditorState()).toBeUndefined();
        expect(fs.readFileSync(paths.stateFile + ".corrupt", "utf8")).toBe("{not json");
    });

    it("restores files, unsaved content and missing files", async () => {
        const saved = path.join(dir, "saved.txt");
        const edited = path.join(dir, "edited.txt");
        fs.writeFileSync(saved, "on disk");
        fs.writeFileSync(edited, "original");

        fs.writeFileSync(paths.stateFile, JSON.stringify({tabs: [
            {id: "1", file: saved, hash: await hash("on disk")},
            {id: "2", file: edited, content: "unsaved edit", isChanged: true, hash: await hash("original")},
            {id: "3", file: path.join(dir, "gone.txt"), content: "kept"},
            {id: "4", isTemp: true, content: "draft"},
        ]}));

        const state = await readEditorState();

        expect(state?.tabs[0].content).toBe("on disk");
        expect(state?.tabs[0].isChanged).toBe(false);
        expect(state?.tabs[1].content).toBe("unsaved edit");
        expect(state?.tabs[1].isChanged).toBe(true);
        expect(state?.tabs[2].isTemp).toBe(true);
        expect(state?.tabs[2].content).toBe("kept");
        expect(state?.tabs[3].content).toBe("draft");
    });

    it("resets editor state when the file changed on disk", async () => {
        const file = path.join(dir, "note.txt");
        fs.writeFileSync(file, "changed outside");

        fs.writeFileSync(paths.stateFile, JSON.stringify({tabs: [
            {id: "1", file: file, hash: await hash("old"), state: {scroll: {top: 10, left: 0}}},
        ]}));

        const state = await readEditorState();

        expect(state?.tabs[0].content).toBe("changed outside");
        expect(state?.tabs[0].hash).toBe(await hash("changed outside"));
        expect(state?.tabs[0].state).toBeUndefined();
    });
});
