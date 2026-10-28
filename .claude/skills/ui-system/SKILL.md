---
name: ui-system
description: Note Manager visual system. Use for ANY CSS, styling, theme or component change, and for any new or changed panel, popup, dialog, menu, list, row, form control, button, tooltip, toast, title bar, scrollbar, editor or markdown preview styling, or theme file (resources/Themes/*.css, src/BaseTheme.css, src/index.css, PreviewStyles.ts).
---

# Note Manager UI system

Every surface of the app (tab bar, tool window, footer, title bar menus, pickers, settings, editor, markdown preview) must look like one family. That only holds if every visual value comes from one place.

## Core rule

Components never pick their own values. Every color, spacing, radius, font, shadow, duration, easing and z-index comes from a theme variable. If no variable fits the role, add the variable first (see "Where tokens live") and then use it. Never inline a value "for now". Raw values appear only inside token definitions: the theme files and the two token blocks at the top of `src/BaseTheme.css`.

## Where tokens live

- **Color roles** live in every theme file: `resources/Themes/*.css` (Dark, Light, Matrix, Orange Dark, Soft Light), one `:root {}` block each. A theme is injected at runtime with `insertCSS` (`loadThemeToWindow` in `src/utils/ElectronUtils.ts`), which also sets the window background from `--primary-bg`. The Settings page parses and edits these variables (`src/utils/ThemeVariables.ts`). User themes are copies in `%APPDATA%\Note Manager\Themes\`.
- **Structural tokens** (spacing, radius, type, control height, sidebar width, shadow, motion, z-index, content width, marker width, disabled opacity) do not change per theme. They live in the first `:root {}` block of `src/BaseTheme.css`.
- **Color defaults** live in the `:where(:root) {}` block of `src/BaseTheme.css`. `:where()` has zero specificity, so any theme value wins, and older user themes that don't define a newer role still render. Inserted theme CSS loses to page CSS on equal specificity, so never move a color default into a plain `:root` block.
- Each bundled theme picks its colors from its own identity: Dark is neutral graphite with a blue accent, Light is paper white with a blue accent, Matrix is black with a phosphor green accent, Orange Dark is warm charcoal with an orange accent, and Soft Light is mint with a teal accent. New roles follow the same identity, never a generic gray or blue.
- A new color role is added to **all five** bundled theme files and gets a default in the `:where(:root)` block, in the same change.
- A new structural token is added to the `:root` block of `src/BaseTheme.css` and to the token map below.
- The markdown preview and the tool window content render inside shadow roots. Custom properties inherit into them, so `PreviewStyles.ts` and the inline styles in `PreviewPlugin.ts` use the same variables. The preview's local aliases (`--preview-*`, `--alert-*`) point at theme variables, never at literals.

## Token map: role → variable

"Theme" means the variable is defined in every theme file (with a default in `src/BaseTheme.css` for the newer ones). "Base" means `src/BaseTheme.css` only.

| Role | Variable | Where |
|---|---|---|
| Base background (window, editor, preview, tool window) | `--primary-bg` | theme |
| Surface background (title bar, tab bar, footer, tool window header, editor tools strip, settings nav, inputs, buttons) | `--secondary-bg` | theme |
| Elevated background (menus, popovers, pickers, tooltips, dialogs) | `--elevated-bg` | theme |
| Hover tint on any background | `--hover-bg` | theme |
| Pressed fill, selected fill, editor selection | `--action-bg` | theme |
| Modal and picker backdrop | `--overlay-bg` | theme |
| Border of controls, tables, dialogs | `--border-color` | theme |
| Subtle border (layer 1 content edge, menu and popover outline, dividers) | `--border-subtle-color` | theme |
| Primary text | `--color` | theme |
| Secondary / muted text (hints, section labels, descriptions, gutter numbers, shortcuts) | `--muted-color` | theme |
| Accent (selection marker, primary button, links, drop indicator) | `--positive-color` | theme |
| Text on accent or danger fill | `--on-accent-color` | theme |
| Danger / error / close hover | `--negative-color` | theme |
| Warning | `--warning-color` | theme |
| Success | `--success-color` | theme |
| Focus ring | `--focus-ring-color` | theme |
| Shadow tint | `--shadow-color` | theme |
| Highlighted text (hovered line) | `--selected-highlight-color` | theme |
| Editor active line | `--active-line-bg` | theme |
| Scrollbar | `--scrollbar-thumb-color`, `--scrollbar-thumb-hover-color`, `--scrollbar-track-color` | theme |
| Text selection (editor, preview, inputs) | `--selection-bg` | theme |
| Search match highlight / search-in-selection scope in the editor | `--search-match-bg`, `--search-scope-bg` | theme |
| Code tokens | `--keyword-color`, `--type-color`, `--attribute-color`, `--string-color`, `--number-color`, `--comment-color`, `--variable-color`, `--block-color`, `--xml-tag-color` | theme |
| Tag palette | `--tag-1-color` … `--tag-8-color` (theme), `--tag-1-bg` … `--tag-8-bg` (derived in base) | theme + base |
| Spacing scale | `--space-1` … `--space-6` | base |
| Radius | `--radius-sm` (controls, chips, rows), `--radius-md` (menus, popovers, code blocks), `--radius-lg` (dialogs), `--radius-pill` | base |
| Font families | `--font-ui` (chrome), `--font-content` (preview/note bodies), `--font-mono` (code, shortcuts) | base |
| Font sizes | `--font-size-xs`, `--font-size-sm`, `--font-size-md` (UI default), `--font-size-lg`, `--font-size-xl` | base |
| Font weights | `--font-weight-regular`, `--font-weight-medium`, `--font-weight-bold` | base |
| Line heights | `--line-height-ui`, `--line-height-content` | base |
| Control heights | `--control-height-sm`, `--control-height-md`, `--control-height-lg` | base |
| Sidebar width (vertical tabs) | `--sidebar-width` | base |
| Shadows | `--shadow-sm` (layer 2), `--shadow-lg` (layer 3) | base |
| Motion | `--duration-fast` (hover/color), `--duration-normal` (open/close), `--easing-standard` | base |
| z-index | `--z-resizer`, `--z-editor-marker` (search highlights in the Ace marker layer, below the selection), `--z-dropdown`, `--z-popover`, `--z-overlay`, `--z-dialog`, `--z-toast`, `--z-tooltip` | base |
| Editor/preview text measure (70ch) | `--content-width` | base |
| Selection / drop marker thickness | `--marker-width` | base |
| Disabled opacity | `--disabled-opacity` | base |

Sizes that are not in the scale are built from tokens with `calc()` (for example `calc(var(--control-height-md) * 6)` for the settings nav width). Never add a one-off literal.

The editor font family and size are user settings (`editorSettings.fontFamily` and `fontSize` in `Editor.tsx`), not tokens. Don't override them in CSS.

## Hard rules

1. No raw colors: no hex, `rgb()`, `rgba()`, `hsl()` and no named colors (`white`, `gray`, `dodgerblue`) outside theme files. `transparent`, `currentColor` and `inherit` are allowed. Use `color-mix()` only with variables as inputs.
2. No off-scale spacing. Margin, padding and gap come from `--space-*`. The only raw values allowed are `0` and `1px` borders.
3. Radius, font size, font weight, line height, shadow, duration, easing and z-index come only from tokens. No `px`, `em` or `rem` literals for these.
4. Never write `transition: all`. List the properties, for example `transition: background-color var(--duration-fast) var(--easing-standard), color var(--duration-fast) var(--easing-standard)`.
5. Never use `!important` in component styles. The `!important` rules in `src/BaseTheme.css` override third-party CSS (custom-electron-titlebar `.cet-*`, Ace `.ace_*`, which inject their own styles later) and the reduced-motion block. Those are the only places it is allowed: add one only when a third-party rule cannot be beaten otherwise.
6. Never write theme-specific selectors (`.dark`, `[data-theme]`, `body.light`) or check the theme name in components. Light and dark work only by swapping variable values.
7. Before creating a component, look for an existing one and extend it with a modifier class rather than building a lookalike. What exists today in `src/index.css`: `.iconButton` (+ `.danger`, `.toggle` with `aria-pressed`) for icon-only buttons and option toggles, `.textField` for text inputs outside Settings, `.chip` (+ `.current`, `.ghost`, `.selected`) for status chips and segmented choices, the `#settingsDialog` button/input/select styles for form controls, `.settingsNavItem` / `.encodingChoice` / `.editorTabHeader` for rows, `.paletteOverlay` / `.palette` / `.paletteInput` / `.paletteHint` for layer 2 pickers opened like a command palette (encoding picker, go to box), `#searchBar` (layer 1 strip above the editor) with `.searchHistory` as its layer 2 dropdown, `.searchTargets` (segmented `.chip.ghost` radios) and the folder row (`.searchField` + `.searchField.filters`), `#searchResults` (bottom panel: layer 1 `.searchResultsHeader`, layer 0 virtualized `.searchResultsList` of fixed `--control-height-sm` `.searchResultRow`s with the selected marker and a `.cursor` focus ring; row buttons show on hover, `.iconButton.running` stays visible while a search runs), `.panelResizer` (+ `.horizontal`, `.vertical`) for every draggable panel edge, `#settingsDialog` for layer 3 dialogs, `.btn` (+ `.primary`, `.danger`) for text buttons, `.dialog-backdrop` / `.dialog` / `.dialog-header` / `.dialog-body` / `.dialog-footer` (+ `.messageDialog`) for message dialogs, `.toast-stack` / `.toast` (+ `.success`, `.warning`, `.error`) for notices and `.severityIcon` for the kind badge in both. `references/components.md` has the generic recipes these follow.
8. Screen-level and container styles (`#workspace`, `#editorBody`, `#tabManager`, `#settingsDialog` layout) do layout only: display, flex/grid, sizing, overflow. Look comes from the component classes inside them.
9. No inline `style={{...}}` for visual values in TSX. Inline styles are allowed only for runtime geometry (for example the tool window width while resizing).

## Layers

Elements on the same layer look identical. Pick the layer first, then take its whole recipe.

| Layer | What | Background | Border | Shadow | Radius |
|---|---|---|---|---|---|
| 0 | Ace editor, markdown preview body, tool window body | `--primary-bg` | none | none | none |
| 1 | Title bar, tab bar, footer/status bar, tool window header, editor tools strip, settings nav, vertical tab sidebar | `--secondary-bg` | 1px `--border-subtle-color` only on the edge that meets content | none | none |
| 2 | Title bar menus and submenus, context menus, search history dropdown, go to box, tooltips, encoding picker, command palette, slash menu, any dropdown | `--elevated-bg` | 1px `--border-subtle-color` | `--shadow-sm` | `--radius-md` |
| 3 | Settings dialog, confirm/unsaved dialogs, any modal | `--elevated-bg` | 1px `--border-color` | `--shadow-lg` | `--radius-lg`, with `--overlay-bg` backdrop at `--z-overlay` |

A picker that is opened like a command palette (the encoding picker) is layer 2. It may have a backdrop for click-away, but the backdrop is `--overlay-bg` and the box keeps the layer 2 recipe.

## State language

Every interactive element (tab, row, menu item, button, chip, nav item, tool button) uses the same states, in this order of precedence:

| State | Treatment |
|---|---|
| hover | background `--hover-bg`; text unchanged. On an accent fill, layer it: `background-image: linear-gradient(var(--hover-bg), var(--hover-bg))` |
| active (pressed) | background `--action-bg` |
| selected / current | background `--action-bg` plus an accent marker: `box-shadow: inset var(--marker-width) 0 0 var(--positive-color)` on the leading edge for list rows, nav items and vertical tabs, the top edge for horizontal tabs, the edge facing the content for the editor tools strip. Text stays `--color`. A pinned tab shows a bookmark icon instead of the close button, never a second marker |
| focus-visible | `outline: 1px solid var(--focus-ring-color); outline-offset: -1px` inside lists and `outline-offset: 1px` on standalone controls. Use `:focus-visible`, never plain `:focus` |
| disabled | `opacity: var(--disabled-opacity)`, `cursor: default`, no hover |
| danger | text or fill `--negative-color`. Used only for destructive actions and errors |

Drag and drop indicators (tab reorder) use the same accent inset marker as selection.

## Motion

- `--duration-fast` is for hover, color and background changes. `--duration-normal` is for open/close, expand/collapse and overlays. There is one easing: `--easing-standard`.
- All overlays (layer 2 and 3) share one enter animation: fade in plus a small translate from the anchor side, using `--duration-normal`. Exit is either instant or the same animation reversed.
- Nothing animates inside the editor while typing: no transitions on `.ace_*` layers, the cursor, the active line or preview content updates.
- Always add:
  ```css
  @media (prefers-reduced-motion: reduce) {
      *, *::before, *::after { animation-duration: 0s; transition-duration: 0s; }
  }
  ```
  This lives once in `src/BaseTheme.css` (with `!important`, so it beats every component), not per component.

## Typography

- Chrome (tabs, menus, footer, settings, pickers) uses `--font-ui`, `--font-size-sm`/`--font-size-md` and `--line-height-ui`.
- Note bodies and the markdown preview use `--font-content` and `--line-height-content`, with the text column capped at `max-width: var(--content-width)`.
- Code, code blocks, keyboard shortcuts and encodings use `--font-mono`.
- The Ace editor follows the user's font settings. Don't set a font on `.ace_editor` from component CSS.
- Section labels (like `.encodingGroup`) use `--font-size-xs`, uppercase, `--muted-color`. Don't use `opacity` to fake muted text.

## Electron rules

- Title bar: the drag region is the title bar background (`-webkit-app-region: drag`). Every button, menu and input inside it gets `-webkit-app-region: no-drag`. The custom-electron-titlebar library handles its own controls; any element we add there must set `no-drag` explicitly.
- `body` sets `user-select: none` and `cursor: default`. `input`, `textarea`, `.ace_editor` and `#toolWindowContent` switch selection back on, and the preview's `:host` sets `user-select: text`. New content areas must do the same.
- App buttons and rows use `cursor: default`, like a native app. Use `pointer` only for real links in preview content. Resizers use `col-resize`/`row-resize`.
- The `BrowserWindow` `backgroundColor` and `body` background are both `--primary-bg`, so there is no flash on open or resize. `getThemeBackgroundColor()` in `ElectronUtils.ts` reads it from the active theme for `createWindow` and `loadThemeToWindow`. Keep `--primary-bg` a value Electron accepts (hex, rgb(a), hsl(a) or a named color).

## Accessibility

- Text against its background must reach WCAG AA (4.5:1 for body text, 3:1 for large text and for UI borders and focus rings) in **every** bundled theme, not only Dark. Check Light and Soft Light explicitly.
- Focus is always visible through `:focus-visible`. Never `outline: none` without the ring replacement.
- Icon-only actions are real `<button type="button">` elements (never a clickable `<svg>`, `<img>` or `<div>`) with an `aria-label`, plus a `title` for the tooltip. Toggle buttons set `aria-pressed`, and nav items set `aria-current`.
- Color is never the only signal: modified tabs show `*`, selected items have the marker, and errors have text.

## Before you finish

1. Grep your diff for raw values. It must print nothing except theme files:
   ```bash
   git diff -U0 -- src/index.css 'src/react/**' 'src/utils/**' src/main.ts | grep '^+' | grep -nE '#[0-9a-fA-F]{3,8}\b|rgba?\(|hsla?\(|\b[0-9.]+(px|em|rem|ms|s)\b|!important|transition:\s*all|z-index:\s*[0-9]|\b(white|black|gray|grey|dodgerblue|red)\b'
   ```
   `1px` borders, `0` and `white-space` are the only allowed hits. Diffs to `src/BaseTheme.css` are checked by eye: raw values only inside the two token blocks, `!important` only on third-party selectors.
2. Run the app and check Dark and Light at least, plus Matrix for a high-chroma accent: Settings > Theme or the Theme menu.
3. Control heights line up. Buttons, inputs, selects and chips on one row share one `--control-height-*`.
4. Layers and states match. Your popup looks like the title bar menus and the encoding picker, your row's hover/selected looks like tabs and settings nav, and your dialog looks like Settings.
5. If you added a token, it is in all five theme files plus the `:where(:root)` defaults (colors) or in the `:root` block of `src/BaseTheme.css` (structure), the token map above lists it, and CLAUDE.md is updated.

## Anti-patterns

- Hard-coded colors as shortcuts, such as `color: dodgerblue` on a selected tool, `color: white` on a primary button, `color: gray` on an inactive title bar or `rgba(0, 0, 0, .45)` for a backdrop. All of these existed before the UI system and were replaced.
- Faking muted text with `opacity` (it also fades borders and icons).
- Each popup inventing its own radius (4/6/8/10/12) and shadow.
- `transition: 0.1s all ease` on tabs.
- Copying a component's CSS under a new id instead of sharing a class.
- New id-only styling for something that will repeat. Ids are fine for one-off layout (`#settingsDialog`); repeated looks need a shared class (`.iconButton`, `.chip`).
- Bordered FontAwesome icons with `onClick`. Wrap the icon in `.iconButton`.
- Theme-specific overrides or `!important` to win a specificity fight.

Recipes for every component: `references/components.md`.
