import {describe, expect, it} from "vitest";
import {getPluginScriptUrl, parsePluginScriptUrl, validatePluginManifest} from "../PluginManifest";

const reserved = new Set(["saveTab", "beautify.format"]);

describe("PluginManifest", () => {
    it("accepts a valid manifest", () => {
        const {manifest, errors} = validatePluginManifest("hello", {
            name: " Hello ",
            version: "1.0.0",
            actions: [{code: "hello.upper", label: "Upper Case", accelerator: "CmdOrCtrl+Alt+U"}],
        }, reserved);

        expect(errors).toEqual([]);
        expect(manifest).toEqual({
            id: "hello",
            name: "Hello",
            version: "1.0.0",
            main: "plugin.js",
            actions: [{code: "hello.upper", label: "Upper Case", accelerator: "CmdOrCtrl+Alt+U"}],
        });
    });

    it("rejects reserved, duplicate and malformed action codes", () => {
        const {manifest, errors} = validatePluginManifest("hello", {
            name: "Hello",
            actions: [
                {code: "beautify.format", label: "A"},
                {code: "saveTab", label: "B"},
                {code: "hello.a", label: "C"},
                {code: "hello.a", label: "D"},
            ],
        }, reserved);

        expect(manifest).toBeUndefined();
        expect(errors).toHaveLength(3);
    });

    it("rejects codes in a bundled plugin's namespace", () => {
        expect(validatePluginManifest("hello", {name: "Hello", actions: [{code: "Beautify.other", label: "A"}]}, reserved, new Set(["beautify"])).errors).toHaveLength(1);
    });

    it("rejects scripts outside the plugin folder and bad accelerators", () => {
        const {errors} = validatePluginManifest("hello", {
            name: "Hello",
            main: "../evil.js",
            actions: [{code: "hello.a", label: "A", accelerator: "K"}],
        }, reserved);

        expect(errors).toHaveLength(2);
    });

    it("rejects a missing name and empty actions", () => {
        expect(validatePluginManifest("hello", {actions: []}, reserved).errors).toHaveLength(2);
        expect(validatePluginManifest("../x", {name: "X", actions: [{code: "x.y", label: "Y"}]}, reserved).errors).toHaveLength(1);
    });

    it("builds and parses script urls", () => {
        const url = getPluginScriptUrl({id: "My Plugin", name: "My Plugin", main: "plugin.js", actions: []});

        expect(url).toBe("nm-plugin://plugins/My%20Plugin/plugin.js");
        expect(parsePluginScriptUrl(url)).toEqual({id: "My Plugin", file: "plugin.js"});
        expect(parsePluginScriptUrl("nm-plugin://plugins/a/../b/plugin.js")).toEqual({id: "b", file: "plugin.js"});
        expect(parsePluginScriptUrl("nm-plugin://plugins/a/b/plugin.js")).toBeUndefined();
        expect(parsePluginScriptUrl("nm-plugin://plugins/a/%2e%2e%2fplugin.js")).toBeUndefined();
        expect(parsePluginScriptUrl("file:///etc/passwd")).toBeUndefined();
    });
});
