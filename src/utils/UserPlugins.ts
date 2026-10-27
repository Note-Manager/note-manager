import * as fs from "node:fs";
import * as path from "node:path";
import {pathToFileURL} from "node:url";
import {net, protocol} from "electron";
import {ensureExists, getSystemPath} from "./FileUtils";
import {EventType, SystemPaths} from "../enums";
import {allPlugins} from "./PluginLoader";
import {
    getPluginScriptUrl,
    PLUGIN_MANIFEST_FILE,
    parsePluginScriptUrl,
    PluginManifest,
    USER_PLUGIN_SCHEME,
    UserPluginInfo,
    validatePluginManifest
} from "../domain/PluginManifest";

let manifests: Array<PluginManifest> = [];

export function getUserPluginPath() {
    return path.join(getSystemPath(SystemPaths.data), "Plugins");
}

export function registerUserPluginScheme() {
    protocol.registerSchemesAsPrivileged([
        {scheme: USER_PLUGIN_SCHEME, privileges: {standard: true, secure: true}}
    ]);
}

export function registerUserPluginProtocol() {
    protocol.handle(USER_PLUGIN_SCHEME, request => {
        const file = resolvePluginScript(request.url);

        if (!file) return new Response("Not found", {status: 404});

        return net.fetch(pathToFileURL(file).toString());
    });
}

export function loadUserPluginManifests(): Array<PluginManifest> {
    const folder = getUserPluginPath();

    ensureExists(folder);

    const bundledCodes = allPlugins.flatMap(p => (p.applicationMenuItems || []).flatMap(item => item.actions.map(a => a.code)));
    const reservedCodes = new Set<string>([...Object.values(EventType), ...bundledCodes]);
    const reservedPrefixes = new Set([
        ...bundledCodes.map(code => code.split(/[._]/)[0].toLowerCase()),
        ...allPlugins.map(p => p.name.replace(/\s+/g, "").toLowerCase()),
    ]);

    const loaded: Array<PluginManifest> = [];

    fs.readdirSync(folder, {withFileTypes: true}).filter(entry => entry.isDirectory()).forEach(entry => {
        const manifestFile = path.join(folder, entry.name, PLUGIN_MANIFEST_FILE);

        if (!fs.existsSync(manifestFile)) return;

        try {
            const usedCodes = new Set([...reservedCodes, ...loaded.flatMap(m => m.actions.map(a => a.code))]);
            const {manifest, errors} = validatePluginManifest(entry.name, JSON.parse(fs.readFileSync(manifestFile, "utf-8")), usedCodes, reservedPrefixes);

            if (!manifest) {
                console.warn(`user plugin '${entry.name}' is skipped: ${errors.join("; ")}`);
                return;
            }

            if (!fs.existsSync(path.join(folder, entry.name, manifest.main))) {
                console.warn(`user plugin '${entry.name}' is skipped: '${manifest.main}' is missing`);
                return;
            }

            loaded.push(manifest);
        } catch (err) {
            console.warn(`user plugin '${entry.name}' is skipped: ${err}`);
        }
    });

    manifests = loaded;

    return manifests;
}

export function getUserPluginManifests(): Array<PluginManifest> {
    return manifests;
}

export function getUserPluginInfos(): Array<UserPluginInfo> {
    return manifests.map(m => ({...m, scriptUrl: getPluginScriptUrl(m)}));
}

function resolvePluginScript(url: string): string | undefined {
    const target = parsePluginScriptUrl(url);

    if (!target) return undefined;

    const manifest = manifests.find(m => m.id === target.id && m.main === target.file);

    if (!manifest) return undefined;

    const folder = path.resolve(getUserPluginPath());
    const file = path.resolve(folder, manifest.id, manifest.main);

    if (!file.startsWith(folder + path.sep) || !fs.existsSync(file)) return undefined;

    return file;
}
