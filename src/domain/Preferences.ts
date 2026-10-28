import {Theme} from "./Theme";
import {readSync} from "../utils/FileUtils";
import {DEFAULT_SETTINGS, normalizeSettings, Settings} from "./Settings";

export class Preferences {
    theme: Theme;
    settings: Settings;

    constructor(theme: Theme, settings: Settings = DEFAULT_SETTINGS) {
        this.theme = theme;
        this.settings = settings;
    }
}

export function readPreferences(file: string) {
    const content = JSON.parse(readSync(file));

    return new Preferences(new Theme(content.theme.file), normalizeSettings(content.settings));
}
