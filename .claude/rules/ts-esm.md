---
paths:
  - "src/**/*.ts"
---

# TypeScript + ESM en este repositorio

- Import relativo interno **con extensión `.js` explícita**, aunque el archivo sea `.ts`
  (ESM `nodenext`): `import { X } from "./x.js"`.
- Prefijo `node:` en los builtins: `import { resolve } from "node:path"`.
- Orden de imports: stdlib → terceros → local.
- `verbatimModuleSyntax` está activo: usa `import type` para lo que solo sea un tipo.
- `noUncheckedIndexedAccess` y `exactOptionalPropertyTypes` están activos: el acceso
  indexado puede ser `undefined`, y un campo opcional no acepta `undefined` explícito.
- Nombre de archivo en kebab-case con sufijo de capa/tipo:
  `<algo>.use-case.ts`, `<algo>.repository.ts`, `<algo>.adapter.ts`, `<algo>.mapper.ts`.
- Las piezas estructurales llevan cabecera `// CAPA: <Capa> | TIPO: <Tipo>`; las de
  soporte llevan un comentario que explique el *porqué* de una decisión, no el qué.

Racional y ejemplos: `docs/conventions.md`.
