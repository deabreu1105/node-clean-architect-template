---
paths:
  - "specs/**/requirements.md"
---

# `requirements.md` — Historia de usuario + EARS estricto (+ Gherkin si aplica)

Estás editando un `requirements.md`. Formato normativo completo: `docs/specs.md`.

- Abre siempre con `## Historia de usuario` (obligatoria, nunca falta): una frase
  "Como/Quiero/Para", con el `jira` de la feature en el encabezado si existe
  (`## Historia de usuario (PROJ-123)`). Si hay Gherkin de origen con su propio
  narrative, cítalo literal — nunca redactes uno distinto.
- Cada requirement es un párrafo numerado `## R<n>`, uno de los 5 patrones EARS
  (Ubicuo, Evento, Estado, Opcional, No deseado). Un solo `DEBE` por requirement, nunca
  verbos blandos ("podría", "puede", "soporta").
- Cada `R<n>` debe ser verificable por un test concreto, o por una verificación manual
  explícita si exige I/O real (`docs/verification.md` Nivel 3).
- Si el acceptance criteria de origen viene en Gherkin (`Característica`/`Escenario`/
  `Dado`/`Cuando`/`Entonces`), va **verbatim** en una sección `## Escenarios de origen`
  al principio del archivo, dentro de un bloque ` ```gherkin ` — nunca reformateado,
  nunca traducido, nunca inventado si el humano no lo trajo. El Gherkin no sustituye a
  los `R<n>` EARS: es su fuente, no su reemplazo.
- El archivo cierra con una tabla de trazabilidad hacia el origen de cada `R<n>` —
  `acceptance` del `feature_list.json`, o los escenarios Gherkin si existe la sección de
  arriba. La relación es N:M.

Racional completo, colisión léxica CUANDO/ENTONCES entre EARS y Gherkin, y ejemplos
íntegros: `docs/specs.md`.
