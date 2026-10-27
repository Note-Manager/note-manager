# Running the project on your machine

- prerequisites
  - a machine with any os that supports node and npm (this guide is based on ubuntu/linux)
  - node (tested on v23.1.0)
  - npm (tested on 10.9.0)
- open your terminal
- clone this repository to your machine:
  - `git clone https://github.com/Note-Manager/note-manager`
- create a folder at root and put plugin-api here
- move to the root directory of this repo:
  - `cd note-manager`
- build the application:
  - `npm install`
- finally, run the application:
  - `npm run start`

# Development scripts

- `npm run lint`: run ESLint
- `npm run typecheck`: run the TypeScript compiler without emitting files
- `npm test`: run the unit tests with Vitest

# User plugins

Note Manager loads plugins from the `Plugins` folder in its user data folder (Plugins > Open Plugins Folder). Each plugin is a folder with a `plugin.json` manifest and a script:

```
Plugins/
  upper-case/
    plugin.json
    plugin.js
```

`plugin.json` names the plugin and lists its actions. Action codes must look like `plugin.action` and must not reuse a code of another plugin. `accelerator` is optional and can be changed later in Settings > Shortcuts. `main` defaults to `plugin.js`.

```json
{
    "name": "Upper Case",
    "version": "1.0.0",
    "main": "plugin.js",
    "actions": [
        {"code": "upperCase.run", "label": "Upper Case Document", "accelerator": "CmdOrCtrl+Alt+U"}
    ]
}
```

The script registers the plugin. `doAction` receives the action code and the active editor; `initialize` is optional and runs whenever an editor is opened.

```js
noteManagerPlugins.register({
    initialize(editor) {
    },
    doAction(code, editor) {
        if (code === "upperCase.run") {
            editor.replaceRange(editor.getFullRange(), editor.getValue().toUpperCase());
        }
    }
});
```

The editor object provides `getValue`, `getSelectedText`, `getLanguage`, `getAllSelectionRanges`, `getSingleSelectionRange`, `getTextRange(range)`, `getFullRange`, `replaceRange(range, text)`, `replaceSelection(text)` and `replaceAllSelectionRanges(text)`.

The actions appear under the Plugins menu. After adding or changing a plugin, use Plugins > Reload User Plugins. Plugins whose manifest is invalid are skipped and the reason is written to the log.

User plugins run inside the editor window with the same access as the editor itself, so only install plugins you trust.
