const MENU_SELECTOR = ".cet-menubar-menu-container";
const MARGIN = 6;

export function fitMenu(menu: HTMLElement, viewportHeight: number) {
    menu.classList.remove("fitted");
    menu.style.maxHeight = "";

    let rect = menu.getBoundingClientRect();
    const bottom = viewportHeight - MARGIN;

    if (rect.bottom <= bottom) return;

    if (menu.classList.contains("cet-submenu")) {
        const shift = Math.min(rect.bottom - bottom, Math.max(0, rect.top - MARGIN));
        const top = parseFloat(menu.style.top || "0") || 0;

        menu.style.top = `${top - shift}px`;
        rect = menu.getBoundingClientRect();
    }

    if (rect.bottom > bottom) {
        menu.style.maxHeight = `${Math.max(80, bottom - rect.top)}px`;
        menu.classList.add("fitted");
    }
}

function fitAddedMenus(mutations: Array<MutationRecord>) {
    const menus = new Set<HTMLElement>();

    mutations.forEach(m => m.addedNodes.forEach(node => {
        if (!(node instanceof HTMLElement)) return;

        if (node.matches(MENU_SELECTOR)) menus.add(node);

        node.querySelectorAll<HTMLElement>(MENU_SELECTOR).forEach(menu => menus.add(menu));
    }));

    if (menus.size > 0) requestAnimationFrame(() => menus.forEach(menu => menu.isConnected && fitMenu(menu, window.innerHeight)));
}

export function installMenuFit() {
    const observed = new WeakSet<Element>();
    const menuObserver = new MutationObserver(fitAddedMenus);

    const observeTitlebar = () => {
        document.querySelectorAll(".cet-titlebar").forEach(titlebar => {
            if (observed.has(titlebar)) return;

            observed.add(titlebar);
            menuObserver.observe(titlebar, {childList: true, subtree: true});
        });
    };

    new MutationObserver(observeTitlebar).observe(document.body, {childList: true});

    observeTitlebar();
}
