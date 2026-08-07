import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    // Sortie de `next build` (voir NEXT_BUILD_DIR/tsconfig.json) : mêmes
    // fichiers générés que .next/**, jamais destinés à être lintés.
    ".next-build/**",
  ]),
]);

export default eslintConfig;
