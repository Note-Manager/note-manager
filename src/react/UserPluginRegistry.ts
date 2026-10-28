import {EditorPlugin} from "./components/editor/plugins";
import {EditorWrapper} from "../domain/EditorWrapper";
import {UserPluginInfo} from "../domain/PluginManifest";
import {fireEvent} from "./ApplicationEvents";
import {EventType} from "../enums";

export interface UserPluginImplementation {
    initialize?: (editor: EditorWrapper) => void,
    doAction: (code: string, editor: EditorWrapper) => void,
}

declare global {
    interface Window {
        noteManagerPlugins: {
            register: (implementation: UserPluginImplementation) => void,
        };
    }
}

const SCRIPT_ATTRIBUTE = "data-user-plugin";

const implementations = new Map<string, UserPluginImplementation>();
const listeners = new Set<() => void>();

let pluginInfos: Array<UserPluginInfo> = [];
let userPlugins: Array<EditorPlugin> = [];

export function installUserPluginApi() {
    window.noteManagerPlugins = {
        register: (implementation: UserPluginImplementation) => {
            const id = (document.currentScript as HTMLScriptElement | null)?.getAttribute(SCRIPT_ATTRIBUTE);

            if (!id || !pluginInfos.some(p => p.id === id)) {
                console.error("noteManagerPlugins.register must be called while a user plugin script is loading");
                return;
            }

            if (typeof implementation?.doAction !== "function") {
                logError(`user plugin '${id}' did not provide a doAction function`);
                return;
            }

            implementations.set(id, implementation);

            rebuildUserPlugins();
        }
    };
}

export async function loadUserPlugins() {
    document.querySelectorAll(`script[${SCRIPT_ATTRIBUTE}]`).forEach(script => script.remove());

    implementations.clear();

    pluginInfos = await fireEvent(EventType.GET_USER_PLUGINS) || [];

    rebuildUserPlugins();

    pluginInfos.forEach(info => {
        const script = document.createElement("script");

        script.src = info.scriptUrl + "?t=" + Date.now();
        script.setAttribute(SCRIPT_ATTRIBUTE, info.id);
        script.onerror = () => logError(`cannot load user plugin '${info.id}'`);

        document.head.appendChild(script);
    });
}

export function getUserPlugins(): Array<EditorPlugin> {
    return userPlugins;
}

export function onUserPluginsChanged(listener: () => void) {
    listeners.add(listener);

    return () => {
        listeners.delete(listener);
    };
}

function rebuildUserPlugins() {
    userPlugins = pluginInfos.filter(info => implementations.has(info.id)).map(info => createPlugin(info, implementations.get(info.id) as UserPluginImplementation));

    listeners.forEach(listener => listener());
}

function createPlugin(info: UserPluginInfo, implementation: UserPluginImplementation): EditorPlugin {
    let editor: EditorWrapper | undefined;

    const menuItems = [{label: info.name, actions: info.actions.map(a => ({label: a.label, code: a.code, accelerator: a.accelerator}))}];

    return {
        name: info.name,
        applicationMenuItems: menuItems,
        contextMenuItems: menuItems,
        initializePlugin: (wrapper: EditorWrapper) => {
            editor = wrapper;

            try {
                implementation.initialize?.(wrapper);
            } catch (err) {
                logError(`user plugin '${info.id}' failed to initialize: ${err}`);
            }
        },
        getAvailableActions: () => info.actions.map(a => a.code),
        doAction: (code: string) => {
            if (!editor) return;

            try {
                implementation.doAction(code, editor);
            } catch (err) {
                logError(`user plugin '${info.id}' failed on '${code}': ${err}`);
            }
        },
    };
}

function logError(message: string) {
    console.error(message);
    fireEvent(EventType.LOG_ERROR, message).catch(() => undefined);
}
