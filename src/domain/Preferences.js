import {Theme} from "./Theme";
import {readSync} from "../utils/FileUtils";

export class Preferences {
    theme

    constructor(theme) {
        this.theme = theme;
    }
}

export function from(file) {
    const content = readSync(file);

    const prefObj = JSON.parse(content);

    const preferences = new Preferences();

    preferences.theme = new Theme(prefObj.theme.file);

    return preferences;
}

