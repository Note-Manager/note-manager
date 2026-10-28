import {EditorAction, EditorMenuItem, EditorPlugin, ToolbarMenuItem} from "./index";
import {EditorWrapper} from "../../../../domain/EditorWrapper";

export abstract class BasePlugin implements EditorPlugin {
    abstract readonly name: string;
    abstract readonly applicationMenuItems: Array<EditorMenuItem>;
    readonly toolbarMenuItems?: Array<ToolbarMenuItem>;

    protected editor?: EditorWrapper;

    get contextMenuItems(): Array<EditorMenuItem> {
        return this.applicationMenuItems;
    }

    initializePlugin(editor: EditorWrapper): void {
        this.editor = editor;
    }

    getAvailableActions(): Array<string> {
        return this.getActions().map(action => action.code);
    }

    doAction(code: string): void {
        if (!this.editor) throw new Error(`Plugin ${this.name} is not initialized`);

        const action = this.getActions().find(a => a.code === code);

        if (!action) throw new Error(`Unsupported action: ${code}`);

        action.perform?.(this.editor);
    }

    private getActions(): Array<EditorAction> {
        return this.applicationMenuItems.flatMap(item => item.actions);
    }
}
