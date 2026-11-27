import {EditorMenuItem} from "./index";
import {BasePlugin} from "./BasePlugin";
import {getNonEmptySelections, transformSelections} from "../../../../utils/EditorTransforms";
import {EditorWrapper} from "../../../../domain/EditorWrapper";
import {decodeBase64ToBytes, decodeUtf8} from "../../../../domain/Base64";
import {EventType} from "../../../../enums";
import {fireEvent} from "../../../ApplicationEvents";
import {logError} from "../../../../utils/Log";

enum Keys {
    ENCODE = "base64.encode",
    DECODE = "base64.decode",
    DECODE_TO_FILE = "base64.decodeToFile",
}

const CHUNK_SIZE = 0x8000;

export default class Base64Plugin extends BasePlugin {
    readonly name = "Base64";

    readonly applicationMenuItems: Array<EditorMenuItem> = [
        {
            label: "Base64",
            actions: [
                {label: "Encode", code: Keys.ENCODE, accelerator: "CmdOrCtrl+Alt+Shift+E", perform: editor => transformSelections(editor, encode)},
                {label: "Decode", code: Keys.DECODE, accelerator: "CmdOrCtrl+Alt+Shift+D", perform: decodeSelections},
                {label: "Decode to File...", code: Keys.DECODE_TO_FILE, perform: editor => saveDecodedFile(readSelectionsOrDocument(editor))},
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

function decodeSelections(editor: EditorWrapper) {
    const undecoded: Array<{text: string, isNotText: boolean}> = [];

    transformSelections(editor, text => {
        const bytes = decodeBase64ToBytes(text);
        const decoded = bytes && decodeUtf8(bytes);

        if (decoded !== undefined) return decoded;

        undecoded.push({text, isNotText: !!bytes});

        return text;
    });

    const [first] = undecoded;

    if (first) saveDecodedFile(first.text, first.isNotText);
}

function readSelectionsOrDocument(editor: EditorWrapper): string {
    const ranges = getNonEmptySelections(editor);

    if (ranges.length === 0) return editor.getValue();

    return ranges.map(range => editor.getTextRange(range)).join("\n");
}

function saveDecodedFile(content: string, isNotText = false) {
    fireEvent(EventType.DECODE_BASE64_TO_FILE, {content, isNotText}).catch(logError("cannot save the decoded file"));
}
