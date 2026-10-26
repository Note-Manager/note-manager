import {EditorPlugin} from "../react/components/editor/plugins";
import Base64Plugin from "../react/components/editor/plugins/Base64Plugin";
import BeautifyPlugin from "../react/components/editor/plugins/BeautifyPlugin";
import PreviewPlugin from "../react/components/editor/plugins/PreviewPlugin";
import TextToolsPlugin from "../react/components/editor/plugins/TextToolsPlugin";

export const bundledPlugins: Array<EditorPlugin> = [
    new Base64Plugin(),
    new BeautifyPlugin(),
    new PreviewPlugin(),
    new TextToolsPlugin()
];

export const userPlugins: Array<EditorPlugin> = [

];

export const allPlugins: Array<EditorPlugin> = bundledPlugins.concat(userPlugins);