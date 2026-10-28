const encoder = new TextEncoder();

export async function hash(content:string) {
    const data = encoder.encode(content);

    const hashBuffer = await crypto.subtle.digest("SHA-256", data);

    return Array.from(new Uint8Array(hashBuffer))
        .map(b => b.toString(16).padStart(2, "0"))
        .join("");
}

export async function documentHash(content: string, encoding?: string, eol?: string) {
    return hash((encoding || "") + "\u0000" + (eol || "") + "\u0000" + content);
}

export function getFileName(filePath: string): string {
    return filePath.split(/[\\/]/).pop() || filePath;
}

const MAX_TAB_NAME_LENGTH = 28;
const ELLIPSIS = "...";

export function shortenTabName(name: string): string {
    return name.length > MAX_TAB_NAME_LENGTH
        ? name.substring(0, MAX_TAB_NAME_LENGTH - ELLIPSIS.length) + ELLIPSIS
        : name;
}