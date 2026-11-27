const BASE64_PATTERN = /^[A-Za-z0-9+/]*={0,2}$/;
const BASE64_BLOCK_SIZE = 4;
const INVALID_REMAINDER = 1;

export function normalizeBase64(text: string): string | undefined {
    const compact = text.replace(/\s/g, "").replace(/-/g, "+").replace(/_/g, "/");

    if (compact.length === 0 || !BASE64_PATTERN.test(compact)) return undefined;
    if (compact.length % BASE64_BLOCK_SIZE === INVALID_REMAINDER) return undefined;
    if (compact.includes("=") && compact.length % BASE64_BLOCK_SIZE !== 0) return undefined;

    return compact;
}

export function decodeBase64ToBytes(text: string): Uint8Array | undefined {
    const normalized = normalizeBase64(text);

    if (!normalized) return undefined;

    return Uint8Array.from(atob(normalized.padEnd(Math.ceil(normalized.length / BASE64_BLOCK_SIZE) * BASE64_BLOCK_SIZE, "=")), c => c.charCodeAt(0));
}

export function decodeUtf8(bytes: Uint8Array): string | undefined {
    try {
        return new TextDecoder("utf-8", {fatal: true}).decode(bytes);
    } catch {
        return undefined;
    }
}
