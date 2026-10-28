import {BrowserWindow} from "electron";
import {getTheme} from "./EnvironmentUtils";
import {parseThemeVariables} from "./ThemeVariables";

const insertedThemeKeys = new Map<number, string>();

export function getThemeBackgroundColor(): string | undefined {
    try {
        return parseThemeVariables(getTheme().getCSSContent()).find(v => v.name === "--primary-bg")?.value;
    } catch {
        return undefined;
    }
}

export function loadThemeToWindow(win: BrowserWindow) {
    const contents = win.webContents;
    const previousKey = insertedThemeKeys.get(contents.id);
    const background = getThemeBackgroundColor();

    if (background) win.setBackgroundColor(background);

    contents.insertCSS(getTheme().getCSSContent())
        .then(key => {
            insertedThemeKeys.set(contents.id, key);

            if (previousKey) return contents.removeInsertedCSS(previousKey);
        })
        .catch(err => console.error("cannot load theme: " + err));
}
