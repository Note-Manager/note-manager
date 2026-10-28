import {describe, expect, it} from "vitest";
import {clampToolWindowWidth} from "../ToolWindowResizer";

describe("clampToolWindowWidth", () => {
    it("keeps the tool window between its minimum and the space the editor needs", () => {
        expect(clampToolWindowWidth(500, 1400)).toBe(500);
        expect(clampToolWindowWidth(100, 1400)).toBe(220);
        expect(clampToolWindowWidth(1300, 1400)).toBe(1080);
        expect(clampToolWindowWidth(400.6, 1400)).toBe(401);
        expect(clampToolWindowWidth(400, 300)).toBe(220);
    });
});
