# Component recipes

These are the canonical styles. Every value is a theme variable from the token map in `../SKILL.md`. Where the app already has a matching component, reuse it: `.iconButton` is the icon button, `.chip` is the chip, `.settingsNavItem`, `.encodingChoice` and `.editorTabHeader` are rows, `#encodingPicker` is the popover and `#settingsDialog` is the dialog. Use the generic class names below (`.btn`, `.row`, `.menu`, `.popover`, `.dialog`, `.toast`, `.tag`) for new components that have no existing counterpart, and move an existing one onto them when you touch it.

Shared fragments used below. `@keyframes ui-overlay-enter` already exists in `src/BaseTheme.css`, so don't redefine it. The `-1 *` multipliers and the check-mark polygon are math and shape, not design values.

```css
.ui-chrome {
    font-family: var(--font-ui);
    font-size: var(--font-size-sm);
    line-height: var(--line-height-ui);
    color: var(--color);
    user-select: none;
    cursor: default;
}

.ui-interactive {
    transition: background-color var(--duration-fast) var(--easing-standard),
                color var(--duration-fast) var(--easing-standard),
                box-shadow var(--duration-fast) var(--easing-standard);
}

.ui-interactive:focus-visible {
    outline: 1px solid var(--focus-ring-color);
    outline-offset: -1px;
}

@keyframes ui-overlay-enter {
    from { opacity: 0; transform: translateY(calc(-1 * var(--space-1))); }
    to   { opacity: 1; transform: none; }
}
```

## Row

One row recipe serves tab headers in vertical mode, settings nav items, encoding choices, search results, tree nodes, note/tag items and settings rows.

```css
.row {
    display: flex;
    align-items: center;
    gap: var(--space-2);
    min-height: var(--control-height-md);
    padding: 0 var(--space-3);
    border-radius: var(--radius-sm);
    color: var(--color);
}

.row:hover { background-color: var(--hover-bg); }
.row:active { background-color: var(--action-bg); }

.row.selected {
    background-color: var(--action-bg);
    box-shadow: inset var(--marker-width) 0 0 var(--positive-color);
}

.row.disabled { opacity: var(--disabled-opacity); pointer-events: none; }

.row-icon { flex: none; color: var(--muted-color); }
.row-label { flex: 1; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.row-meta { flex: none; font-size: var(--font-size-xs); color: var(--muted-color); }

.row.nested { padding-left: calc(var(--space-3) + var(--space-4) * var(--depth, 0)); }

.settingsRow {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: var(--space-3);
    min-height: var(--control-height-lg);
    padding: var(--space-1) 0;
}

.settingsRow:hover { background-color: transparent; }
```

`--depth` is set inline by the component (runtime geometry). A settings row is a layout row, not a selectable one, so it has no hover.

## Buttons

```css
.btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: var(--space-2);
    height: var(--control-height-md);
    padding: 0 var(--space-3);
    font: inherit;
    font-size: var(--font-size-sm);
    font-weight: var(--font-weight-medium);
    color: var(--color);
    background-color: var(--secondary-bg);
    border: 1px solid var(--border-color);
    border-radius: var(--radius-sm);
    cursor: default;
}

.btn:hover { background-color: var(--hover-bg); }
.btn:active { background-color: var(--action-bg); }
.btn:focus-visible { outline: 1px solid var(--focus-ring-color); outline-offset: 1px; }
.btn:disabled { opacity: var(--disabled-opacity); pointer-events: none; }

.btn.primary {
    color: var(--on-accent-color);
    background-color: var(--positive-color);
    border-color: var(--positive-color);
}
.btn.primary:hover { background-image: linear-gradient(var(--hover-bg), var(--hover-bg)); }

.btn.ghost { background-color: transparent; border-color: transparent; }
.btn.ghost:hover { background-color: var(--hover-bg); }

.btn.danger { color: var(--negative-color); }
.btn.danger.primary { color: var(--on-accent-color); background-color: var(--negative-color); border-color: var(--negative-color); }

.btn.icon { width: var(--control-height-md); padding: 0; background-color: transparent; border-color: transparent; }
.btn.icon:hover { background-color: var(--hover-bg); }

.btn.sm { height: var(--control-height-sm); padding: 0 var(--space-2); font-size: var(--font-size-xs); }
.btn.lg { height: var(--control-height-lg); padding: 0 var(--space-4); }
.btn.icon.sm { width: var(--control-height-sm); }
.btn.icon.lg { width: var(--control-height-lg); }
```

