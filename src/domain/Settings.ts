import {DEFAULT_ENCODING, EolType, getSystemDefaultEol, isKnownEncoding, isKnownEol} from "./Encoding";

export enum TabLayout {
    SCROLL = "scroll",
    WRAP = "wrap",
    VERTICAL = "vertical",
}

export interface EditorSettings {
    fontFamily: string,
    fontSize: number,
    wrap: boolean,
    useSoftTabs: boolean,
    tabSize: number,
    showInvisibles: boolean,
    showLineNumbers: boolean,
}

export interface InterfaceSettings {
    tabLayout: TabLayout,
    startMaximized: boolean,
}

export interface FileSettings {
    defaultEncoding: string,
    defaultEol: EolType,
    asciiAsUtf8: boolean,
    autodetectEncoding: boolean,
}

export interface Settings {
    editor: EditorSettings,
    ui: InterfaceSettings,
    files: FileSettings,
    keyBindings: Record<string, string>,
}

export const FONT_SIZE_RANGE = {min: 8, max: 40};
export const TAB_SIZE_RANGE = {min: 1, max: 8};

export const DEFAULT_SETTINGS: Settings = {
    editor: {
        fontFamily: "Courier New",
        fontSize: 16,
        wrap: false,
        useSoftTabs: false,
        tabSize: 4,
        showInvisibles: false,
        showLineNumbers: true,
    },
    ui: {
        tabLayout: TabLayout.SCROLL,
        startMaximized: false,
    },
    files: {
        defaultEncoding: DEFAULT_ENCODING,
        defaultEol: getSystemDefaultEol(),
        asciiAsUtf8: true,
        autodetectEncoding: true,
    },
    keyBindings: {},
};

const MODIFIERS = ["CmdOrCtrl", "CommandOrControl", "Ctrl", "Control", "Cmd", "Command", "Alt", "Option", "AltGr", "Shift", "Super", "Meta"];
const NAMED_KEYS = ["Plus", "Space", "Tab", "Backspace", "Delete", "Insert", "Return", "Enter", "Up", "Down", "Left", "Right", "Home", "End", "PageUp", "PageDown", "Escape", "Esc"];
const FUNCTION_KEY = /^F([1-9]|1[0-9]|2[0-4])$/;
const CHARACTER_KEY = /^[A-Z0-9)!@#$%^&*(:;<=>?~`{|}"'\\,./[\]_-]$/;

const CODE_KEYS: Record<string, string> = {
    Comma: ",", Period: ".", Slash: "/", Semicolon: ";", Quote: "'", BracketLeft: "[", BracketRight: "]",
    Backslash: "\\", Minus: "-", Equal: "=", Backquote: "`", Space: "Space", Tab: "Tab", Enter: "Enter",
    NumpadEnter: "Enter", Backspace: "Backspace", Delete: "Delete", Insert: "Insert", Home: "Home", End: "End",
    PageUp: "PageUp", PageDown: "PageDown", ArrowUp: "Up", ArrowDown: "Down", ArrowLeft: "Left", ArrowRight: "Right",
};

export function isValidAccelerator(accelerator: string): boolean {
    if (typeof accelerator !== "string" || !accelerator) return false;

    const parts = accelerator.split("+");
    const key = parts.pop() || "";

    if (parts.some(p => !MODIFIERS.includes(p)) || new Set(parts).size !== parts.length) return false;

    if (FUNCTION_KEY.test(key)) return true;

    return parts.length > 0 && (NAMED_KEYS.includes(key) || CHARACTER_KEY.test(key));
}

export function keyEventToAccelerator(event: {code: string, ctrlKey: boolean, metaKey: boolean, altKey: boolean, shiftKey: boolean}): string | undefined {
    let key: string | undefined;

    if (/^Key[A-Z]$/.test(event.code)) key = event.code.substring(3);
    else if (/^(Digit|Numpad)[0-9]$/.test(event.code)) key = event.code.slice(-1);
    else if (FUNCTION_KEY.test(event.code)) key = event.code;
    else key = CODE_KEYS[event.code];

    if (!key) return undefined;

    const modifiers = [];

    if (event.ctrlKey || event.metaKey) modifiers.push("CmdOrCtrl");
    if (event.altKey) modifiers.push("Alt");
    if (event.shiftKey) modifiers.push("Shift");

    const accelerator = [...modifiers, key].join("+");

    return isValidAccelerator(accelerator) ? accelerator : undefined;
}

