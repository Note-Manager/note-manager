import * as electron from "electron";
import {app} from "electron";
import * as path from "node:path";
import fs from "node:fs";
import os from "os";
import {SystemPaths} from "../contants/Enums";

export function readFile(path:string) {
    return fs.readFileSync(path, "utf8");
}

export function writeFile(path:string, content:string) {
    fs.writeFileSync(path, content, {});
}

export function readSync(path:string) {
    return fs.readFileSync(path, "utf8");
}

export function getSystemPath(name:string) {
    if(!name) throw new Error("path name is required");

    switch(name) {
        case SystemPaths.temp:
            return os.tmpdir();
        case SystemPaths.data:
            return app.getPath("userData");
        case SystemPaths.resources:
            return electron.app.isPackaged ? process.resourcesPath : path.join(process.cwd(), "resources");
        default:
            throw new Error("invalid system path: " + name);
    }
}

export function ensureExists(basePath:string, fileName?:string, defaultContent?:string) {
    const filePath = fileName ? path.join(basePath, fileName) : basePath;

    // Check if the base directory exists
    if (!fs.existsSync(filePath)) {
        // Create the directory (recursive to handle nested paths)
        fs.mkdirSync(basePath, { recursive: true });
        console.log(`directory created: ${basePath}`);
    }

    // Check if the file exists
    if(fileName) {
        if (!fs.existsSync(filePath)) {
            // Create an empty file
            fs.writeFileSync(filePath, defaultContent || "");
            console.log(`requested file created: ${filePath}`);
        } else {
            console.log(`requested file found: ${filePath}`);
        }
    }
}

export function readDirectory(path:string, opts = {extensions: []}) {
    return fs.readdirSync(path).filter((f:string) => opts.extensions.some(extension => f.endsWith(extension)));
}