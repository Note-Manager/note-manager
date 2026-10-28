import {createRequire} from "node:module";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import {promisify} from "node:util";
import {afterEach, beforeEach, describe, expect, it} from "vitest";

const require = createRequire(import.meta.url);
const glob = promisify(require("./glob"));
const rimraf = require("./rimraf");

let root;

beforeEach(() => {
    root = fs.mkdtempSync(path.join(os.tmpdir(), "shims-"));
    fs.mkdirSync(path.join(root, "app.app", "Contents", "Resources"), {recursive: true});
    fs.writeFileSync(path.join(root, "note.deb"), "");
});

afterEach(() => fs.rmSync(root, {recursive: true, force: true}));

describe("glob shim", () => {
    it("matches relative to cwd", async () => {
        expect(await glob("*.app/Contents/Resources", {cwd: root})).toEqual([path.join("app.app", "Contents", "Resources")]);
    });

    it("matches absolute patterns without options", async () => {
        expect(await glob(path.join(root, "*.deb"))).toEqual([path.join(root, "note.deb")]);
    });
});

describe("rimraf shim", () => {
    it("removes a directory tree with a callback", async () => {
        await promisify(rimraf)(path.join(root, "app.app"), {maxBusyTries: 6});
        expect(fs.existsSync(path.join(root, "app.app"))).toBe(false);
    });

    it("removes a directory tree synchronously", () => {
        rimraf.sync(root, {maxBusyTries: 6});
        expect(fs.existsSync(root)).toBe(false);
    });
});