export function resolveAccelerator(settings: Settings | undefined, id: string, defaultAccelerator?: string): string | undefined {
    const custom = settings?.keyBindings?.[id];

    if (custom === undefined) return defaultAccelerator;

    return custom || undefined;
}

export function getDetectionOptions(settings: Settings | undefined) {
    const files = settings?.files || DEFAULT_SETTINGS.files;

    return {
        asciiAsUtf8: files.asciiAsUtf8,
        autodetect: files.autodetectEncoding,
    };
}

export function findShortcutConflicts(shortcuts: Array<{id: string, accelerator?: string}>): Set<string> {
    const byAccelerator = new Map<string, Array<string>>();

    shortcuts.forEach(s => {
        if (!s.accelerator) return;

        const key = s.accelerator.toLowerCase().replace(/commandorcontrol|cmdorctrl/, "cmdorctrl");

        byAccelerator.set(key, [...(byAccelerator.get(key) || []), s.id]);
    });

    return new Set([...byAccelerator.values()].filter(ids => ids.length > 1).flat());
}

export function normalizeSettings(raw: any): Settings {
    const editor = raw?.editor || {};
    const ui = raw?.ui || {};
    const files = raw?.files || {};
    const defaults = DEFAULT_SETTINGS;

    const keyBindings: Record<string, string> = {};

    if (raw?.keyBindings && typeof raw.keyBindings === "object") {
        Object.entries(raw.keyBindings).forEach(([id, accelerator]) => {
            if (typeof accelerator === "string" && (accelerator === "" || isValidAccelerator(accelerator))) keyBindings[id] = accelerator;
        });
    }

    return {
        editor: {
            fontFamily: typeof editor.fontFamily === "string" && editor.fontFamily.trim() ? editor.fontFamily.trim().substring(0, 200) : defaults.editor.fontFamily,
            fontSize: clampNumber(editor.fontSize, FONT_SIZE_RANGE.min, FONT_SIZE_RANGE.max, defaults.editor.fontSize),
            wrap: toBoolean(editor.wrap, defaults.editor.wrap),
            useSoftTabs: toBoolean(editor.useSoftTabs, defaults.editor.useSoftTabs),
            tabSize: clampNumber(editor.tabSize, TAB_SIZE_RANGE.min, TAB_SIZE_RANGE.max, defaults.editor.tabSize),
            showInvisibles: toBoolean(editor.showInvisibles, defaults.editor.showInvisibles),
            showLineNumbers: toBoolean(editor.showLineNumbers, defaults.editor.showLineNumbers),
        },
        ui: {
            tabLayout: Object.values(TabLayout).includes(ui.tabLayout) ? ui.tabLayout : defaults.ui.tabLayout,
            startMaximized: toBoolean(ui.startMaximized, defaults.ui.startMaximized),
        },
        files: {
            defaultEncoding: isKnownEncoding(files.defaultEncoding) ? files.defaultEncoding : defaults.files.defaultEncoding,
            defaultEol: isKnownEol(files.defaultEol) ? files.defaultEol : defaults.files.defaultEol,
            asciiAsUtf8: toBoolean(files.asciiAsUtf8, defaults.files.asciiAsUtf8),
            autodetectEncoding: toBoolean(files.autodetectEncoding, defaults.files.autodetectEncoding),
        },
        keyBindings: keyBindings,
    };
}

function clampNumber(value: any, min: number, max: number, fallback: number) {
    const number = Number(value);

    if (value === null || value === "" || !Number.isFinite(number)) return fallback;

    return Math.min(max, Math.max(min, Math.round(number)));
}

function toBoolean(value: any, fallback: boolean) {
    return typeof value === "boolean" ? value : fallback;
}
