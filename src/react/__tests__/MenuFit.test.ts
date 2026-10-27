import {describe, expect, it} from "vitest";
import {fitMenu} from "../MenuFit";

function fakeMenu(top: number, height: number, isSubmenu: boolean) {
    const classes = new Set(isSubmenu ? ["cet-submenu"] : []);
    const menu = {
        style: {top: `${top}px`, maxHeight: ""} as Record<string, string>,
        classList: {
            add: (c: string) => classes.add(c),
            remove: (c: string) => classes.delete(c),
            contains: (c: string) => classes.has(c),
        },
        getBoundingClientRect: () => {
            const currentTop = parseFloat(menu.style.top);
            const visibleHeight = menu.style.maxHeight ? Math.min(height, parseFloat(menu.style.maxHeight)) : height;

            return {top: currentTop, bottom: currentTop + visibleHeight};
        },
        classes: classes,
    };

    return menu;
}

describe("fitMenu", () => {
    it("leaves a menu that fits alone", () => {
        const menu = fakeMenu(100, 300, true);

        fitMenu(menu as any, 800);

        expect(menu.style.top).toBe("100px");
        expect(menu.style.maxHeight).toBe("");
    });

    it("moves a submenu up until it fits", () => {
        const menu = fakeMenu(600, 400, true);

        fitMenu(menu as any, 800);

        expect(menu.style.top).toBe("394px");
        expect(menu.style.maxHeight).toBe("");
    });

    it("scrolls a menu that is taller than the window", () => {
        const menu = fakeMenu(30, 1200, false);

        fitMenu(menu as any, 800);

        expect(menu.style.top).toBe("30px");
        expect(menu.style.maxHeight).toBe("764px");
        expect(menu.classes.has("fitted")).toBe(true);
    });

    it("moves a tall submenu to the top and scrolls it", () => {
        const menu = fakeMenu(300, 1200, true);

        fitMenu(menu as any, 800);

        expect(menu.style.top).toBe("6px");
        expect(menu.style.maxHeight).toBe("788px");
    });
});
