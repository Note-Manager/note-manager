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

        run("Base64_base64Encode", editor);
        expect(editor.getValue()).toBe(Buffer.from("Merhaba dünya ğüşiöç 🚀").toString("base64"));

        run("Base64_base64Decode", editor);
        expect(editor.getValue()).toBe("Merhaba dünya ğüşiöç 🚀");
    });

    it("handles large selections", () => {
        const text = "abcğ".repeat(100000);
        const editor = new FakeEditorWrapper(text);

        run("Base64_base64Encode", editor);
        run("Base64_base64Decode", editor);

        expect(editor.getValue()).toBe(text);
    });

    it("only changes the selected ranges", () => {
        const editor = new FakeEditorWrapper("keep aGk= keep", undefined, [{start: 5, end: 9}]);

        run("Base64_base64Decode", editor);

        expect(editor.getValue()).toBe("keep hi keep");
    });
});

describe("BasePlugin", () => {
    it("lists the codes of its menu actions and rejects unknown ones", () => {
        const plugin = new Base64Plugin();

        plugin.initializePlugin(new FakeEditorWrapper("x"));

        expect(plugin.getAvailableActions()).toEqual(["Base64_base64Encode", "Base64_base64Decode"]);
        expect(() => plugin.doAction("unknown")).toThrow("Unsupported action");
    });
});
