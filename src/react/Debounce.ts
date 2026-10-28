export function createDebouncer(delay: number) {
    let timer: ReturnType<typeof setTimeout> | undefined;

    return (task: () => void) => {
        clearTimeout(timer);
        timer = setTimeout(task, delay);
    };
}
