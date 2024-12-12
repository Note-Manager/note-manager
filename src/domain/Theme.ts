import * as path from "node:path";
import {readSync} from "../utils/FileUtils";

export interface ITheme {
    name:string,
    file:string
}

export class Theme implements ITheme {
    name;
    file;

    constructor(cssFile:string) {
        const cssPath = path.parse(cssFile);

        this.name = cssPath.name;
        this.file = cssFile;
    }

    getCSSContent() {
        return readSync(this.file);
    }
}