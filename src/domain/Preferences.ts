import {Theme} from "./Theme";
import {readSync} from "../utils/FileUtils";

export interface IPreferences {
    theme: Theme
}

export class Preferences {
    theme

    constructor(theme:Theme) {
        this.theme = theme;
    }
}

export function from(file:string) {
    const content = readSync(file);

    const prefObj = JSON.parse(content);

    return new Preferences(
        new Theme(prefObj.theme.file)
    );
}

