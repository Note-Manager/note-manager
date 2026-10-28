export const PREVIEW_STYLES = `
:host {
    --preview-muted: color-mix(in srgb, var(--color) 65%, transparent);
    --preview-subtle-bg: color-mix(in srgb, var(--color) 7%, transparent);
    --preview-code-bg: color-mix(in srgb, var(--color) 12%, transparent);
    --preview-border: var(--border-color);
    --preview-link: var(--positive-color);
    --alert-note: #4493f8;
    --alert-tip: #3fa45b;
    --alert-important: #a371f7;
    --alert-warning: #c69026;
    --alert-caution: #e5534b;

    display: block;
    min-height: 100%;
}

::-webkit-scrollbar {
    width: 8px;
    height: 8px;
}

::-webkit-scrollbar-track, ::-webkit-scrollbar-corner {
    background: transparent;
}

::-webkit-scrollbar-thumb {
    background: var(--scrollbar-thumb-color);
    border-radius: 5px;
}

.empty {
    display: flex;
    justify-content: center;
    align-items: center;
    min-height: 120px;
    color: var(--preview-muted);
    font-family: system-ui, sans-serif;
    font-size: 13px;
}

.html-body {
    min-height: 100%;
    padding: 8px;
    box-sizing: border-box;
    background-color: white;
    color: black;
}

.markdown-body {
    padding: 16px 20px 32px;
    color: var(--color);
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", "Noto Sans", Helvetica, Arial, sans-serif;
    font-size: 14px;
    line-height: 1.6;
    word-wrap: break-word;
}

.markdown-body > *:first-child {
    margin-top: 0 !important;
}

.markdown-body > *:last-child {
    margin-bottom: 0 !important;
}

.markdown-body p, .markdown-body blockquote, .markdown-body ul, .markdown-body ol, .markdown-body dl,
.markdown-body table, .markdown-body pre, .markdown-body details, .markdown-body .markdown-alert {
    margin-top: 0;
    margin-bottom: 14px;
}

.markdown-body h1, .markdown-body h2, .markdown-body h3, .markdown-body h4, .markdown-body h5, .markdown-body h6 {
    margin-top: 22px;
    margin-bottom: 14px;
    font-weight: 600;
    line-height: 1.25;
    scroll-margin-top: 8px;
}

.markdown-body h1 {
    font-size: 2em;
    padding-bottom: 0.3em;
    border-bottom: 1px solid var(--preview-border);
}

.markdown-body h2 {
    font-size: 1.5em;
    padding-bottom: 0.3em;
    border-bottom: 1px solid var(--preview-border);
}

.markdown-body h3 {
    font-size: 1.25em;
}

.markdown-body h4 {
    font-size: 1em;
}

.markdown-body h5 {
    font-size: 0.875em;
}

.markdown-body h6 {
    font-size: 0.85em;
    color: var(--preview-muted);
}

.markdown-body a {
    color: var(--preview-link);
    text-decoration: none;
}

.markdown-body a:hover {
    text-decoration: underline;
}

.markdown-body strong {
    font-weight: 600;
}

.markdown-body hr {
    height: 3px;
    margin: 22px 0;
    padding: 0;
    border: 0;
    background-color: var(--preview-border);
}

.markdown-body ul, .markdown-body ol {
    padding-left: 2em;
}

.markdown-body li + li {
    margin-top: 0.25em;
}

.markdown-body li > ul, .markdown-body li > ol {
    margin-top: 0.25em;
    margin-bottom: 0;
}

.markdown-body li:has(> input[type="checkbox"]), .markdown-body li:has(> p:first-child > input[type="checkbox"]:first-child) {
    list-style-type: none;
}

.markdown-body ul:has(> li > input[type="checkbox"]), .markdown-body ul:has(> li > p:first-child > input[type="checkbox"]:first-child) {
    padding-left: 1.25em;
}

.markdown-body input[type="checkbox"] {
    margin: 0 0.3em 0.2em -1.3em;
    vertical-align: middle;
    accent-color: var(--preview-link);
}

.markdown-body blockquote {
    margin-left: 0;
    margin-right: 0;
    padding: 0 1em;
    color: var(--preview-muted);
    border-left: 0.25em solid var(--preview-border);
}

.markdown-body code, .markdown-body kbd, .markdown-body pre {
    font-family: ui-monospace, SFMono-Regular, Consolas, "Liberation Mono", Menlo, monospace;
}

.markdown-body code {
    padding: 0.2em 0.4em;
    font-size: 85%;
    white-space: break-spaces;
    background-color: var(--preview-code-bg);
    border-radius: 6px;
}

.markdown-body pre {
    padding: 14px 16px;
    overflow: auto;
    font-size: 85%;
    line-height: 1.45;
    background-color: var(--secondary-bg);
    border: 1px solid var(--preview-border);
    border-radius: 6px;
}

.markdown-body pre code {
    padding: 0;
    font-size: 100%;
    white-space: pre;
    background-color: transparent;
    border-radius: 0;
}

.markdown-body kbd {
    display: inline-block;
    padding: 2px 5px;
    font-size: 11px;
    line-height: 1;
    vertical-align: middle;
    background-color: var(--preview-subtle-bg);
    border: 1px solid var(--preview-border);
    border-bottom-width: 2px;
    border-radius: 6px;
}

.markdown-body table {
    display: block;
    width: max-content;
    max-width: 100%;
    overflow: auto;
    border-spacing: 0;
    border-collapse: collapse;
}

.markdown-body th, .markdown-body td {
    padding: 6px 13px;
    border: 1px solid var(--preview-border);
}

.markdown-body th {
    font-weight: 600;
}

.markdown-body tbody tr:nth-child(2n) {
    background-color: var(--preview-subtle-bg);
}

.markdown-body img {
    max-width: 100%;
    box-sizing: content-box;
}

.markdown-body del {
    color: var(--preview-muted);
}

.markdown-body mark {
    padding: 0 2px;
    border-radius: 3px;
}

.markdown-body details summary {
    cursor: pointer;
}

.markdown-body .markdown-alert {
    padding: 8px 16px;
    color: inherit;
    border-left: 0.25em solid var(--alert-color);
    background-color: color-mix(in srgb, var(--alert-color) 8%, transparent);
    border-radius: 0 6px 6px 0;
}

.markdown-body .markdown-alert > :last-child {
    margin-bottom: 0;
}

.markdown-body .markdown-alert-title {
    margin-bottom: 4px;
    font-weight: 600;
    color: var(--alert-color);
}

.markdown-body .markdown-alert-note {
    --alert-color: var(--alert-note);
}

.markdown-body .markdown-alert-tip {
    --alert-color: var(--alert-tip);
}

.markdown-body .markdown-alert-important {
    --alert-color: var(--alert-important);
}

.markdown-body .markdown-alert-warning {
    --alert-color: var(--alert-warning);
}

.markdown-body .markdown-alert-caution {
    --alert-color: var(--alert-caution);
}

.ace_keyword, .ace_language {
    color: var(--keyword-color);
}

.ace_type, .ace_heading, .ace_operator {
    color: var(--type-color);
}

.ace_attribute-name, .ace_variable, .ace_markup {
    color: var(--attribute-color);
}

.ace_tag {
    color: var(--xml-tag-color);
}

.ace_constant, .ace_parameter {
    color: var(--variable-color);
}

.ace_function, .ace_number, .ace_numeric, .ace_list {
    color: var(--number-color);
}

.ace_punctuation, .ace_paren {
    color: var(--block-color);
}

.ace_identifier, .ace_support {
    color: var(--color);
}

.ace_string {
    color: var(--string-color);
}

.ace_comment {
    color: var(--comment-color);
    font-style: italic;
}
`;
