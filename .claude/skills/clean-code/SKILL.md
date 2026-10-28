---
name: clean-code
description: Note Manager code standards. Use for ANY code change or code review in Note Manager (main process, renderer, plugins, IPC, tests): where code belongs, which shared helpers to reuse, naming and style rules, public API limits and the checks to run before handing over.
---

# Note Manager clean code

Every change must leave the code readable, free of duplication and with one clear place for each responsibility. Read this before writing code, and check the diff against it before handing over.

## Non-negotiables

- No code comments (no `//`, `/* */` or JSDoc), in code or CSS. The code must explain itself through names and small functions. Theme files in `resources/Themes` are user-facing data and may keep their section comments.
- Style is enforced by ESLint (`@stylistic`): double quotes, 4-space indent, semicolons, `if (` / `for (` spacing, no trailing spaces, at most one blank line. Run `npx eslint --fix .` instead of formatting by hand.
- Keep each file's line endings (most files are LF in the index; a few are CRLF, check with `git ls-files --eol`).
- No dead code: remove unused functions, exports, props, enum values and parameters in the same change that makes them unused.
- No `any` except at untrusted-input boundaries (settings, manifests); prefer `unknown` and narrow it.
- No magic numbers or repeated literals: name them as `UPPER_SNAKE` constants next to their use.
- No noisy `console.log`. Log errors with `logError(context)` from `src/utils/Log.ts`.

## Where code belongs

| Concern | Place |
|---|---|
| Pure data types and validation shared by both processes | `src/domain/` (no Node or Electron imports at runtime) |
| IPC channel names | `EventType` in `src/enums/index.ts`, kebab-case |
| IPC payload and response types | `src/domain/IpcContract.ts` |
| Main-process IPC handlers | `src/ipc/<Area>Handlers.ts`, registered in `IpcMainListener.ts` |
| Application menu | `src/utils/ApplicationMenu.ts` |
| Theme injection / theme files / preferences | `ThemeLoader.ts` / `ThemeStore.ts` / `EnvironmentUtils.ts` |
| Window messaging, in-app message dialogs and notices from main, menu popups | `src/utils/WindowUtils.ts` |
| Dialog and notice texts and actions | `src/utils/DialogUtils.ts` (pure, tested, no Node imports so the renderer can use it) |
| Dialog and notice types, result and button order | `src/domain/Dialog.ts` |
| Renderer dialog and notice store | `src/react/Dialogs.ts`, rendered by `DialogHost` |
| Tab creation and tab helpers | `src/utils/TabUtils.ts` |
| Renderer logic | hooks in `src/react/hooks/` |
| Renderer UI | components in `src/react/components/` render only; logic goes to hooks |
| Bundled plugins | extend `BasePlugin` in `src/react/components/editor/plugins/` |

One module, hook or component has one responsibility. When a file starts doing two things (for example building a menu and injecting CSS), split it.

## Reuse before writing

Search for an existing helper before writing a new one. Extract a helper the second time the same code appears.

- IPC in the renderer: `useIpcEvents({[EventType.X]: data => ...}, deps)` to listen, `fireEvent(EventType.X, payload)` to invoke. Never pair `on`/`off` by hand in a component.
- IPC in main: `handle(EventType.X, (event, data) => ...)` from `src/ipc/IpcMain.ts` (typed from `IpcContract`), `requireFile` / `optionalFile` for payload checks, `send(contents, EventType.X, data)`, `sendToFocusedWindow`, `broadcast`, `sendPluginAction`.
- Dialogs and notices are always the app's own, never native message boxes (`dialog.showMessageBox`, `showErrorBox`, `Notification`). Only the native file open/save pickers stay native. Build the dialog with a `DialogUtils` builder (`MessageDialog<T>` whose actions carry their `value` and a `DialogRole`). In main: `await showMessageDialog(event.sender, someDialog(...))` resolves to the chosen value (cancel when the window closes or reloads) and `notify(contents, someNotice(...))` shows a toast. In the renderer: `await showDialog(someDialog(...))`, `notify(notice)` and `.catch(notifyError("Cannot ..."))` for failures the user should see.
- Menus: `popupMenu(template, win, position)`; accelerators always through `getAccelerator(id)` (user key bindings apply), never a hard-coded default that `Shortcuts.ts` already defines.
- Tabs: `createEmptyTab`, `generateUniqueName`, `renameTab`, `hashTab`, `refreshIsChanged`, `applySavedFile`, `orderByPinned`, `moveTab`, `DEFAULT_TAB_NAME`.
- Editor text changes: `transformSelections` / `transformSelectionsOrDocument` / `getNonEmptySelections` from `EditorTransforms.ts`.
- Plugins: `getAllPlugins()` (bundled + user), `toolbarItems`, `previewTool`, `canPreview(language)`.
- Small renderer helpers: `classNames(...)`, `createDebouncer(delay)`, `useAnsiCodePage()`.
- Theme: `getTheme()` / `setTheme(file)`; never assign preferences fields from outside `EnvironmentUtils`.

## Readability rules

- Functions do one thing and are named with a verb (`openTab`, `createTabMenu`); booleans start with `is`/`has`/`can`.
- Prefer early returns over nested `if`/`else`.
- Do not assign a variable only to return or pass it on the next line, and do not compute the same value twice (`find` once instead of `some` then `find`).
- No wrapper functions that only call another function with the same arguments.
- No empty `catch` blocks; handle, log or rethrow.
- No module-level side effects other than registration that must happen on import; initialise explicitly from `main.ts` or `App.tsx`.
- Keep components small: if a component has several unrelated `useEffect`s or handlers, move them into named hooks.

## Adding things

- **IPC channel**: add it to `EventType` (kebab-case), its payload/response to `IpcContract`, the handler to the right `src/ipc/*Handlers.ts`, and invoke channels to `INVOKE_CHANNELS` in `src/preload.js`.
- **Plugin action**: add it to the plugin's `applicationMenuItems` with `label`, `code` (`plugin.action`), optional `accelerator`, `isAvailable` and `perform`. `BasePlugin` derives the action list, `doAction` and the context menu from it.
- **Setting**: add it to `Settings`, `DEFAULT_SETTINGS` and `normalizeSettings` with validation, plus a test.

## Public contracts (do not break silently)

- `EditorWrapper` methods are the user plugin API documented in `README.md`. Do not remove or rename them; add new ones and document them.
- Plugin action codes are stored in users' `keyBindings`. When renaming one, add the old code to `LEGACY_ACTION_CODES` in `src/domain/LegacyActionCodes.ts`.
- `State.json`, `preferences.json` and the `plugin.json` format must keep reading older files.

## Before handing over

1. `npm run lint`, `npm run typecheck`, `npm test` all pass; add tests for new pure functions.
2. Run the app and exercise the changed flows (in the cloud: xvfb + Playwright over CDP); after dependency or build changes also check a packaged build.
3. Update `CLAUDE.md` (and `README.md` when user-facing behaviour changes).
4. Commit with the user's git identity only, no co-author or tool trailers.

## Code review requests

When asked to review or clean up code, first present findings as a prioritised list (file:line, problem, proposed fix), wait for approval, then apply them in small, separately committed steps.
