import {EditorMenuItem} from "./index";
import {BasePlugin} from "./BasePlugin";
import {transformSelections} from "../../../../utils/EditorTransforms";

enum Keys {
    ENCODE = "base64.encode",
    DECODE = "base64.decode",
}

const CHUNK_SIZE = 0x8000;

export default class Base64Plugin extends BasePlugin {
    readonly name = "Base64";

    readonly applicationMenuItems: Array<EditorMenuItem> = [
        {
            label: "Base64",
            actions: [
                {label: "Encode", code: Keys.ENCODE, accelerator: "CmdOrCtrl+Alt+Shift+E", perform: editor => transformSelections(editor, encode)},
                {label: "Decode", code: Keys.DECODE, accelerator: "CmdOrCtrl+Alt+Shift+D", perform: editor => transformSelections(editor, decode)},
            ]
        }
    ];
}

function encode(text: string): string {
    const bytes = new TextEncoder().encode(text);
    let binary = "";

    for (let i = 0; i < bytes.length; i += CHUNK_SIZE) {
        binary += String.fromCharCode(...bytes.subarray(i, i + CHUNK_SIZE));
    }

    return btoa(binary);
}

function decode(text: string): string {
    const binary = atob(text.replace(/\s/g, ""));

    return new TextDecoder().decode(Uint8Array.from(binary, c => c.charCodeAt(0)));
}
