import * as fs from "node:fs";
import * as os from 'os';

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