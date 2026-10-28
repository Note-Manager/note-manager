import * as ace from "ace-builds";

type Tokenizer = {getLineTokens: (line: string, state: unknown) => {tokens: Array<{type: string, value: string}>, state: unknown}};

const tokenizers = new Map<string, Promise<Tokenizer | undefined>>();

function loadTokenizer(language: string): Promise<Tokenizer | undefined> {
    let tokenizer = tokenizers.get(language);

    if (!tokenizer) {
        tokenizer = import("ace-builds/src-noconflict/mode-" + language)
            .then(() => {
                const Mode = ace.require("ace/mode/" + language)?.Mode;

                return Mode ? new Mode().getTokenizer() as Tokenizer : undefined;
            })
            .catch(() => undefined);

        tokenizers.set(language, tokenizer);
    }

    return tokenizer;
}

function tokenClasses(type: string): string {
    return type.split(".").filter(Boolean).map(part => "ace_" + part.replace(/[^\w-]/g, "")).join(" ");
}

export function renderTokens(code: string, tokenizer: Tokenizer): DocumentFragment {
    const fragment = document.createDocumentFragment();
    let state: unknown = "start";

    code.split("\n").forEach((line, index) => {
        if (index > 0) fragment.appendChild(document.createTextNode("\n"));

        const result = tokenizer.getLineTokens(line, state);
        state = result.state;

        for (const token of result.tokens) {
            if (token.type === "text" || !token.type) {
                fragment.appendChild(document.createTextNode(token.value));
            } else {
                const span = document.createElement("span");
                span.className = tokenClasses(token.type);
                span.textContent = token.value;
                fragment.appendChild(span);
            }
        }
    });

    return fragment;
}

export async function highlightCodeBlocks(root: ParentNode, isCurrent: () => boolean = () => true) {
    const blocks = Array.from(root.querySelectorAll<HTMLElement>("pre > code[data-language]"));

    for (const block of blocks) {
        const tokenizer = await loadTokenizer(block.dataset.language || "");

        if (!isCurrent()) return;
        if (!tokenizer) continue;

        block.replaceChildren(renderTokens(block.textContent || "", tokenizer));
    }
}
