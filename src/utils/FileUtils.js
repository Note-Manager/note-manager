import * as fs from "node:fs";
const os = require('os');

export function readFile(path) {
    return fs.readFileSync(path, "utf8");
}

export function readSync(path) {
    return fs.readFileSync(path, "utf8");
}

export function getSystemPath(name) {
    if(!name) throw new Error("path name is required");

    switch(name) {
        case "tempDir":
            return os.tmpdir();
    }
}