An icon button must be a `<button type="button">` with `aria-label` and `title`. In the current app, `.iconButton` is the small icon button (`.btn.icon.sm`) and `.iconButton.danger` is the close button (red on hover).

## Input, textarea, select

```css
.input, .select, .textarea {
    height: var(--control-height-md);
    padding: 0 var(--space-2);
    font: inherit;
    font-size: var(--font-size-sm);
    color: var(--color);
    background-color: var(--secondary-bg);
    border: 1px solid var(--border-color);
    border-radius: var(--radius-sm);
    user-select: text;
}

.textarea { height: auto; min-height: calc(var(--control-height-md) * 3); padding: var(--space-2); resize: vertical; }

.input::placeholder, .textarea::placeholder { color: var(--muted-color); }

.input:focus-visible, .select:focus-visible, .textarea:focus-visible {
    outline: 1px solid var(--focus-ring-color);
    outline-offset: -1px;
    border-color: var(--focus-ring-color);
}

.input.invalid, .select.invalid, .textarea.invalid { border-color: var(--negative-color); }
.input:disabled, .select:disabled, .textarea:disabled { opacity: var(--disabled-opacity); }

.input.mono { font-family: var(--font-mono); }
```

Searchable lists (encoding picker, command palette) use `.input` at full width inside the popover's padding.

## Switch and checkbox

```css
.checkbox {
    appearance: none;
    width: var(--space-4);
    height: var(--space-4);
    margin: 0;
    border: 1px solid var(--border-color);
    border-radius: var(--radius-sm);
    background-color: var(--secondary-bg);
    display: inline-grid;
    place-content: center;
}
.checkbox:checked { background-color: var(--positive-color); border-color: var(--positive-color); }
.checkbox:checked::after {
    content: "";
    width: calc(var(--space-4) / 2);
    height: calc(var(--space-4) / 2);
    background-color: var(--on-accent-color);
    clip-path: polygon(14% 44%, 0 65%, 50% 100%, 100% 16%, 80% 0%, 43% 62%);
}
.checkbox:focus-visible { outline: 1px solid var(--focus-ring-color); outline-offset: 1px; }

.switch {
    appearance: none;
    position: relative;
    width: calc(var(--control-height-sm) * 2);
    height: var(--control-height-sm);
    margin: 0;
    border: 1px solid var(--border-color);
    border-radius: var(--radius-pill);
    background-color: var(--secondary-bg);
    transition: background-color var(--duration-fast) var(--easing-standard);
}
.switch::after {
    content: "";
    position: absolute;
    top: var(--space-1);
    left: var(--space-1);
    width: calc(var(--control-height-sm) - var(--space-1) * 2 - 1px - 1px);
    height: calc(var(--control-height-sm) - var(--space-1) * 2 - 1px - 1px);
    border-radius: var(--radius-pill);
    background-color: var(--color);
    transition: transform var(--duration-fast) var(--easing-standard);
}
.switch:checked { background-color: var(--positive-color); border-color: var(--positive-color); }
.switch:checked::after { background-color: var(--on-accent-color); transform: translateX(var(--control-height-sm)); }
.switch:focus-visible { outline: 1px solid var(--focus-ring-color); outline-offset: 1px; }
```

The clip-path percentages describe the shape of the check mark, not spacing, so they are allowed.

## Menu and menu item (layer 2)

The title bar menus (`.cet-menubar-menu-container`, `.cet-submenu`) are third-party. Map them to these values in `src/BaseTheme.css` rather than restyling them per instance.

