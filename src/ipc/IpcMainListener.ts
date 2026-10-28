import {registerFileHandlers} from "./FileHandlers";
import {registerDialogHandlers} from "./DialogHandlers";
import {registerContextMenuHandlers} from "./ContextMenuHandlers";
import {registerSettingsHandlers} from "./SettingsHandlers";
import {registerStateHandlers} from "./StateHandlers";
import {registerLoggingHandlers} from "./LoggingEventHandlers";

export default function initIpcMainListeners() {
    registerLoggingHandlers();
    registerFileHandlers();
    registerDialogHandlers();
    registerContextMenuHandlers();
    registerSettingsHandlers();
    registerStateHandlers();
}
