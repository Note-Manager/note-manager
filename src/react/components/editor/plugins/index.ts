import {EditorWrapper} from "../../../../domain/EditorWrapper";

export interface EditorPlugin {
    name: string,
    contextMenuItems?: Array<EditorMenuItem>,
    applicationMenuItems?: Array<EditorMenuItem>,
    toolbarMenuItems?: Array<ToolbarMenuItem>,
    initializePlugin: (editor: EditorWrapper) => void,
    getAvailableActions: () => Array<string>,
    doAction: (code: string) => void,
}

export interface EditorMenuItem {
    label: string,
    actions: Array<EditorAction>
}

export interface EditorAction {
    label: string,
    code: string,
    perform?: (editor: EditorWrapper) => void
    accelerator?: string,
}

export interface ToolbarMenuItem {
    label: string,
    icon: string,
    onContentMount?: (parent: ShadowRoot) => void,
    getToolbarWindowContent: () => string
}