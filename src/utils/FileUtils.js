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
        case "tempDir":
            return os.tmpdir();
    }
}

export function readDirectory(path, opts = {extensions: []}) {
    return fs.readdirSync(path).filter(f => opts.extensions.some(extension => f.endsWith(extension)));
}