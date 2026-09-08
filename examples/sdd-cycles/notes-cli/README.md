# Archivo del arnés original (`notes-cli`)

Este directorio guarda, sin modificar, los artefactos SDD del proyecto `notes-cli` que
venían copiados en este repositorio antes de la migración del 2026-09-01 (ver
`progress/history.md`). No pertenecen a `node-auth` — el CLI de notas no existe en `src/`.

Se conservan como **plantilla de un ciclo SDD completo** (idea → spec → implementación →
review), no como trabajo pendiente de este proyecto.

- `feature_list.json` (13 features de `notes-cli`) — original completo.
- `specs/cli_{count,export,recent,stats}/` — los 4 specs Kiro-style que sí se llegaron a
  redactar e implementar, con sus `requirements.md` (EARS estricto), `design.md` y
  `tasks.md`.
- `progress/impl_cli_{count,recent,stats}.md` y `progress/review_cli_{count,export,recent,stats}.md`
  — informes de implementer/reviewer de esas 4 features.
- `docs/ideas/2026-06-09-{archive-notes,cli_tags}-design.md` — dos documentos de ideación
  (`cli_archive`, `cli_tags`) que quedaron en `pending`, nunca implementados.

Si necesitas ver cómo se ve un spec o un reporte de review terminado, mira aquí.
