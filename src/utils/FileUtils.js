import {app} from "electron";
import {SystemPaths} from "../contants/Enums";
import * as path from "node:path";

const fs = require("node:fs");
const os = require("os");

export function readFile(path) {
    return fs.readFileSync(path, "utf8");
}

export function writeFile(path, content) {
    fs.writeFileSync(path, content, {});
}

export function readSync(path) {
    return fs.readFileSync(path, "utf8");
}

export function getSystemPath(name) {
    if(!name) throw new Error("path name is required");

    switch(name) {
        case SystemPaths.temp:
            return os.tmpdir();
        case SystemPaths.data:
            return app.getPath("userData");
    }
}

export function ensureExists(basePath, fileName, defaultContent) {
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

export function readDirectory(path, opts = {extensions: []}) {
    return fs.readdirSync(path).filter(f => opts.extensions.some(extension => f.endsWith(extension)));
}