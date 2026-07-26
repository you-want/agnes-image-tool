import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({ baseDirectory: __dirname });

const eslintConfig = [
  ...compat.extends("next/core-web-vitals", "next/typescript"),
  {
    ignores: [
      ".next/**",
      "node_modules/**",
      "out/**",
      "public/sw.js",
    ],
  },
  {
    rules: {
      // Surface dead code — this codebase had several unused imports/vars.
      "@typescript-eslint/no-unused-vars": [
        "warn",
        { argsIgnorePattern: "^_", varsIgnorePattern: "^_" },
      ],
      "@typescript-eslint/no-explicit-any": "warn",
      // False positive in the App Router: fonts in the root layout <head>
      // apply to every page (the rule targets the Pages Router).
      "@next/next/no-page-custom-font": "off",
    },
  },
];

export default eslintConfig;
