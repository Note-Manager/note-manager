let revision = 0;

export function markStateChanged() {
    revision++;
}

export function getStateRevision() {
    return revision;
}
