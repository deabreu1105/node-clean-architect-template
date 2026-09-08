---
paths:
  - "src/domain/**/*.ts"
---

# Capa interna: Regla de Dependencia

Estás editando la capa interna. No puede depender de nadie.

- Prohibido importar cualquier capa externa (`layers.outer` de `harness.config.json`).
- Prohibido importar cualquier librería de terceros (`layers.bannedInInner`).
- Prohibido **incluso como valor por defecto** de un parámetro.
- Lo externo (hashear, firmar, reloj, IDs) entra como parámetro de constructor
  **requerido**, tipado contra una interfaz o function type definido aquí dentro.
- Los DTOs nunca lanzan: constructor privado + factory estática que devuelve
  `[error?, dto?]`.
- Los errores usan la clase de error tipado del dominio y sus factories, no `Error` crudo.
- Todo export nuevo se añade al barrel de la capa (`index.ts`).

Verifica antes de dar por buena la edición:

```bash
./scripts/check-dependency-rule.sh
```

Lo prohibido exactamente sale de `harness.config.json` (`layers.outer` +
`layers.bannedInInner`); para verlo, `node scripts/lib/dep-rule-pattern.mjs --explain`.

Racional y ejemplos: `docs/architecture.md` § Principios y `CHECKPOINTS.md` C2/C4.
