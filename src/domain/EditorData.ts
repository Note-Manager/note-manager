export interface EditorData {
    length: number,
    lineCount: number,
    selection: {
        selectionLength: number,
        selectionRangeCount: number
    },
    openedFile: string
}