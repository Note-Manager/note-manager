import {describe, expect, it} from "vitest";
import Base64Plugin from "../Base64Plugin";
import {FakeEditorWrapper} from "../../../../../test/FakeEditorWrapper";

function run(code: string, editor: FakeEditorWrapper) {
    const plugin = new Base64Plugin();
    plugin.initializePlugin(editor);
    plugin.doAction(code);
}

describe("Base64Plugin", () => {
    it("encodes and decodes UTF-8 text", () => {
        const editor = new FakeEditorWrapper("Merhaba dünya ğüşiöç 🚀");

        run("base64.encode", editor);
        expect(editor.getValue()).toBe(Buffer.from("Merhaba dünya ğüşiöç 🚀").toString("base64"));

        run("base64.decode", editor);
        expect(editor.getValue()).toBe("Merhaba dünya ğüşiöç 🚀");
    });

    it("handles large selections", () => {
        const text = "abcğ".repeat(100000);
        const editor = new FakeEditorWrapper(text);

        run("base64.encode", editor);
        run("base64.decode", editor);

        expect(editor.getValue()).toBe(text);
    });

    it("only changes the selected ranges", () => {
        const editor = new FakeEditorWrapper("keep aGk= keep", undefined, [{start: 5, end: 9}]);

        run("base64.decode", editor);

        expect(editor.getValue()).toBe("keep hi keep");
    });
});

describe("BasePlugin", () => {
    it("lists the codes of its menu actions and rejects unknown ones", () => {
        const plugin = new Base64Plugin();

        plugin.initializePlugin(new FakeEditorWrapper("x"));

        expect(plugin.getAvailableActions()).toEqual(["base64.encode", "base64.decode"]);
        expect(() => plugin.doAction("unknown")).toThrow("Unsupported action");
    });
});
