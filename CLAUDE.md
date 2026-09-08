# CLAUDE.md

Punto de entrada único para Claude Code y para los 6 subagentes SDD de `.claude/agents/`
(`leader`, `ideator`, `api_designer`, `spec_author`, `implementer`, `reviewer`). Léelo
primero y sigue sus referencias. `AGENTS.md` solo redirige aquí.

> **Idioma:** todo el arnés se escribe en español — este archivo, `docs/`, `.claude/` y la
> salida de `init.sh`.

Este archivo tiene dos mitades y **no se edita a mano**:

- **Arnés** — estable, idéntico en todos los proyectos creados desde el template. Vive en
  `.claude/harness/`.
- **Proyecto** — se escribe una vez por proyecto. Vive en `docs/project/`.

Si vas a documentar algo de *este* proyecto, edita `docs/project/*`. Si vas a cambiar cómo
funciona el arnés, edita `.claude/harness/*`.

Lo específico del stack (gestor de paquetes, comandos, nombres de capa, paquetes vetados,
archivos obligatorios) sale de **`harness.config.json`**. Léelo en vez de asumir nada, y
verifica con `./init.sh`.

<!-- ══════════════ ARNÉS — no editar por proyecto ══════════════ -->

@.claude/harness/sdd.md

<!-- ══════════════ PROYECTO — aquí sí ══════════════ -->

@docs/project/overview.md

@docs/project/architecture.md

@docs/project/blind-spots.md
