import {describe, expect, it} from "vitest";
import {addMarkRule, clearMarkStyles, createSmartHighlightQuery, createTokenQuery, MarkStyle, normalizeMarkRules, readWholeWord} from "../Marks";
import {SearchMode} from "../Search";

describe("Marks", () => {
    it("adds a rule once and clears styles", () => {
        const rule = {style: MarkStyle.STYLE_1, query: createTokenQuery("foo")};
        const rules = addMarkRule(addMarkRule([rule], {style: MarkStyle.STYLE_2, query: createTokenQuery("bar")}), rule);

        expect(rules.map(r => r.query.text)).toEqual(["bar", "foo"]);
        expect(clearMarkStyles(rules, [MarkStyle.STYLE_1])).toEqual([{style: MarkStyle.STYLE_2, query: createTokenQuery("bar")}]);
    });

    it("styles tokens literally and smart highlights whole words", () => {
        expect(createTokenQuery("a.b")).toMatchObject({mode: SearchMode.NORMAL, matchCase: true, wholeWord: false});
        expect(createSmartHighlightQuery("word")).toMatchObject({matchCase: false, wholeWord: true, text: "word"});
    });

    it("keeps only valid stored rules", () => {
        expect(normalizeMarkRules([
            {style: "style-3", query: {text: "x", mode: "regex"}},
            {style: "style-9", query: {text: "x"}},
            {style: "found", query: {text: ""}},
            null,
        ])).toEqual([{style: MarkStyle.STYLE_3, query: {...createTokenQuery("x"), mode: SearchMode.REGEX, matchCase: false}}]);
        expect(normalizeMarkRules("x")).toEqual([]);
    });

    it("reads a selection only when it is a whole word", () => {
        expect(readWholeWord("say şeker now", 4, 9)).toBe("şeker");
        expect(readWholeWord("say şeker now", 4, 7)).toBeUndefined();
        expect(readWholeWord("a b", 0, 3)).toBeUndefined();
        expect(readWholeWord("x_1", 0, 3)).toBe("x_1");
    });
});
