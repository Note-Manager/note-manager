import {EditorPlugin, ToolbarMenuItem} from "../react/components/editor/plugins";
import Base64Plugin from "../react/components/editor/plugins/Base64Plugin";
import BeautifyPlugin from "../react/components/editor/plugins/BeautifyPlugin";
import PreviewPlugin from "../react/components/editor/plugins/PreviewPlugin";
import TextToolsPlugin from "../react/components/editor/plugins/TextToolsPlugin";

const previewPlugin = new PreviewPlugin();

export const bundledPlugins: Array<EditorPlugin> = [
    new Base64Plugin(),
    new BeautifyPlugin(),
    previewPlugin,
    new TextToolsPlugin()
];

export const toolbarItems: Array<ToolbarMenuItem> = bundledPlugins.flatMap(plugin => plugin.toolbarMenuItems || []);

export const previewTool: ToolbarMenuItem = previewPlugin.toolbarMenuItems[0];
