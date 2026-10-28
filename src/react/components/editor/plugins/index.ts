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
    isAvailable?: (editor: EditorWrapper) => boolean,
}

export interface ContextMenuGroup {
    label: string,
    actions: Array<{label: string, code: string, enabled: boolean}>
}

export interface ToolWindowContext {
    filePath?: string,
    language?: string,
}

export interface ToolbarMenuItem {
    label: string,
    icon: string,
    onContentMount?: (parent: ShadowRoot, context: ToolWindowContext) => void,
    getToolbarWindowContent: () => string
}