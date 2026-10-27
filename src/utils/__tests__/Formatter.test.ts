import {describe, expect, it} from "vitest";
import {formatCode, isFormattable} from "../Formatter";
import {LanguageName} from "../../domain/SupportedLanguage";

describe("Formatter", () => {
    it("formats JavaScript", async () => {
        expect(await formatCode(LanguageName.JAVASCRIPT, "function f(a,b){return a+b}\n")).toBe("function f(a, b) {\n    return a + b;\n}\n");
    });

    it("formats TypeScript", async () => {
        expect(await formatCode(LanguageName.TYPESCRIPT, "let a:number=1")).toBe("let a: number = 1;");
    });

    it("formats CSS", async () => {
        expect(await formatCode(LanguageName.CSS, "a{color:red;margin:0}")).toBe("a {\n    color: red;\n    margin: 0;\n}");
    });

    it("formats YAML with two-space indentation", async () => {
        expect(await formatCode(LanguageName.YAML, "a:   1\nb:\n    - x\n    - y\n")).toBe("a: 1\nb:\n  - x\n  - y\n");
    });

    it("formats Markdown without rewrapping prose", async () => {
        expect(await formatCode(LanguageName.MARKDOWN, "#  Title\n* one\n* two\n")).toBe("# Title\n\n- one\n- two\n");
    });

    it("formats Java", async () => {
        expect(await formatCode(LanguageName.JAVA, "class A{void f(){int x=1;}}")).toBe("class A {\n\n    void f() {\n        int x = 1;\n    }\n}");
    });

    it("keeps CRLF line endings", async () => {
        expect(await formatCode(LanguageName.CSS, "a{color:red}\r\nb{margin:0}\r\n")).toBe("a {\r\n    color: red;\r\n}\r\nb {\r\n    margin: 0;\r\n}\r\n");
    });

    it("returns the content unchanged when it cannot be parsed", async () => {
        expect(await formatCode(LanguageName.JAVASCRIPT, "const = ;")).toBe("const = ;");
    });

    it("knows which languages can be formatted", () => {
        expect(isFormattable(LanguageName.JAVA)).toBe(true);
        expect(isFormattable(LanguageName.JSON)).toBe(true);
        expect(isFormattable(LanguageName.PYTHON)).toBe(false);
    });
});
