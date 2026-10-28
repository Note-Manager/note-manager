import {describe, expect, it} from "vitest";
import {transformSelections, transformSelectionsOrDocument} from "../EditorTransforms";
import {FakeEditorWrapper} from "../../test/FakeEditorWrapper";

const upper = (text: string) => text.toUpperCase();

describe("EditorTransforms", () => {
    it("transforms every non-empty selection", () => {
        const editor = new FakeEditorWrapper("ab cd ef", undefined, [{start: 0, end: 2}, {start: 3, end: 3}, {start: 6, end: 8}]);

        expect(transformSelections(editor, upper)).toBe(true);
        expect(editor.getValue()).toBe("AB cd EF");
    });

    it("leaves the document alone when nothing is selected", () => {
        const editor = new FakeEditorWrapper("ab", undefined, [{start: 1, end: 1}]);

        expect(transformSelections(editor, upper)).toBe(false);
        expect(editor.getValue()).toBe("ab");
    });

    it("falls back to the whole document", () => {
        const editor = new FakeEditorWrapper("ab", undefined, [{start: 1, end: 1}]);

        transformSelectionsOrDocument(editor, upper);

        expect(editor.getValue()).toBe("AB");
    });
});
