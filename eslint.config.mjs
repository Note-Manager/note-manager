import js from "@eslint/js";
import tseslint from "typescript-eslint";
import eslintReact from "@eslint-react/eslint-plugin";
import reactHooks from "eslint-plugin-react-hooks";
import globals from "globals";

export default tseslint.config(
    {
        ignores: [".webpack/**", "out/**", "dist/**", "node_modules/**"],
    },
    js.configs.recommended,
    ...tseslint.configs.recommended,
    {
        files: ["src/**/*.{ts,tsx}"],
        ...eslintReact.configs["recommended-typescript"],
    },
    {
        files: ["src/**/*.{js,ts,tsx}"],
        plugins: {
            "react-hooks": reactHooks,
        },
        languageOptions: {
            globals: {
                ...globals.browser,
                ...globals.node,
                MAIN_WINDOW_WEBPACK_ENTRY: "readonly",
                MAIN_WINDOW_PRELOAD_WEBPACK_ENTRY: "readonly",
            },
        },
        rules: {
            "react-hooks/rules-of-hooks": "error",
            "@eslint-react/exhaustive-deps": "off",
            "@eslint-react/naming-convention-ref-name": "off",
            "@eslint-react/no-array-index-key": "off",
            "no-empty": ["error", {allowEmptyCatch: true}],
            "@typescript-eslint/no-unused-expressions": ["error", {allowShortCircuit: true, allowTernary: true}],
            "@typescript-eslint/no-explicit-any": "off",
            "@typescript-eslint/ban-ts-comment": "off",
            "@typescript-eslint/no-unused-vars": ["warn", {args: "none", caughtErrors: "none"}],
        },
    },
    {
        files: ["src/main.ts"],
        rules: {
            "@typescript-eslint/no-require-imports": "off",
        },
    },
    {
        files: ["src/react/**/*.{ts,tsx}"],
        rules: {
            "no-restricted-imports": ["error", {
                paths: ["electron", "fs", "path", "os", "crypto", "child_process"],
                patterns: ["node:*"],
            }],
        },
    },
    {
        files: ["*.js", "*.mjs"],
        languageOptions: {
            globals: globals.node,
        },
        rules: {
            "@typescript-eslint/no-require-imports": "off",
        },
    },
);
