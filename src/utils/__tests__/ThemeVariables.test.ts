import {describe, expect, it} from "vitest";
import {isValidThemeName, isValidVariableValue, parseThemeVariables, updateThemeVariables} from "../ThemeVariables";

const css = `:root {
    /* content related */
    --color: #c9c5cd;
    --primary-bg:#1e1e1e;
    --variable-color: var(--color);
}

.other { --ignored: red; }
`;

describe("ThemeVariables", () => {
    it("reads the variables of the :root block", () => {
        expect(parseThemeVariables(css)).toEqual([
            {name: "--color", value: "#c9c5cd"},
            {name: "--primary-bg", value: "#1e1e1e"},
            {name: "--variable-color", value: "var(--color)"},
        ]);
    });

    it("updates values and keeps the rest of the file", () => {
        const updated = updateThemeVariables(css, {"--primary-bg": "#000000", "--missing": "red", "--color": "bad; }"});

        expect(updated).toContain("--primary-bg: #000000;");
        expect(updated).toContain("--color: #c9c5cd;");
        expect(updated).toContain("/* content related */");
        expect(updated).toContain(".other { --ignored: red; }");
    });

    it("rejects values that could break the stylesheet", () => {
        expect(isValidVariableValue("rgba(0, 0, 0, 0.5)")).toBe(true);
        expect(isValidVariableValue("red; } body {")).toBe(false);
        expect(isValidVariableValue("  ")).toBe(false);
    });

    it("accepts simple theme names only", () => {
        expect(isValidThemeName("My Dark-2")).toBe(true);
        expect(isValidThemeName("../evil")).toBe(false);
        expect(isValidThemeName("")).toBe(false);
    });
});
