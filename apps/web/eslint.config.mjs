import { dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

const eslintConfig = [
  ...compat.extends("next/core-web-vitals", "next/typescript"),
  {
    ignores: [".next/**", "next-env.d.ts"],
  },
  {
    files: ["**/*.tsx", "**/*.ts"],
    rules: {
      "@typescript-eslint/prefer-readonly": "warn",
      "@typescript-eslint/prefer-function-type": "warn",
    },
  },
];

export default eslintConfig;
