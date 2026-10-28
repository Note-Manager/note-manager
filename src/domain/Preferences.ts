import {Theme} from "./Theme";
import {readSync} from "../utils/FileUtils";
import {DEFAULT_SETTINGS, normalizeSettings, Settings} from "./Settings";

export class Preferences {
    theme: Theme;
    settings: Settings;

    constructor(theme:Theme, settings: Settings = DEFAULT_SETTINGS) {
        this.theme = theme;
        this.settings = settings;
    }
}

export function from(file:string) {
    const content = readSync(file);

    const prefObj = JSON.parse(content);

    return new Preferences(
        new Theme(prefObj.theme.file),
        normalizeSettings(prefObj.settings)
    );
}