```css
.menu {
    min-width: calc(var(--control-height-md) * 7);
    padding: var(--space-1);
    background-color: var(--elevated-bg);
    border: 1px solid var(--border-subtle-color);
    border-radius: var(--radius-md);
    box-shadow: var(--shadow-sm);
    z-index: var(--z-dropdown);
    animation: ui-overlay-enter var(--duration-normal) var(--easing-standard);
}

.menu-item {
    display: flex;
    align-items: center;
    gap: var(--space-2);
    height: var(--control-height-md);
    padding: 0 var(--space-2);
    border-radius: var(--radius-sm);
    color: var(--color);
}
.menu-item:hover, .menu-item.focused { background-color: var(--hover-bg); }
.menu-item.checked .menu-item-icon { color: var(--positive-color); }
.menu-item.danger { color: var(--negative-color); }
.menu-item.disabled { opacity: var(--disabled-opacity); pointer-events: none; }

.menu-item-icon { width: var(--space-4); flex: none; color: var(--muted-color); text-align: center; }
.menu-item-label { flex: 1; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.menu-item-shortcut { flex: none; font-family: var(--font-mono); font-size: var(--font-size-xs); color: var(--muted-color); }

.menu-separator { height: 1px; margin: var(--space-1) calc(-1 * var(--space-1)); background-color: var(--border-subtle-color); }

.menu-section-label {
    padding: var(--space-2) var(--space-2) var(--space-1);
    font-size: var(--font-size-xs);
    text-transform: uppercase;
    color: var(--muted-color);
}
```

Long menus scroll inside `.menu` (`max-height` derived from the viewport, `overflow-y: auto`), as `.cet-menubar-menu-container.fitted` does today.

## Popover (layer 2)

The encoding picker, command palette, slash menu and dropdown panels all use this recipe.

```css
.popover {
    display: flex;
    flex-direction: column;
    max-height: 70vh;
    background-color: var(--elevated-bg);
    color: var(--color);
    border: 1px solid var(--border-subtle-color);
    border-radius: var(--radius-md);
    box-shadow: var(--shadow-sm);
    overflow: hidden;
    z-index: var(--z-popover);
    animation: ui-overlay-enter var(--duration-normal) var(--easing-standard);
}

.popover-header { display: flex; align-items: center; gap: var(--space-2); padding: var(--space-2); }
.popover-body { flex: 1; overflow-y: auto; padding: var(--space-1); }
.popover-empty { padding: var(--space-3); color: var(--muted-color); }

.popover-backdrop { position: fixed; inset: 0; background-color: var(--overlay-bg); z-index: var(--z-overlay); }
```

## Tooltip (layer 2)

```css
.tooltip {
    max-width: calc(var(--content-width) / 2);
    padding: var(--space-1) var(--space-2);
    font-size: var(--font-size-xs);
    color: var(--color);
    background-color: var(--elevated-bg);
    border: 1px solid var(--border-subtle-color);
    border-radius: var(--radius-sm);
    box-shadow: var(--shadow-sm);
    z-index: var(--z-tooltip);
    pointer-events: none;
    animation: ui-overlay-enter var(--duration-normal) var(--easing-standard);
}
```

`.ace_tooltip` maps to the same values.

## Dialog (layer 3)

```css
.dialog-backdrop {
    position: fixed;
    inset: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    background-color: var(--overlay-bg);
    z-index: var(--z-overlay);
}

.dialog {
    display: flex;
    flex-direction: column;
    max-width: 92vw;
    max-height: 85vh;
    background-color: var(--elevated-bg);
    color: var(--color);
    border: 1px solid var(--border-color);
    border-radius: var(--radius-lg);
    box-shadow: var(--shadow-lg);
    overflow: hidden;
    z-index: var(--z-dialog);
    animation: ui-overlay-enter var(--duration-normal) var(--easing-standard);
}

.dialog-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: var(--space-3);
    padding: var(--space-3) var(--space-4);
    font-size: var(--font-size-md);
    font-weight: var(--font-weight-bold);
    border-bottom: 1px solid var(--border-subtle-color);
}

.dialog-body { flex: 1; overflow-y: auto; padding: var(--space-4); user-select: text; }

.dialog-footer {
    display: flex;
    align-items: center;
    justify-content: flex-end;
    gap: var(--space-2);
    padding: var(--space-3) var(--space-4);
    border-top: 1px solid var(--border-subtle-color);
}
```

