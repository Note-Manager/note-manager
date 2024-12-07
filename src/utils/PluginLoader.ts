import {EditorPlugin} from "../react/components/editor/plugins";
import Base64Plugin from "../react/components/editor/plugins/Base64Plugin";

export const bundledPlugins: Array<EditorPlugin> = [
    new Base64Plugin()
];

export const userPlugins: Array<EditorPlugin> = [

];

export const allPlugins: Array<EditorPlugin> = bundledPlugins.concat(userPlugins);