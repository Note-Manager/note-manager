import {resolveAccelerator} from "../domain/Settings";
import {getDefaultAccelerator} from "./Shortcuts";
import {getSettings} from "./EnvironmentUtils";
import {getUserPluginManifests} from "./UserPlugins";

export function getAccelerator(id: string) {
    return resolveAccelerator(getSettings(), id, getDefaultAccelerator(id, getUserPluginManifests()));
}