Footer button order, left to right: an optional destructive or tertiary action pinned left (`margin-right: auto`), then **Cancel** (`.btn`), then the primary action (`.btn.primary`) last. In the unsaved-changes dialog that reads `Don't Save` (left, `.btn.danger`), `Cancel`, `Save` (primary). Enter triggers the primary action, Escape triggers Cancel, and focus starts on the primary action.

Dialog widths come from multiples of `--content-width` or `--control-height-*`, not raw pixel values.

## Toast

```css
.toast-stack {
    position: fixed;
    right: var(--space-4);
    bottom: calc(var(--control-height-md) + var(--space-4));
    display: flex;
    flex-direction: column;
    gap: var(--space-2);
    z-index: var(--z-toast);
}

.toast {
    display: flex;
    align-items: center;
    gap: var(--space-2);
    max-width: var(--content-width);
    padding: var(--space-2) var(--space-3);
    background-color: var(--elevated-bg);
    color: var(--color);
    border: 1px solid var(--border-subtle-color);
    border-radius: var(--radius-md);
    box-shadow: var(--shadow-sm);
    animation: ui-overlay-enter var(--duration-normal) var(--easing-standard);
}

.toast.success { box-shadow: var(--shadow-sm), inset var(--marker-width) 0 0 var(--success-color); }
.toast.warning { box-shadow: var(--shadow-sm), inset var(--marker-width) 0 0 var(--warning-color); }
.toast.error   { box-shadow: var(--shadow-sm), inset var(--marker-width) 0 0 var(--negative-color); }
```

The stack sits above the footer. A toast is layer 2: it never gets a backdrop.

## Tag and chip

Tags use only the fixed palette slots `--tag-1` … `--tag-8`. Never let a user or a component pick an arbitrary color.

```css
.chip {
    display: inline-flex;
    align-items: center;
    gap: var(--space-1);
    height: var(--control-height-sm);
    padding: 0 var(--space-2);
    font-size: var(--font-size-xs);
    color: var(--color);
    background-color: var(--action-bg);
    border: 1px solid var(--border-color);
    border-radius: var(--radius-pill);
    white-space: nowrap;
}
.chip:hover { box-shadow: inset 0 0 0 1px var(--positive-color); }
.chip.current { color: var(--on-accent-color); background-color: var(--positive-color); border-color: var(--positive-color); }

.tag[data-color="1"] { background-color: var(--tag-1-bg); color: var(--tag-1-color); border-color: transparent; }
```

A tag is a chip with a palette slot: `class="chip tag" data-color="1"`. Repeat the `data-color` rule for slots 2 to 8. The status bar chips (`#footer .statusChip`) and the encoding picker mode buttons are `.chip`.

## Panels and title bar (layer 1)

```css
.panel {
    display: flex;
    flex-direction: column;
    background-color: var(--secondary-bg);
    color: var(--color);
    user-select: none;
}
.panel.edge-left   { border-left: 1px solid var(--border-subtle-color); }
.panel.edge-right  { border-right: 1px solid var(--border-subtle-color); }
.panel.edge-top    { border-top: 1px solid var(--border-subtle-color); }
.panel.edge-bottom { border-bottom: 1px solid var(--border-subtle-color); }

.panel-header {
    display: flex;
    align-items: center;
    gap: var(--space-2);
    height: var(--control-height-lg);
    padding: 0 var(--space-2);
    font-size: var(--font-size-sm);
    font-weight: var(--font-weight-medium);
    border-bottom: 1px solid var(--border-subtle-color);
}

.panel-body { flex: 1; min-height: 0; overflow: auto; }

.statusbar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    height: var(--control-height-md);
    padding: 0 var(--space-2);
    font-size: var(--font-size-xs);
    background-color: var(--secondary-bg);
    border-top: 1px solid var(--border-subtle-color);
}

.resizer {
    width: var(--space-1);
    cursor: col-resize;
    z-index: var(--z-resizer);
    transition: background-color var(--duration-fast) var(--easing-standard);
}
.resizer:hover, .resizer.dragging { background-color: var(--positive-color); }
```

