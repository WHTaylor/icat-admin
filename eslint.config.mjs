import { defineConfig, globalIgnores } from "eslint/config";
import typescriptEslint from "@typescript-eslint/eslint-plugin";
import tsParser from "@typescript-eslint/parser";
import path from "node:path";
import { fileURLToPath } from "node:url";
import js from "@eslint/js";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const compat = new FlatCompat({
    baseDirectory: __dirname,
    recommendedConfig: js.configs.recommended,
    allConfig: js.configs.all
});

export default defineConfig([globalIgnores(["**/build/"]), {
    extends: compat.extends(
        "preact",
        "plugin:@typescript-eslint/recommended",
        "plugin:@tanstack/eslint-plugin-query/recommended",
    ),

    plugins: {
        "@typescript-eslint": typescriptEslint,
    },

    languageOptions: {
        parser: tsParser,
    },

    rules: {
        "prefer-template": "off",
        radix: "off",

        "@typescript-eslint/no-unused-vars": ["error", {
            argsIgnorePattern: "^_",
        }],

        "react/jsx-tag-spacing": "off",
        "@typescript-eslint/no-explicit-any": "off",
        "jest/no-deprecated-functions": "off",
    },
}]);