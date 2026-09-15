---
paths:
  - "docs/security/**/*.md"
---

# Hallazgos de seguridad

Estás editando un artefacto de la auditoría de seguridad. Formato y flujo completos:
`docs/security.md`.

- Todo hallazgo lleva el frontmatter completo: `id`, `severity`, `confidence`, `status`,
  `cwe`, `audit`, `feature`. No omitas campos aunque parezcan obvios por el nombre del
  archivo.
- `SEC-NNN` es global, monótono y **nunca se reutiliza** — ni siquiera si el hallazgo
  termina en `false_positive`.
- El PoC de `## Impacto y vector de ataque` es siempre **conceptual**: describe el vector
  y los pasos, nunca un payload ejecutable copy-paste.
- `## Remediación` declara **en qué capa vive el fix** (tabla pieza → capa). Un fix que
  solo funciona rompiendo la Regla de Dependencia no es una remediación válida — replantéalo
  con un puerto en `domain/` + adapter, igual que exige `docs/architecture.md`.
- `status` solo avanza así: `open → feature → fixed`, o a los terminales
  `accepted_risk` / `false_positive` con justificación humana explícita en el propio
  archivo. Nunca lo retrocedas.
- No reportes sobre archivos de test, código muerto, o valores server-controlled — es la
  sección *Do Not Flag* del skill `security-review`.

Racional completo y el flujo hallazgo → feature: `docs/security.md`.
