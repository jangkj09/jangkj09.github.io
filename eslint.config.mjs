import { requireExactDependencyVersion } from "./src/lib/eslint-rules/require-exact-dependency-version.js"
import astro from "eslint-plugin-astro"
import betterTailwind from "eslint-plugin-better-tailwindcss"
import { defineConfig } from "eslint/config"
import tseslint from "typescript-eslint"

const tailwindRules = {
  // https://github.com/schoero/eslint-plugin-better-tailwindcss/blob/main/docs/rules/enforce-canonical-classes.md
  "better-tailwindcss/enforce-canonical-classes": "error",
  // https://github.com/schoero/eslint-plugin-better-tailwindcss/blob/main/docs/rules/no-duplicate-classes.md
  "better-tailwindcss/no-duplicate-classes": "error",
  // https://github.com/schoero/eslint-plugin-better-tailwindcss/blob/main/docs/rules/no-deprecated-classes.md
  "better-tailwindcss/no-deprecated-classes": "error",

  // https://github.com/schoero/eslint-plugin-better-tailwindcss/blob/main/docs/rules/no-conflicting-classes.md
  "better-tailwindcss/no-conflicting-classes": "error",
  // https://github.com/schoero/eslint-plugin-better-tailwindcss/blob/main/docs/rules/no-restricted-classes.md
  "better-tailwindcss/no-restricted-classes": "error",
}

const tailwindSettings = {
  "better-tailwindcss": {
    entryPoint: "src/styles/global.css",
    rootFontSize: 16,
  },
}

const eslintConfig = defineConfig([
  {
    ignores: ["src/lib/eslint-rules/**/*"],
  },
  astro.configs["flat/recommended"],
  {
    files: ["**/*.ts", "**/*.tsx", "**/*.js", "**/*.jsx", "**/*.mjs", "**/*.cjs"],
    settings: tailwindSettings,
    plugins: {
      "@typescript-eslint": tseslint.plugin,
      "better-tailwindcss": betterTailwind,
      custom: {
        rules: {
          "require-exact-dependency-version": requireExactDependencyVersion,
        },
      },
    },
    languageOptions: {
      parser: tseslint.parser,
    },
    rules: {
      ...tailwindRules,
      "@typescript-eslint/no-unused-vars": [
        "warn",
        { varsIgnorePattern: "^_", argsIgnorePattern: "^_" },
      ],
      "custom/require-exact-dependency-version": "error",
    },
  },
  {
    files: ["**/*.astro"],
    settings: tailwindSettings,
    plugins: {
      "better-tailwindcss": betterTailwind,
    },
    rules: tailwindRules,
  },
])

export default eslintConfig
