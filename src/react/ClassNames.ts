export function classNames(...names: Array<string | false | undefined>) {
    return names.filter(Boolean).join(" ");
}
