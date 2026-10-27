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

vi.mock("../EnvironmentUtils", async () => {
    const {DEFAULT_SETTINGS} = await import("../../domain/Settings");

    return {
        getStateFilePath: () => paths.stateFile,
        getSettings: () => ({...DEFAULT_SETTINGS, files: {...DEFAULT_SETTINGS.files, defaultEol: "LF"}}),
    };
});

import {fileToTab, readEditorState, writeEditorState} from "../EditorUtils";
import {documentHash, hash} from "../TextUtils";
import {setAnsiCodePage} from "../EncodingUtils";

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
        expect(state?.tabs[0].hash).toBe(await documentHash("changed outside", "utf-8", "LF"));
        expect(state?.tabs[0].state).toBeUndefined();
    });

    it("keeps editor state when an old style hash still matches the file", async () => {
        const file = path.join(dir, "note.txt");
        fs.writeFileSync(file, "same");

        fs.writeFileSync(paths.stateFile, JSON.stringify({tabs: [
            {id: "1", file: file, hash: await hash("same"), state: {scroll: {top: 10, left: 0}}},
        ]}));

        const state = await readEditorState();

        expect(state?.tabs[0].state?.scroll?.top).toBe(10);
        expect(state?.tabs[0].encoding).toBe("utf-8");
        expect(state?.tabs[0].eol).toBe("LF");
    });

    it("reads an unchanged tab again with its saved encoding", async () => {
        setAnsiCodePage("windows-1254");

        const file = path.join(dir, "ansi.txt");
        fs.writeFileSync(file, Buffer.from([0x61, 0xFD, 0x0D, 0x0A, 0x62]));

        fs.writeFileSync(paths.stateFile, JSON.stringify({tabs: [
            {id: "1", file: file, encoding: "iso-8859-1"},
            {id: "2", isTemp: true, content: "a\r\nb"},
        ]}));

        const state = await readEditorState();

        expect(state?.tabs[0].content).toBe("a\u00FD\r\nb");
        expect(state?.tabs[0].encoding).toBe("iso-8859-1");
        expect(state?.tabs[0].eol).toBe("CRLF");
        expect(state?.tabs[1].encoding).toBe("utf-8");
        expect(state?.tabs[1].eol).toBe("CRLF");

        setAnsiCodePage(undefined);
    });
});

describe("fileToTab", () => {
    it("detects encoding and line endings", async () => {
        setAnsiCodePage("windows-1254");

        const file = path.join(dir, "turkish.txt");
        fs.writeFileSync(file, Buffer.from([0xFE, 0xFD, 0xF0, 0x0A, 0x61]));

        const tab = await fileToTab(file);

        expect(tab.encoding).toBe("ansi");
        expect(tab.eol).toBe("LF");
        expect(tab.content).toBe("\u015F\u0131\u011F\na");
        expect(tab.hash).toBe(await documentHash(tab.content || "", "ansi", "LF"));

        setAnsiCodePage(undefined);
    });
});
