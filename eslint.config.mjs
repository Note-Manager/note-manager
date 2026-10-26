import js from "@eslint/js";
import tseslint from "typescript-eslint";
import react from "eslint-plugin-react";
import reactHooks from "eslint-plugin-react-hooks";
import globals from "globals";

export default tseslint.config(
    {
        ignores: [".webpack/**", "out/**", "dist/**", "node_modules/**"],
    },
    js.configs.recommended,
    ...tseslint.configs.recommended,
    {
        files: ["src/**/*.{js,ts,tsx}"],
        plugins: {
            react,
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
        settings: {
            react: {version: "detect"},
        },
        rules: {
            ...react.configs.recommended.rules,
            "react/react-in-jsx-scope": "off",
            "react/prop-types": "off",
            "react-hooks/rules-of-hooks": "error",
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
