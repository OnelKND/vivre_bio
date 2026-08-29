import { defineConfig } from "vitest/config";
import path from "node:path";

export default defineConfig({
  test: {
    environment: "node",
    include: ["lib/**/*.test.ts"],
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "."),
      // `server-only` lève une erreur inconditionnelle à l'import ; Next.js
      // la neutralise via son bundler pour les Server Components, mais
      // Vitest n'a pas cette résolution conditionnelle. On la remplace par
      // un stub no-op pour pouvoir importer des modules comme lib/db.ts
      // depuis les tests.
      "server-only": path.resolve(__dirname, "lib/test/server-only-stub.ts"),
    },
  },
});
