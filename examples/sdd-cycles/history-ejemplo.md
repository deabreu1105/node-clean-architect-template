# Bitácora histórica (append-only)

> Cada vez que se cierra una sesión, su resumen se añade aquí.
> No edites entradas anteriores. Solo añades al final.

---


## 2026-09-01 — Migración del arnés: notes-cli -> node-auth (Clean Architecture)
- **Agente:** humano + Claude Code (revisión exhaustiva, sin subtarea SDD asociada).
- **Contexto:** este directorio (`node-clean-architect/`) nació copiando el código sano de
  `node-auth` (API REST de autenticación, TypeScript, Clean Architecture) y encima el arnés
  SDD completo del proyecto hermano `../backend` (`notes-cli`: CLI de notas en JS plano,
  stdlib-only). El código quedó correcto; el arnés (`AGENTS.md`, `init.sh`,
  `feature_list.json`, `docs/`, `specs/`, `progress/`, `.claude/agents|prompts|settings.json`)
  seguía describiendo `notes-cli` y estaba roto: `init.sh` exigía un `CHECKPOINTS.md`
  inexistente (exit 1 siempre) y nunca corría los tests reales (`src/**/*.test.ts` vía
  `pnpm test`), solo hacía glob de `tests/*.js`.
- **Cambios (Fase 0 — arnés en verde):** `CHECKPOINTS.md` nuevo (C1–C10, derivado de
  `CLAUDE.md`, `CLEAN_ARCHITECTURE.md` §8 y el skill `clean-architecture`); `init.sh`
  reescrito (archivos base reales, guard de la Regla de Dependencia, `pnpm exec tsc --noEmit`,
  `pnpm test`); `feature_list.json` reseteado (`project: node-auth`, una feature semilla
  `change_password`); `.claude/settings.json` con rutas `.claude/skills/...` y hooks/permisos
  de pnpm en vez de `node src/cli.js`/`npm test`. Los artefactos de `notes-cli`
  (`specs/cli_{count,export,recent,stats}/`, `progress/impl_cli_*.md`,
  `progress/review_cli_*.md`, `docs/ideas/2026-06-09-*.md`, el `feature_list.json` viejo) se
  archivaron en `references/harness-notes-cli/` en vez de borrarse — quedan como plantilla de
  un ciclo SDD completo.
- **Verificación:** `./init.sh` (pendiente de confirmación en verde tras `pnpm install`).
- **Cierre:** Fase 0 completa. Siguen Fase 1 (`docs/`), Fase 2 (agentes) y Fase 3
  (prompts + `AGENTS.md`) — ver el plan aprobado en la sesión.

## 2026-09-01 — Fase 1: docs/ reescrito para Clean Architecture
- **Agente:** humano + Claude Code.
- **Cambios:** `docs/architecture.md`, `docs/conventions.md`, `docs/verification.md`
  reescritos por completo para TypeScript/Express/Mongo (antes describían el CLI de
  notas); `docs/specs.md` editado quirúrgicamente (ejemplos EARS/tasks en HTTP, sección
  obligatoria "Capas afectadas y dirección de dependencias" en `design.md`); `docs/ideation.md`
  con ajuste mínimo (declarar capa/puerto en el diseño).
- **Verificación:** `./init.sh` verde, 13/13 tests, typecheck limpio.

## 2026-09-01 — Fase 2: los 5 agentes reescritos para Clean Architecture
- **Agente:** humano + Claude Code.
- **Cambios:** `reviewer.md` (auditoría de capas + C1–C10 anclados), `implementer.md`
  (orden domain→infrastructure→presentation, reglas C2/C4/C5/C6), `spec_author.md`
  (sección de capas en design.md), `leader.md` (rutas `.claude/`, escalado por capas
  tocadas), `ideator.md` (descarta diseños que rompan la Regla de Dependencia).
- **Verificación:** `./init.sh` verde, sin restos de `.agents/`/`tests/`/`notes-cli`.

