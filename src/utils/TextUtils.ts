const encoder = new TextEncoder();

export async function hash(content:string) {
    const data = encoder.encode(content);

    const hashBuffer = await crypto.subtle.digest("SHA-256", data);

    return Array.from(new Uint8Array(hashBuffer))
        .map(b => b.toString(16).padStart(2, "0"))
        .join("");
}

export function shortenTabName(name: string): string {
    return (name?.length || 0) > 28
        ? (name?.substring(0, 25) + "...")
        : name;
}