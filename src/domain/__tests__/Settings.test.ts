import {describe, expect, it} from "vitest";
import {
    DEFAULT_SETTINGS,
    findShortcutConflicts,
    isValidAccelerator,
    keyEventToAccelerator,
    normalizeSettings,
    resolveAccelerator,
    TabLayout
} from "../Settings";

const key = (code: string, modifiers: Partial<{ctrlKey: boolean, metaKey: boolean, altKey: boolean, shiftKey: boolean}> = {}) => ({
    code: code, ctrlKey: false, metaKey: false, altKey: false, shiftKey: false, ...modifiers
});

describe("Settings", () => {
    it("uses the defaults for missing or invalid values", () => {
        expect(normalizeSettings(undefined)).toEqual(DEFAULT_SETTINGS);
        expect(normalizeSettings({editor: {fontSize: "big", tabSize: null, wrap: "yes"}, ui: {tabLayout: "diagonal"}})).toEqual(DEFAULT_SETTINGS);
    });

    it("clamps numbers and keeps valid values", () => {
        const settings = normalizeSettings({
            editor: {fontFamily: "  Consolas ", fontSize: 100, tabSize: 0, wrap: true, useSoftTabs: true},
            ui: {tabLayout: TabLayout.VERTICAL, startMaximized: true},
        });

        expect(settings.editor).toMatchObject({fontFamily: "Consolas", fontSize: 40, tabSize: 1, wrap: true, useSoftTabs: true});
        expect(settings.ui).toEqual({tabLayout: TabLayout.VERTICAL, startMaximized: true});
    });

    it("keeps only valid key bindings", () => {
        const settings = normalizeSettings({keyBindings: {a: "CmdOrCtrl+K", b: "", c: "Nope+K", d: "K", e: 5}});

        expect(settings.keyBindings).toEqual({a: "CmdOrCtrl+K", b: ""});
    });

    it("validates accelerators", () => {
        expect(isValidAccelerator("CmdOrCtrl+Shift+T")).toBe(true);
        expect(isValidAccelerator("CmdOrCtrl+,")).toBe(true);
        expect(isValidAccelerator("F5")).toBe(true);
        expect(isValidAccelerator("Alt+Up")).toBe(true);
        expect(isValidAccelerator("T")).toBe(false);
        expect(isValidAccelerator("Shift+Shift+T")).toBe(false);
        expect(isValidAccelerator("CmdOrCtrl+")).toBe(false);
    });

    it("turns key events into accelerators", () => {
        expect(keyEventToAccelerator(key("KeyK", {ctrlKey: true, shiftKey: true}))).toBe("CmdOrCtrl+Shift+K");
        expect(keyEventToAccelerator(key("Digit1", {metaKey: true}))).toBe("CmdOrCtrl+1");
        expect(keyEventToAccelerator(key("Comma", {ctrlKey: true}))).toBe("CmdOrCtrl+,");
        expect(keyEventToAccelerator(key("F2"))).toBe("F2");
        expect(keyEventToAccelerator(key("KeyK"))).toBeUndefined();
        expect(keyEventToAccelerator(key("ShiftLeft", {shiftKey: true}))).toBeUndefined();
    });

    it("resolves custom, removed and default accelerators", () => {
        const settings = normalizeSettings({keyBindings: {a: "CmdOrCtrl+K", b: ""}});

        expect(resolveAccelerator(settings, "a", "CmdOrCtrl+A")).toBe("CmdOrCtrl+K");
        expect(resolveAccelerator(settings, "b", "CmdOrCtrl+B")).toBeUndefined();
        expect(resolveAccelerator(settings, "c", "CmdOrCtrl+C")).toBe("CmdOrCtrl+C");
    });

    it("finds shortcuts that share keys", () => {
        expect(findShortcutConflicts([
            {id: "a", accelerator: "CmdOrCtrl+K"},
            {id: "b", accelerator: "cmdorctrl+k"},
            {id: "c", accelerator: "CmdOrCtrl+L"},
            {id: "d"},
        ])).toEqual(new Set(["a", "b"]));
    });
});
