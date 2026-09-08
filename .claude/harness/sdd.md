# Arnés de Spec Driven Development

> **Mitad de arnés.** Este archivo es idéntico en todos los proyectos creados desde el
> template y **no se edita por proyecto**. Lo específico de tu proyecto va en
> `docs/project/`. `CLAUDE.md` lo importa, así que se carga en toda sesión.

Las features nuevas pasan por un flujo multiagente SDD — `leader`, `ideator`,
`spec_author`, `implementer`, `reviewer` (definidos en `.claude/agents/`) — seguido en
`feature_list.json` y `specs/<name>/`. Los slash commands `/brainstorm`, `/add-feature`,
`/implement-next`, `/approve-spec`, `/run-review` y `/close-session` (en
`.claude/commands/`) son las entradas. Para una edición puntual de código, sáltate todo
esto.

**La guía narrativa paso a paso está en `docs/workflow.md`** — el flujo completo con
diagrama, cuándo usar cada comando y cómo se encadena una sesión. Aquí solo está lo
normativo.

## Mapa del repositorio

| Ruta | Contenido | Cuándo leerlo |
|---|---|---|
| `harness.config.json` | Configuración del arnés: comandos, capas, paquetes vetados, archivos obligatorios | Al empezar; en vez de asumir el stack |
| `feature_list.json` | Features con estado (`pending` / `spec_ready` / `in_progress` / `done` / `blocked`) y el bloque `rules` | Siempre, al empezar |
| `progress/current.md` | Estado de la sesión actual | Siempre, al empezar |
| `progress/history.md` | Bitácora append-only — nunca edites entradas previas, solo añades al final | Para contexto histórico |
| `specs/<feature>/` | `requirements.md` + `design.md` + `tasks.md` (Kiro-style) | Antes de implementar cualquier feature `"sdd": true` |
| `docs/como-funciona.md` | Modelo mental: qué es el arnés y por qué está montado así | Primera vez que tocas este repositorio |
| `docs/workflow.md` | Guía narrativa: cómo usar el arnés de inicio a fin | Para el paso a paso de cada fase |
| `docs/specs.md` | Proceso SDD: notación EARS, los 3 archivos, la puerta de aprobación | Antes de redactar o leer un spec |
| `docs/ideation.md` | La fase de ideación pre-SDD y cuándo usar `/brainstorm` | Antes de hacer brainstorming |
| `docs/ideas/` | Documentos de diseño que produce el `ideator` | Para el porqué de una feature |
| `docs/architecture.md` | Estándar normativo de arquitectura — contra esto evalúa el `reviewer` | Antes de implementar |
| `CLEAN_ARCHITECTURE.md` | Guía narrativa del patrón, línea a línea sobre el ejemplo `GET /api/health` de este template | Para aprender el patrón, no para verificarlo (eso es `docs/architecture.md`) |
| `docs/conventions.md` | Estilo, nombres, estructura de archivos | Antes de escribir código |
| `docs/verification.md` | Cómo demostrar que el trabajo está hecho, incl. trazabilidad | Antes de declarar una task `done` |
| `CHECKPOINTS.md` | Criterios objetivos de "estado final correcto" (`C1`–`C10`) | Para auto-evaluarte |
| `docs/project/` | Lo específico de **este** proyecto: overview, arquitectura concreta, puntos ciegos | Se carga solo vía `CLAUDE.md` |
| `.claude/agents/` | Las 5 definiciones de subagentes | Si orquestas trabajo |
| `.claude/rules/` | Reglas cortas que se activan al editar archivos que hacen match | Automático, no hace falta abrirlas |
| `.claude/skills/clean-architecture/` | Teoría general (SOLID, boundaries) con rúbrica de diagnóstico | Si necesitas la teoría detrás de una regla |
| `examples/` | Material de referencia congelado: una app completa y ciclos SDD terminados | Si quieres ver el formato aplicado de verdad |

## Reglas duras

- **Una sola feature a la vez.** Nunca mezcles cambios de varias features en una sesión.
- **Nunca declares una task `done` sin `./init.sh` en verde** (tests + typecheck + guard
  de la Regla de Dependencia).
- **Nunca saltes la fase de spec.** Toda feature `"sdd": true` pasa por `spec_author` y
  obtiene aprobación humana antes de tocar código.
- **Nunca saltes la puerta de aprobación humana** entre `spec_ready` e `in_progress`.
- **Documenta sobre la marcha** en `progress/current.md`, no solo al final.
- **Deja el repositorio limpio** antes de cerrar (usa `/close-session`).
- **Toda dependencia externa se envuelve en un adapter.** Añadir una nueva a
  `package.json` requiere discusión previa: la feature queda `blocked` hasta acordarla.
  Nada llama a una librería de terceros directamente fuera de su adapter.

## Las dos puertas

```
idea vaga  → /brainstorm  → [ideator]     → ⏸ HUMANO APRUEBA DISEÑO → pending
idea clara → /add-feature                                            → pending

pending → [spec_author] → spec_ready → ⏸ HUMANO APRUEBA SPEC → in_progress
        → [implementer] → [reviewer] → done
```

Las dos `⏸` son puertas humanas reales: el agente **para** y espera. Ver
`docs/workflow.md` para el paso a paso de cada fase.

## Regla anti-teléfono-descompuesto

Los subagentes escriben sus resultados **en disco** (`specs/<name>/`,
`progress/impl_<name>.md`, `progress/review_<name>.md`) y devuelven **una sola línea de
referencia**. Nunca reproducen su salida completa en el chat. Un resultado que llega en
chat sin referencia a archivo no se acepta.

## Si te bloqueas

Relee la sección relevante de `docs/`. Si una herramienta genuinamente no hace lo que
esperas, **no improvises un workaround**: documenta el bloqueo en `progress/current.md`,
pon la feature en `blocked` en `feature_list.json`, y para.
