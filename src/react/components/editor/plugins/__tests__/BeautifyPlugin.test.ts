import {describe, expect, it} from "vitest";
import BeautifyPlugin from "../BeautifyPlugin";
import {FakeEditorWrapper} from "../../../../../test/FakeEditorWrapper";
import {LanguageName} from "../../../../../domain/SupportedLanguage";

async function formatWith(editor: FakeEditorWrapper) {
    const plugin = new BeautifyPlugin();
    plugin.initializePlugin(editor);
    plugin.doAction("beautify.format");
    await plugin.pendingFormat;
    return editor.getValue();
}

function format(text: string, language: LanguageName) {
    return formatWith(new FakeEditorWrapper(text, language));
}

describe("BeautifyPlugin", () => {
    it("formats JSON", async () => {
        expect(await format('{"a":1,"b":[1,2]}', LanguageName.JSON)).toBe('{\n    "a": 1,\n    "b": [\n        1,\n        2\n    ]\n}');
    });

    it("formats XML with LF line endings", async () => {
        expect(await format("<a><b>1</b></a>", LanguageName.XML)).toBe("<a>\n    <b>1</b>\n</a>");
    });

    it("leaves invalid content and plain text unchanged", async () => {
        expect(await format('{"a":', LanguageName.JSON)).toBe('{"a":');
        expect(await format("just text", LanguageName.TEXT)).toBe("just text");
    });

    it("formats the whole document when nothing is selected", async () => {
        const editor = new FakeEditorWrapper('{"a":1}\n', LanguageName.JSON, [{start: 0, end: 0}]);

        expect(await formatWith(editor)).toBe('{\n    "a": 1\n}');
    });

    it("formats every selection from the last to the first", async () => {
        const text = '{"a":1} x {"b":2}';
        const editor = new FakeEditorWrapper(text, LanguageName.JSON, [{start: 0, end: 7}, {start: 10, end: 17}]);

        expect(await formatWith(editor)).toBe('{\n    "a": 1\n} x {\n    "b": 2\n}');
    });

    it("formats JavaScript with prettier", async () => {
        expect(await format("const a={b:1,c:[1,2]}", LanguageName.JAVASCRIPT)).toBe("const a = { b: 1, c: [1, 2] };");
    });

    it("offers Format in the context menu only for formattable languages", () => {
        const action = new BeautifyPlugin().contextMenuItems[0].actions[0];

        expect(action.code).toBe("beautify.format");
        expect(action.isAvailable?.(new FakeEditorWrapper("{}", LanguageName.JSON))).toBe(true);
        expect(action.isAvailable?.(new FakeEditorWrapper("text", LanguageName.TEXT))).toBe(false);
    });
});
