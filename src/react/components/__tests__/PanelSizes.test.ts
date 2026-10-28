import {describe, expect, it} from "vitest";
import {clampResultsPanelHeight, clampToolWindowWidth} from "../PanelSizes";

describe("panel sizes", () => {
    it("keeps the tool window between its minimum and the space the editor needs", () => {
        expect(clampToolWindowWidth(500, 1400)).toBe(500);
        expect(clampToolWindowWidth(100, 1400)).toBe(220);
        expect(clampToolWindowWidth(1300, 1400)).toBe(1080);
        expect(clampToolWindowWidth(400.6, 1400)).toBe(401);
        expect(clampToolWindowWidth(400, 300)).toBe(220);
    });

    it("keeps the search results panel between its minimum and the space the editor needs", () => {
        expect(clampResultsPanelHeight(200, 700)).toBe(200);
        expect(clampResultsPanelHeight(20, 700)).toBe(80);
        expect(clampResultsPanelHeight(650, 700)).toBe(540);
        expect(clampResultsPanelHeight(200, 100)).toBe(80);
    });
});
