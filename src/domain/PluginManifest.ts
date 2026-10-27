import {isValidAccelerator} from "./Settings";

export const USER_PLUGIN_SCHEME = "nm-plugin";
export const PLUGIN_MANIFEST_FILE = "plugin.json";

export interface PluginManifestAction {
    code: string,
    label: string,
    accelerator?: string,
}

export interface PluginManifest {
    id: string,
    name: string,
    version?: string,
    main: string,
    actions: Array<PluginManifestAction>,
}

export interface UserPluginInfo extends PluginManifest {
    scriptUrl: string,
}

const ACTION_CODE = /^[A-Za-z0-9_-]+(\.[A-Za-z0-9_-]+)+$/;
const PLUGIN_ID = /^[A-Za-z0-9][A-Za-z0-9 ._-]{0,63}$/;
const SCRIPT_FILE = /^[A-Za-z0-9_-][A-Za-z0-9 ._-]*\.js$/;

export function validatePluginManifest(id: string, raw: any, reservedCodes: Set<string>, reservedPrefixes: Set<string> = new Set()): {manifest?: PluginManifest, errors: Array<string>} {
    const errors: Array<string> = [];

    if (!PLUGIN_ID.test(id)) errors.push("invalid plugin folder name: " + id);

    const name = typeof raw?.name === "string" ? raw.name.trim() : "";
    if (!name || name.length > 60) errors.push("'name' must be a text of 1 to 60 characters");

    const main = typeof raw?.main === "string" ? raw.main : "plugin.js";
    if (!SCRIPT_FILE.test(main)) errors.push("'main' must be a .js file in the plugin folder");

    const actions: Array<PluginManifestAction> = [];

    if (!Array.isArray(raw?.actions) || raw.actions.length === 0) {
        errors.push("'actions' must list at least one action");
    } else {
        raw.actions.forEach((action: any, index: number) => {
            const code = action?.code;
            const label = typeof action?.label === "string" ? action.label.trim() : "";

            if (typeof code !== "string" || !ACTION_CODE.test(code)) {
                errors.push(`action ${index + 1}: 'code' must look like 'plugin.action'`);
            } else if (reservedCodes.has(code) || reservedPrefixes.has(code.split(".")[0].toLowerCase()) || actions.some(a => a.code === code)) {
                errors.push(`action ${index + 1}: code '${code}' is already used`);
            }

            if (!label || label.length > 60) errors.push(`action ${index + 1}: 'label' must be a text of 1 to 60 characters`);

            if (action?.accelerator !== undefined && !isValidAccelerator(action.accelerator)) {
                errors.push(`action ${index + 1}: '${action.accelerator}' is not a valid accelerator`);
            }

            actions.push({code: code, label: label, accelerator: action?.accelerator});
        });
    }

    if (errors.length > 0) return {errors: errors};

    return {
        manifest: {
            id: id,
            name: name,
            version: typeof raw?.version === "string" ? raw.version : undefined,
            main: main,
            actions: actions,
        },
        errors: [],
    };
}

export function getPluginScriptUrl(manifest: PluginManifest): string {
    return `${USER_PLUGIN_SCHEME}://plugins/${encodeURIComponent(manifest.id)}/${encodeURIComponent(manifest.main)}`;
}

export function parsePluginScriptUrl(url: string): {id: string, file: string} | undefined {
    try {
        const parsed = new URL(url);

        if (parsed.protocol !== USER_PLUGIN_SCHEME + ":" || parsed.hostname !== "plugins") return undefined;

        const parts = parsed.pathname.split("/").filter(p => p.length > 0).map(decodeURIComponent);

        if (parts.length !== 2 || !PLUGIN_ID.test(parts[0]) || !SCRIPT_FILE.test(parts[1])) return undefined;

        return {id: parts[0], file: parts[1]};
    } catch (ignored) {
        return undefined;
    }
}
