// Stub pour le marqueur `server-only` en environnement de test (Vitest/Node).
//
// Le package `server-only` lève une erreur inconditionnelle à l'import
// (voir node_modules/server-only/index.js) — Next.js le neutralise via son
// bundler webpack/turbopack lors du build des Server Components, mais
// Vitest n'a pas cette logique de résolution conditionnelle. Sans cet
// alias, tout module de `lib/` marqué `import "server-only"` (dont `db.ts`)
// est impossible à importer depuis un test, même en environnement "node".
export {};
