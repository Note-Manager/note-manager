import {EditorTab} from "./EditorTab";

export interface EditorState {
    tabs: Array<EditorTab>;
    activeTabId?: string;
}