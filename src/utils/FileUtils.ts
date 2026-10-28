import {app} from "electron";
import * as path from "node:path";
import fs from "node:fs";
import {SystemPaths} from "../enums";

export function writeFile(filePath: string, content: string | Uint8Array) {
    fs.writeFileSync(filePath, content);
}

export function writeFileAtomic(filePath: string, content: string) {
    const tempFile = `${filePath}.${process.pid}.tmp`;

    const fd = fs.openSync(tempFile, "w");
    try {
        fs.writeFileSync(fd, content);
        fs.fsyncSync(fd);
    } finally {
        fs.closeSync(fd);
    }

    try {
        fs.renameSync(tempFile, filePath);
    } catch (err) {
        fs.writeFileSync(filePath, content);
        fs.rmSync(tempFile, {force: true});
    }
}

export function backupFile(filePath: string, suffix: string) {
    if (!fs.existsSync(filePath)) return;

    fs.copyFileSync(filePath, `${filePath}.${suffix}`);
}

export async function readFileAsync(filePath: string) {
    return fs.promises.readFile(filePath, "utf8");
}

export async function readFileBytes(filePath: string) {
    return fs.promises.readFile(filePath);
}

export async function getFileSize(filePath: string) {
    return (await fs.promises.stat(filePath)).size;
}

export async function isBinaryFile(filePath: string) {
    const handle = await fs.promises.open(filePath, "r");

    try {
        const buffer = Buffer.alloc(8000);
        const {bytesRead} = await handle.read(buffer, 0, buffer.length, 0);
        const content = buffer.subarray(0, bytesRead);

        if (bytesRead >= 2 && ((content[0] === 0xFF && content[1] === 0xFE) || (content[0] === 0xFE && content[1] === 0xFF))) return false;

        return content.includes(0);
    } finally {
        await handle.close();
    }
}

export function readSync(filePath: string) {
    return fs.readFileSync(filePath, "utf8");
}

export function getSystemPath(name: string) {
    if (!name) throw new Error("path name is required");

    switch (name) {
        case SystemPaths.data:
            return app.getPath("userData");
        case SystemPaths.resources:
            return app.isPackaged ? process.resourcesPath : path.join(process.cwd(), "resources");
        default:
            throw new Error("invalid system path: " + name);
    }
}

export function ensureExists(basePath: string, fileName?: string, defaultContent?: string) {
    const filePath = fileName ? path.join(basePath, fileName) : basePath;

    if (!fs.existsSync(filePath)) {
        fs.mkdirSync(basePath, {recursive: true});
    }

    if (fileName) {
        if (!fs.existsSync(filePath)) {
            fs.writeFileSync(filePath, defaultContent || "");
        }
    }
}

export function isFileExists(filePath: string) {
    return fs.existsSync(filePath);
}