Panels are `#tabListWrapper`, `#footer`, `#toolWindow`, `#toolWindowHeader`, `#editorTools` and `#settingsNav`.

The title bar (custom-electron-titlebar):

```css
.cet-titlebar {
    background-color: var(--secondary-bg);
    color: var(--color);
    font-family: var(--font-ui);
    font-size: var(--font-size-sm);
    -webkit-app-region: drag;
}
.cet-titlebar .cet-menubar, .cet-titlebar .cet-control-icon, .cet-titlebar button, .cet-titlebar input { -webkit-app-region: no-drag; }
.cet-titlebar.inactive { color: var(--muted-color); }
.cet-control-icon:hover { background-color: var(--hover-bg); }
.cet-control-icon.cet-window-close:hover { color: var(--on-accent-color); background-color: var(--negative-color); }
```

## Scrollbar

One definition, in `src/BaseTheme.css`, repeated inside `PreviewStyles.ts` because the shadow root does not inherit `::-webkit-scrollbar` rules.

```css
::-webkit-scrollbar { width: var(--space-2); height: var(--space-2); }
::-webkit-scrollbar-track, ::-webkit-scrollbar-corner { background: transparent; }
::-webkit-scrollbar-thumb { background-color: var(--scrollbar-thumb-color); border-radius: var(--radius-pill); }
::-webkit-scrollbar-thumb:hover { background-image: linear-gradient(var(--hover-bg), var(--hover-bg)); }
```

## Editor content

Scope everything under `.editor`. These rules style plain semantic HTML, so they work whatever renders it: the markdown preview (`.markdown-body` in `PreviewStyles.ts` should also carry `.editor`), a future rich-text editor, or a ProseMirror/TipTap/Lexical root. Never target library-specific classes for the look; add `.editor` to the library's content root instead. The Ace source editor is styled through its `.ace_*` mapping in `src/BaseTheme.css` and follows the same color roles.

Nothing in `.editor` has a transition or animation.

