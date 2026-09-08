---
paths:
  - "docs/api/**/*.yaml"
---

# Contrato API (OpenAPI 3.1)

Estás editando el contrato — la fuente de verdad de la superficie HTTP. Diseña o extiende
aquí; el código se ajusta a esto, nunca al revés.

- Toda operación lleva `operationId` en camelCase, **único** en todo el documento.
- Toda operación lleva `x-feature` (el `name` de la feature en `feature_list.json` dueña
  de la operación) y `x-status` (`live` si la ruta ya está montada, `planned` si no).
- La respuesta de error es **siempre** `{ error: string }` — reutiliza
  `components/responses/{BadRequest,Unauthorized,Forbidden,NotFound,InternalServerError}`.
- Solo `$ref` internos (`#/components/...`). Nunca a otro archivo ni a una URL.
- Todo schema de una respuesta `2xx` tiene que poder salir de un método de proyección
  pública (`entity.toPublic(...)`) — si no cabe ahí, el diseño está mal, no el contrato.

Verifica antes de dar por buena la edición:

```bash
pnpm exec tsx scripts/check-api-contract.mjs
```

Racional, plantillas y la correspondencia contrato→código: `docs/api-design.md`.
Checkpoint `C11` de `CHECKPOINTS.md`.
