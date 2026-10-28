export function logError(context?: string) {
    return (err: unknown) => console.error(context ? `${context}: ${err}` : err);
}