```css
.editor {
    max-width: var(--content-width);
    margin: 0 auto;
    padding: var(--space-4) var(--space-5) var(--space-6);
    font-family: var(--font-content);
    font-size: var(--font-size-md);
    line-height: var(--line-height-content);
    color: var(--color);
    background-color: var(--primary-bg);
    user-select: text;
    cursor: text;
    word-wrap: break-word;
}

.editor > :first-child { margin-top: 0; }
.editor > :last-child { margin-bottom: 0; }

.editor p, .editor ul, .editor ol, .editor blockquote, .editor pre, .editor table, .editor .callout, .editor figure {
    margin: 0 0 var(--space-3);
}

.editor h1, .editor h2, .editor h3, .editor h4, .editor h5, .editor h6 {
    margin: var(--space-5) 0 var(--space-3);
    font-weight: var(--font-weight-bold);
    line-height: var(--line-height-ui);
}
.editor h1 { font-size: var(--font-size-xl); padding-bottom: var(--space-1); border-bottom: 1px solid var(--border-subtle-color); }
.editor h2 { font-size: var(--font-size-lg); padding-bottom: var(--space-1); border-bottom: 1px solid var(--border-subtle-color); }
.editor h3 { font-size: var(--font-size-md); }
.editor h4, .editor h5 { font-size: var(--font-size-sm); }
.editor h6 { font-size: var(--font-size-sm); color: var(--muted-color); }

.editor a { color: var(--positive-color); text-decoration: none; cursor: pointer; }
.editor a:hover { text-decoration: underline; }
.editor a:focus-visible { outline: 1px solid var(--focus-ring-color); outline-offset: 1px; }

.editor strong, .editor b { font-weight: var(--font-weight-bold); }

.editor blockquote {
    padding: 0 var(--space-3);
    color: var(--muted-color);
    box-shadow: inset var(--marker-width) 0 0 var(--border-color);
}

.editor code {
    padding: 0 var(--space-1);
    font-family: var(--font-mono);
    font-size: var(--font-size-sm);
    background-color: var(--action-bg);
    border-radius: var(--radius-sm);
}

.editor pre {
    padding: var(--space-3);
    overflow: auto;
    font-family: var(--font-mono);
    font-size: var(--font-size-sm);
    line-height: var(--line-height-ui);
    background-color: var(--secondary-bg);
    border: 1px solid var(--border-subtle-color);
    border-radius: var(--radius-md);
}
.editor pre code { padding: 0; background: none; border-radius: 0; font-size: inherit; }

.editor .tok-keyword   { color: var(--keyword-color); }
.editor .tok-type      { color: var(--type-color); }
.editor .tok-attribute { color: var(--attribute-color); }
.editor .tok-string    { color: var(--string-color); }
.editor .tok-number    { color: var(--number-color); }
.editor .tok-comment   { color: var(--comment-color); font-style: italic; }
.editor .tok-variable  { color: var(--variable-color); }
.editor .tok-punct     { color: var(--block-color); }
.editor .tok-tag       { color: var(--xml-tag-color); }

.editor table { border-collapse: collapse; display: block; max-width: 100%; overflow: auto; }
.editor th, .editor td { padding: var(--space-1) var(--space-3); border: 1px solid var(--border-color); }
.editor th { font-weight: var(--font-weight-bold); background-color: var(--secondary-bg); }
.editor tr:nth-child(2n) td { background-color: var(--hover-bg); }

.editor .callout {
    padding: var(--space-2) var(--space-3);
    border-radius: var(--radius-sm);
    background-color: var(--hover-bg);
    box-shadow: inset var(--marker-width) 0 0 var(--positive-color);
}
.editor .callout-title { display: flex; align-items: center; gap: var(--space-2); margin-bottom: var(--space-1); font-weight: var(--font-weight-medium); }
.editor .callout.note      { box-shadow: inset var(--marker-width) 0 0 var(--positive-color); }
.editor .callout.tip       { box-shadow: inset var(--marker-width) 0 0 var(--success-color); }
.editor .callout.important { box-shadow: inset var(--marker-width) 0 0 var(--attribute-color); }
.editor .callout.warning   { box-shadow: inset var(--marker-width) 0 0 var(--warning-color); }
.editor .callout.caution   { box-shadow: inset var(--marker-width) 0 0 var(--negative-color); }
.editor .callout.note .callout-title      { color: var(--positive-color); }
.editor .callout.tip .callout-title       { color: var(--success-color); }
.editor .callout.important .callout-title { color: var(--attribute-color); }
.editor .callout.warning .callout-title   { color: var(--warning-color); }
.editor .callout.caution .callout-title   { color: var(--negative-color); }

.editor ul, .editor ol { padding-left: var(--space-5); }
.editor li + li { margin-top: var(--space-1); }
.editor li > ul, .editor li > ol { margin: var(--space-1) 0 0; }
.editor li:has(> input[type="checkbox"]) { list-style: none; }
.editor li > input[type="checkbox"] { margin: 0 var(--space-2) 0 calc(-1 * var(--space-5)); accent-color: var(--positive-color); vertical-align: middle; }
.editor li:has(> input[type="checkbox"]:checked) { color: var(--muted-color); }

.editor hr { height: 1px; margin: var(--space-5) 0; border: 0; background-color: var(--border-color); }

.editor img, .editor video { max-width: 100%; height: auto; border-radius: var(--radius-sm); }
.editor figcaption { margin-top: var(--space-1); font-size: var(--font-size-xs); color: var(--muted-color); text-align: center; }

.editor .is-empty::before, .editor [data-placeholder]:empty::before {
    content: attr(data-placeholder);
    color: var(--muted-color);
    pointer-events: none;
}

.editor ::selection { background-color: var(--action-bg); }
```

`PreviewStyles.ts` maps GitHub alerts onto callouts through `--alert-note/tip/important/warning/caution`, which point at `--positive-color`, `--success-color`, `--attribute-color`, `--warning-color` and `--negative-color`. The preview root carries both `markdown-body` and `editor` classes. The `.html-body` `white`/`black` pair is the one intentional literal: it shows raw HTML the way a browser would. Leave it.
