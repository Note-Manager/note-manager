import {describe, expect, it} from "vitest";
import TextToolsPlugin, {
    removeDuplicateLines,
    removeEmptyLines,
    reverseLines,
    sortAscending,
    sortDescending,
    toLowerCase,
    toTitleCase,
    toUpperCase,
    trimTrailingWhitespace
} from "../TextToolsPlugin";
import {FakeEditorWrapper} from "../../../../../test/FakeEditorWrapper";

function run(code: string, editor: FakeEditorWrapper) {
    const plugin = new TextToolsPlugin();
    plugin.initializePlugin(editor);
    plugin.doAction(code);
}

describe("TextTools transforms", () => {
    it("sorts lines naturally and keeps the trailing newline", () => {
        expect(sortAscending("b\nitem10\na\nitem2\n")).toBe("a\nb\nitem2\nitem10\n");
        expect(sortDescending("a\nc\nb")).toBe("c\nb\na");
    });

    it("keeps CRLF line endings", () => {
        expect(sortAscending("b\r\na\r\n")).toBe("a\r\nb\r\n");
        expect(reverseLines("1\r\n2\r\n3")).toBe("3\r\n2\r\n1");
    });

    it("removes duplicate and empty lines", () => {
        expect(removeDuplicateLines("a\nb\na\nb\nc")).toBe("a\nb\nc");
        expect(removeEmptyLines("a\n\n  \nb\n")).toBe("a\nb\n");
    });

    it("trims trailing whitespace", () => {
        expect(trimTrailingWhitespace("a  \nb\t\n c ")).toBe("a\nb\n c");
    });

    it("changes case", () => {
        expect(toUpperCase("istanbul ğ")).toBe("ISTANBUL Ğ");
        expect(toLowerCase("ABC Ş")).toBe("abc ş");
        expect(toTitleCase("hello wORLD-foo bar_baz")).toBe("Hello World-Foo Bar_Baz");
    });
});

describe("TextToolsPlugin", () => {
    it("applies to the whole document when nothing is selected", () => {
        const editor = new FakeEditorWrapper("c\nb\na", undefined, [{start: 0, end: 0}]);

        run("textTools.sortAscending", editor);

        expect(editor.getValue()).toBe("a\nb\nc");
    });

    it("applies only to the selections", () => {
        const editor = new FakeEditorWrapper("keep\nc\nb\nkeep x y", undefined, [{start: 5, end: 9}, {start: 14, end: 17}]);

        run("textTools.upperCase", editor);

        expect(editor.getValue()).toBe("keep\nC\nB\nkeep X Y");
    });

    it("exposes every menu action", () => {
        const plugin = new TextToolsPlugin();
        plugin.initializePlugin(new FakeEditorWrapper(""));

        const menuCodes = plugin.applicationMenuItems.flatMap(m => m.actions.map(a => a.code));

        expect(new Set(plugin.getAvailableActions())).toEqual(new Set(menuCodes));
    });
});
