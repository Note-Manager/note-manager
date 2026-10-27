# Note Manager

[![CI](https://github.com/Note-Manager/note-manager/actions/workflows/ci.yml/badge.svg)](https://github.com/Note-Manager/note-manager/actions/workflows/ci.yml)

A lightweight, fast and multi-functional desktop text editor for Windows, macOS and Linux. Note Manager is built with Electron, React and TypeScript on top of the [Ace](https://ace.c9.io/) editor.

## Contents

- [Features](#features)
- [Keyboard shortcuts](#keyboard-shortcuts)
- [Supported languages](#supported-languages)
- [Getting started](#getting-started)
- [Building installers](#building-installers)
- [Development](#development)
- [Themes](#themes)
- [User plugins](#user-plugins)
- [Where data is stored](#where-data-is-stored)
- [License](#license)

## Features

**Tabs and sessions**

- Your tabs, including unsaved content, cursor position, scroll position and undo history, are saved automatically and restored on the next start.
- Right-click a tab for Close, Close Other Tabs, Close Unmodified Tabs, Close All Tabs, Pin/Unpin, Open Containing Folder and Reopen Closed Tab.
- Pinned tabs stay at the front and cannot be closed by accident.
- Drag tabs to reorder them.
- Reopen up to 20 recently closed tabs with their content.
- Choose a tab layout: a single scrolling row, wrapped rows, or a vertical list.
- Closing a changed tab or the window asks whether to Save, Don't Save or Cancel.

**Files**

- Open files from the menu, by dropping them on the window, or with "Open with" from your file manager.
- File > Open Recent lists the last 10 files.
- File > Open Containing Folder shows the current file in your file manager.
- A warning is shown before opening very large (50 MB or more) or binary-looking files.
- Large documents stay responsive: heavy editor features are turned off for very large content.
- Only one instance runs at a time; files opened from a second launch go to the existing window.

**Encoding and line endings**

- Files are opened with the right encoding: the BOM first, then UTF-8, then a guess of the character set, and the system code page (ANSI) as the last resort.
- The status bar always shows the line ending (CRLF, LF or CR) and the encoding of the current document. Click the encoding to open the encoding picker, or the line ending to switch it.
- The encoding picker has two modes: **Reopen** reads the file again with the chosen encoding, **Convert** keeps the text and saves it with the chosen encoding. Type to search (for example `1254`, `latin 5` or `cyrillic`), use the arrow keys and Enter, and press Tab to switch modes. It lists UTF-8, UTF-8 with BOM, UTF-16 LE/BE, ANSI and nearly 50 regional character sets.
- The Encoding menu opens the picker in either mode, detects the encoding again, and switches line endings.
- Characters that the target encoding cannot hold are listed before a conversion or a save, so nothing is lost silently.
- Settings > Files sets the line ending and encoding of new files, whether encodings are guessed, and whether plain ASCII files count as UTF-8.

**Editing tools** (Plugins menu)

- **Format**: JSON, XML, HTML, SQL, PL/SQL, JavaScript, TypeScript, CSS, YAML, Markdown and Java (powered by Prettier and dedicated formatters). Formats the selections, or the whole document when nothing is selected.
- **Lines**: sort ascending or descending (natural order), reverse, remove duplicates, remove empty lines, trim trailing whitespace.
- **Case**: UPPERCASE, lowercase, Title Case.
- **Base64**: encode and decode the selection.
- **Preview**: a sanitized live preview for HTML and Markdown.

**Customization**

- A settings page (Preferences > Settings, `Ctrl+,`) for font, font size, word wrap, soft tabs, tab size, invisible characters, line numbers, tab layout, starting maximized and file encoding defaults.
- Every menu shortcut can be changed or removed, with conflict detection.
- Five bundled themes (Dark, Light, Matrix, Orange Dark, Soft Light), plus your own themes whose colors you can edit from the settings page.
- Your own plugins, written in plain JavaScript (see [User plugins](#user-plugins)).

## Keyboard shortcuts

On macOS, use `Cmd` instead of `Ctrl`. All of these can be changed in Settings > Shortcuts.

| Action | Shortcut |
| --- | --- |
| New tab | `Ctrl+N` |
| Open file | `Ctrl+T` |
| Save | `Ctrl+S` |
| Close tab | `Ctrl+W` |
| Reopen closed tab | `Ctrl+Shift+T` |
| Settings | `Ctrl+,` |
| Format | `Ctrl+Shift+F` |
| Sort lines ascending | `Ctrl+Alt+Shift+S` |
| Base64 encode | `Ctrl+Alt+Shift+E` |
| Base64 decode | `Ctrl+Alt+Shift+D` |

The usual editing shortcuts of Ace (multiple cursors, find and replace, go to line, and so on) also work.

## Supported languages

Syntax highlighting is chosen from the file name or extension, and can be changed from the Language menu:

Plain text, JavaScript, TypeScript, JSON, XML, HTML, CSS, YAML, Markdown, Java, Kotlin, C/C++, C#, Go, Rust, Python, Ruby, PHP, SQL, PL/SQL, Shell, Batch, PowerShell, INI, Properties, TOML, Dockerfile and Makefile.

## Getting started

Prerequisites:

- [Node.js](https://nodejs.org/) 22.13 or newer (Node 22 LTS is recommended; CI uses Node 22)
- npm 10 or newer
- Git

```bash
git clone https://github.com/Note-Manager/note-manager
cd note-manager
npm ci
npm start
```

`npm start` runs the app in development mode with hot reload for the user interface.

## Building installers

```bash
npm run package   # packaged app in out/
npm run make      # installers in out/make/
```

`npm run make` builds the installers for the current platform: a Squirrel installer on Windows, DMG and ZIP on macOS, and DEB/RPM packages on Linux. On Debian or Ubuntu, `linux_clean_install.sh` removes an existing installation, builds a new DEB package, installs it and starts the app.

Windows installers are also built by the "Build Windows Installer" workflow on every push to `main`, and a macOS build can be started manually from the "Build and Package Note Manager" workflow.

## Development

| Command | What it does |
| --- | --- |
| `npm start` | Run the app in development mode |
| `npm run lint` | Run ESLint |
| `npm run typecheck` | Run the TypeScript compiler without emitting files |
| `npm test` | Run the unit tests with Vitest |
| `npm run package` | Package the app |
| `npm run make` | Build installers |

The CI workflow runs lint, type check and tests on every push and pull request.

Project layout:

```
src/
  main.ts            main process: window, menus, file access, settings
  preload.js         safe bridge between the window and the main process
  ipc/               main process event handlers
  utils/             menus, files, settings, themes, recent files, user plugins
  domain/            shared types (tabs, settings, languages, editor wrapper)
  react/             user interface (tabs, editor, settings page)
    components/editor/plugins/   bundled plugins
resources/
  Themes/            bundled themes
  Icons/             app icons
```

The user interface has no direct access to Node.js or the file system. Everything that needs it goes through the main process over IPC, and the window runs with context isolation and a Content Security Policy.

## Themes

A theme is a CSS file that sets variables on `:root`, for example:

```css
:root {
    --color: #c9c5cd;
    --primary-bg: #1e1e1e;
    --secondary-bg: #131313;
    --keyword-color: #ea6822;
    --string-color: #0d7a0d;
}
```

See `resources/Themes/Dark.css` for the full list of variables. To make your own theme, use "New theme" in Settings > Appearance, which copies an existing theme, then edit its colors there. You can also put CSS files in the themes folder yourself (Preferences > Theme > Open Themes Folder) and use Preferences > Theme > Reload Themes.

## User plugins

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

## Where data is stored

Note Manager keeps its data in the Electron user data folder:

- Windows: `%APPDATA%\Note Manager`
- macOS: `~/Library/Application Support/Note Manager`
- Linux: `~/.config/Note Manager`

| File or folder | Contents |
| --- | --- |
| `State.json` | Open tabs and their unsaved content |
| `preferences.json` | Settings, theme and shortcuts |
| `RecentFiles.json` | Recently opened files |
| `Themes/` | Your themes |
| `Plugins/` | Your plugins |

If `State.json` is damaged, it is kept as `State.json.corrupt` and the app starts with an empty session.

## License

Note Manager is licensed under the Apache License 2.0. See [LICENSE](LICENSE).
