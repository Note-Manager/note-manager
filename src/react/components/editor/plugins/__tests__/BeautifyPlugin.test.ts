import {describe, expect, it} from "vitest";
import BeautifyPlugin from "../BeautifyPlugin";
import {FakeEditorWrapper} from "../../../../../test/FakeEditorWrapper";
import {LanguageName} from "../../../../../domain/SupportedLanguage";

function format(text: string, language: LanguageName) {
    const editor = new FakeEditorWrapper(text, language);
    const plugin = new BeautifyPlugin();
    plugin.initializePlugin(editor);
    plugin.doAction("beautify.format");
    return editor.getValue();
}

describe("BeautifyPlugin", () => {
    it("formats JSON", () => {
        expect(format('{"a":1,"b":[1,2]}', LanguageName.JSON)).toBe('{\n    "a": 1,\n    "b": [\n        1,\n        2\n    ]\n}');
    });

    it("formats XML with LF line endings", () => {
        expect(format("<a><b>1</b></a>", LanguageName.XML)).toBe("<a>\n    <b>1</b>\n</a>");
    });

    it("leaves invalid content and plain text unchanged", () => {
        expect(format('{"a":', LanguageName.JSON)).toBe('{"a":');
        expect(format("just text", LanguageName.TEXT)).toBe("just text");
    });
});
