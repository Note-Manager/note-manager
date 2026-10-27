export interface ThemeVariable {
    name: string,
    value: string,
}

const VARIABLE_DECLARATION = /(--[A-Za-z0-9_-]+)\s*:\s*([^;{}]*);/g;

export function parseThemeVariables(css: string): Array<ThemeVariable> {
    const root = findRootBlock(css);

    if (!root) return [];

    return [...root.body.matchAll(VARIABLE_DECLARATION)].map(m => ({name: m[1], value: m[2].trim()}));
}

export function isValidVariableValue(value: string): boolean {
    return typeof value === "string" && value.trim().length > 0 && !/[;{}<>]|\/\*|\*\//.test(value);
}

export function updateThemeVariables(css: string, values: Record<string, string>): string {
    const root = findRootBlock(css);

    if (!root) return css;

    const body = root.body.replace(VARIABLE_DECLARATION, (declaration, name: string) => {
        const newValue = values[name];

        if (newValue === undefined || !isValidVariableValue(newValue)) return declaration;

        return `${name}: ${newValue.trim()};`;
    });

    return css.substring(0, root.start) + body + css.substring(root.end);
}

export function isValidThemeName(name: string): boolean {
    return typeof name === "string" && /^[A-Za-z0-9][A-Za-z0-9 _-]{0,49}$/.test(name);
}

function findRootBlock(css: string) {
    const match = /:root\s*\{/.exec(css);

    if (!match) return undefined;

    const start = match.index + match[0].length;
    const end = css.indexOf("}", start);

    if (end < 0) return undefined;

    return {start: start, end: end, body: css.substring(start, end)};
}
