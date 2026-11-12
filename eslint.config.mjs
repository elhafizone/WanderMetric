import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";
import prettier from "eslint-config-prettier";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Disables stylistic rules that would fight Prettier.
  prettier,
  {
    rules: {
      // Surfaces accidental `any` early rather than at review time.
      "@typescript-eslint/no-explicit-any": "error",
      "@typescript-eslint/no-unused-vars": [
        "error",
        { argsIgnorePattern: "^_", varsIgnorePattern: "^_" },
      ],
    },
  },
  // .deploy/ holds local, gitignored WordPress deploy bundles (a full core copy), not our code.
  globalIgnores([".next/**", "out/**", "build/**", ".deploy/**", "next-env.d.ts"]),
]);

export default eslintConfig;
