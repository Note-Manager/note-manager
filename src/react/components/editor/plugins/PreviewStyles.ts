export const PREVIEW_STYLES = `
:host {
    --preview-muted: var(--muted-color);
    --preview-subtle-bg: var(--hover-bg);
    --preview-code-bg: var(--action-bg);
    --preview-border: var(--border-color);
    --preview-border-subtle: var(--border-subtle-color);
    --preview-link: var(--positive-color);
    --alert-note: var(--positive-color);
    --alert-tip: var(--success-color);
    --alert-important: var(--attribute-color);
    --alert-warning: var(--warning-color);
    --alert-caution: var(--negative-color);

    display: block;
    min-height: 100%;
    user-select: text;
}

::-webkit-scrollbar {
    width: var(--space-2);
    height: var(--space-2);
}

::-webkit-scrollbar-track, ::-webkit-scrollbar-corner {
    background-color: var(--scrollbar-track-color);
}

::-webkit-scrollbar-thumb {
    background-color: var(--scrollbar-thumb-color);
    border-radius: var(--radius-pill);
}

::-webkit-scrollbar-thumb:hover, ::-webkit-scrollbar-thumb:active {
    background-color: var(--scrollbar-thumb-hover-color);
}

::selection {
    background-color: var(--selection-bg);
}

.empty {
    display: flex;
    justify-content: center;
    align-items: center;
    min-height: calc(var(--control-height-lg) * 4);
    color: var(--preview-muted);
    font-family: var(--font-ui);
    font-size: var(--font-size-sm);
}

.html-body {
    min-height: 100%;
    padding: var(--space-2);
    box-sizing: border-box;
    background-color: white;
    color: black;
}

.markdown-body {
    max-width: var(--content-width);
    margin: 0 auto;
    padding: var(--space-4) var(--space-5) var(--space-6);
    color: var(--color);
    font-family: var(--font-content);
    font-size: var(--font-size-md);
    line-height: var(--line-height-content);
    word-wrap: break-word;
    cursor: text;
}

.markdown-body > *:first-child {
    margin-top: 0;
}

.markdown-body > *:last-child {
    margin-bottom: 0;
}

.markdown-body p, .markdown-body blockquote, .markdown-body ul, .markdown-body ol, .markdown-body dl,
.markdown-body table, .markdown-body pre, .markdown-body details, .markdown-body .markdown-alert {
    margin-top: 0;
    margin-bottom: var(--space-3);
}

.markdown-body h1, .markdown-body h2, .markdown-body h3, .markdown-body h4, .markdown-body h5, .markdown-body h6 {
    margin-top: var(--space-5);
    margin-bottom: var(--space-3);
    font-weight: var(--font-weight-bold);
    line-height: var(--line-height-ui);
    scroll-margin-top: var(--space-2);
}

.markdown-body h1 {
    font-size: var(--font-size-xl);
    padding-bottom: var(--space-1);
    border-bottom: 1px solid var(--preview-border-subtle);
}

.markdown-body h2 {
    font-size: var(--font-size-lg);
    padding-bottom: var(--space-1);
    border-bottom: 1px solid var(--preview-border-subtle);
}

.markdown-body h3 {
    font-size: var(--font-size-md);
}

.markdown-body h4, .markdown-body h5 {
    font-size: var(--font-size-sm);
}

.markdown-body h6 {
    font-size: var(--font-size-sm);
    color: var(--preview-muted);
}

.markdown-body a {
    color: var(--preview-link);
    text-decoration: none;
    cursor: pointer;
}

.markdown-body a:focus-visible {
    outline: 1px solid var(--focus-ring-color);
    outline-offset: 1px;
}

.markdown-body a:hover {
    text-decoration: underline;
}

.markdown-body strong {
    font-weight: var(--font-weight-bold);
}

.markdown-body hr {
    height: 1px;
    margin: var(--space-5) 0;
    padding: 0;
    border: 0;
    background-color: var(--preview-border);
}

.markdown-body ul, .markdown-body ol {
    padding-left: var(--space-5);
}

.markdown-body li + li {
    margin-top: var(--space-1);
}

.markdown-body li > ul, .markdown-body li > ol {
    margin-top: var(--space-1);
    margin-bottom: 0;
}

.markdown-body li:has(> input[type="checkbox"]), .markdown-body li:has(> p:first-child > input[type="checkbox"]:first-child) {
    list-style-type: none;
}

.markdown-body ul:has(> li > input[type="checkbox"]), .markdown-body ul:has(> li > p:first-child > input[type="checkbox"]:first-child) {
    padding-left: var(--space-5);
}

.markdown-body input[type="checkbox"] {
    margin: 0 var(--space-1) 0 calc(-1 * var(--space-5));
    vertical-align: middle;
    accent-color: var(--preview-link);
}

.markdown-body blockquote {
    margin-left: 0;
    margin-right: 0;
    padding: 0 var(--space-3);
    color: var(--preview-muted);
    box-shadow: inset var(--marker-width) 0 0 var(--preview-border);
}

.markdown-body code, .markdown-body kbd, .markdown-body pre {
    font-family: var(--font-mono);
}

.markdown-body code {
    padding: 0 var(--space-1);
    font-size: var(--font-size-sm);
    white-space: break-spaces;
    background-color: var(--preview-code-bg);
    border-radius: var(--radius-sm);
}

.markdown-body pre {
    padding: var(--space-3);
    overflow: auto;
    font-size: var(--font-size-sm);
    line-height: var(--line-height-ui);
    background-color: var(--secondary-bg);
    border: 1px solid var(--preview-border-subtle);
    border-radius: var(--radius-md);
}

.markdown-body pre code {
    padding: 0;
    font-size: inherit;
    white-space: pre;
    background-color: transparent;
    border-radius: 0;
}

.markdown-body kbd {
    display: inline-block;
    padding: 0 var(--space-1);
    font-size: var(--font-size-xs);
    line-height: var(--line-height-ui);
    vertical-align: middle;
    background-color: var(--preview-subtle-bg);
    border: 1px solid var(--preview-border);
    border-radius: var(--radius-sm);
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
    padding: var(--space-1) var(--space-3);
    border: 1px solid var(--preview-border);
}

.markdown-body th {
    font-weight: var(--font-weight-bold);
    background-color: var(--secondary-bg);
}

.markdown-body tbody tr:nth-child(2n) {
    background-color: var(--preview-subtle-bg);
}

.markdown-body img {
    max-width: 100%;
    box-sizing: content-box;
    border-radius: var(--radius-sm);
}

.markdown-body del {
    color: var(--preview-muted);
}

.markdown-body mark {
    padding: 0 var(--space-1);
    color: var(--color);
    background-color: color-mix(in srgb, var(--warning-color) 35%, transparent);
    border-radius: var(--radius-sm);
}

.markdown-body details summary {
    cursor: pointer;
}

.markdown-body .markdown-alert {
    padding: var(--space-2) var(--space-3);
    color: inherit;
    background-color: var(--preview-subtle-bg);
    box-shadow: inset var(--marker-width) 0 0 var(--alert-color);
    border-radius: var(--radius-sm);
}

.markdown-body .markdown-alert > :last-child {
    margin-bottom: 0;
}

.markdown-body .markdown-alert-title {
    margin-bottom: var(--space-1);
    font-weight: var(--font-weight-medium);
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
