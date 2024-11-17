import * as path from "node:path";
import {readSync} from "../utils/FileUtils";

export class Theme {
    name;
    file;

    constructor(cssFile) {
        const cssPath = path.parse(cssFile);

        this.name = cssPath.name;
        this.file = cssFile;
    }

    getCSSContent() {
        return readSync(this.file);
    }
}