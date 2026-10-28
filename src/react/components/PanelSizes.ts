export interface PanelSize {
    storageKey: string,
    defaultSize: number,
    clamp: (size: number) => number,
}

const MIN_TOOL_WINDOW_WIDTH = 220;
const MIN_EDITOR_WIDTH = 320;
const MIN_RESULTS_HEIGHT = 80;
const MIN_EDITOR_HEIGHT = 160;

export function clampToolWindowWidth(width: number, windowWidth: number): number {
    return clampBetween(width, MIN_TOOL_WINDOW_WIDTH, windowWidth - MIN_EDITOR_WIDTH);
}

export function clampResultsPanelHeight(height: number, windowHeight: number): number {
    return clampBetween(height, MIN_RESULTS_HEIGHT, windowHeight - MIN_EDITOR_HEIGHT);
}

export const TOOL_WINDOW_PANEL: PanelSize = {
    storageKey: "toolWindowWidth",
    defaultSize: 400,
    clamp: width => clampToolWindowWidth(width, window.innerWidth),
};

export const SEARCH_RESULTS_PANEL: PanelSize = {
    storageKey: "searchResultsHeight",
    defaultSize: 220,
    clamp: height => clampResultsPanelHeight(height, window.innerHeight),
};

function clampBetween(size: number, min: number, max: number): number {
    return Math.round(Math.min(Math.max(min, max), Math.max(min, size)));
}