## 2026-09-01 — Fase 3: prompts + AGENTS.md apuntando a este proyecto
- **Agente:** humano + Claude Code.
- **Cambios:** rutas `.agents/agents/…`→`.claude/agents/…` en los 6 prompts; ejemplos
  hardcodeados de `notes-cli` sustituidos; `AGENTS.md` reconciliado con `CLAUDE.md`
  (arquitectura queda en `CLAUDE.md`, `AGENTS.md` cubre solo el arnés SDD, se corrige la
  contradicción "solo stdlib" vs. las dependencias reales del proyecto).
- **Verificación:** `./init.sh` verde.

## 2026-09-01 — Consolidación: `AGENTS.md` fusionado en `CLAUDE.md`
- **Agente:** humano + Claude Code.
- **Contexto:** el humano usa `CLAUDE.md` como archivo principal (Claude Code lo carga
  automáticamente en cada sesión); pidió que fuera la única fuente de verdad, con el
  contenido de `AGENTS.md` fusionado dentro y con buenas prácticas adicionales para el
  repo.
- **Cambios:** `CLAUDE.md` gana la sección completa "Spec Driven Development harness"
  (mapa del repo, reglas duras, flujo ideación/SDD, ciclo de vida de sesión, modo de
  comunicación caveman — este último explícitamente acotado a `leader`/`ideator`, que son
  los únicos de los 5 agentes que lo activaban) más una sección nueva "Known gotchas" con
  los 6 hallazgos de código pendientes de la revisión exhaustiva (asimetría de mayúsculas
  en el email, `.env` no encontrado tras `pnpm build`, `img` no mapeado, naming
  inconsistente de factories DTO, `GetUsers` devolviendo entidades crudas, READMEs de capa
  desactualizados, ciclo por barrel en `domain/`). `AGENTS.md` queda como stub de
  redirección (no se borra: algunas herramientas lo buscan por convención, pero ya no
  tiene contenido propio). Los 5 agentes, 2 prompts (`brainstorm`, `close-session`),
  `.claude/settings.json` e `init.sh` (lista de archivos base) se actualizaron para leer
  `CLAUDE.md` en vez de `AGENTS.md`.
- **Nota abierta:** `CLAUDE.md` sigue en inglés (su idioma original, sin tocar) mientras
  `docs/`, los agentes y los prompts siguen en español — split bilingüe deliberado, no
  resuelto. Decir si se prefiere traducir todo a un solo idioma.
- **Verificación:** `./init.sh` verde tras el cambio.

## 2026-09-01 — `CLAUDE.md` traducido a español
- **Agente:** humano + Claude Code.
- **Contexto:** el humano pidió `CLAUDE.md` en español, para consistencia con el resto
  del arnés (`docs/`, agentes, prompts), y que se escriba siempre en español a partir de
  ahora. Cierra la nota abierta de la entrada anterior.
- **Cambios:** `CLAUDE.md` traducido completo (Proyecto, Comandos, Arquitectura,
  Convenciones clave, Endpoints, Puntos ciegos conocidos, Arnés SDD) manteniendo intactos
  código, nombres de archivo y comandos. Añadida una nota de idioma al principio del
  archivo para que futuras actualizaciones se hagan en español.
- **Verificación:** `./init.sh` verde tras la traducción.

## 2026-09-01 — Nueva guía: `docs/workflow.md`
- **Agente:** humano + Claude Code.
- **Contexto:** el humano pidió el paso a paso de cómo usar el arnés de inicio a fin; se
  documenta para no depender de que quede solo en el chat.
- **Cambios:** `docs/workflow.md` nuevo — guía narrativa con diagrama, los 5 pasos
  (setup, arranque de sesión, entrada de feature, ciclo SDD 3.1–3.4, cierre) y una tabla
  de referencia rápida de los 6 comandos. Enlazado desde `CLAUDE.md` (mapa del repo +
  intro de la sección del arnés) y desde el stub de `AGENTS.md`.
- **Verificación:** `./init.sh` verde.

