export function requireFile(data: {file?: unknown} | undefined): string {
    if (typeof data?.file !== "string" || !data.file) throw new Error("file is required");

    return data.file;
}

export function optionalFile(data: {file?: unknown} | undefined): string | undefined {
    return typeof data?.file === "string" && data.file ? data.file : undefined;
}
