# Flujo de trabajo — cómo usar este repositorio de inicio a fin

> Guía práctica y narrativa del arnés SDD. Para el detalle normativo de cada pieza, ver
> `CLAUDE.md` § "Arnés de Spec Driven Development" (mapa del repo, reglas duras) y
> `docs/specs.md` (formato EARS, plantillas de `requirements.md`/`design.md`/`tasks.md`).
> Este documento es el "cómo se encadena todo", no la referencia de cada archivo.

## Diagrama general

```
0. Setup inicial (una vez)
        │
        ▼
1. Arranque de sesión (./init.sh, progress/current.md, feature_list.json)
        │
        ▼
2. Entra una feature nueva ──┬── idea vaga  → /brainstorm
        │                     └── idea clara → /add-feature
        ▼
3. Ciclo SDD
   pending → [spec_author] → spec_ready → ⏸ TÚ APRUEBAS → in_progress
           → [implementer → reviewer] → done
        │
        ▼
4. Cierre de sesión (/close-session)
        │
        ▼
5. Repite desde el paso 2 para la siguiente feature
```

## 0. Setup inicial (una sola vez)

Si acabas de crear el proyecto desde el template, empieza por el scaffold — reescribe los
nombres, resetea el estado del arnés y verifica que todo queda en verde:

```bash
pnpm install
node scripts/scaffold.mjs             # dry-run: enseña el plan y no toca nada
node scripts/scaffold.mjs --apply     # lo aplica y corre ./init.sh
```

Si el proyecto ya está scaffoldeado, el setup es solo:

```bash
pnpm install
cp src/.env.template src/.env      # rellena las variables que declare
./init.sh                          # debe terminar [OK] Entorno listo
```

Si `./init.sh` falla aquí, no sigas — resuelve el entorno primero (falta el `install`, una
variable de `.env` sin rellenar, un servicio externo no accesible). Los comandos exactos
de tu proyecto están en `harness.config.json` → `commands.*`, y `./init.sh` los imprime en
su sección 0.

## 1. Arranque de cada sesión

Cualquier agente (o tú mismo) lee, en este orden: `CLAUDE.md` (Claude Code lo carga
solo), `progress/current.md` (estado de la última sesión), `feature_list.json` (qué
feature toca), y corre `./init.sh`. Esto ya lo hacen `leader`/`ideator` automáticamente al
invocarse — no hace falta pedirlo aparte.

## 2. Elige cómo entra la feature nueva

Dos caminos, según qué tan clara tengas la idea:

| Tu situación | Comando | Qué pasa |
|---|---|---|
| Idea vaga, quieres explorarla | `/brainstorm` | El `ideator` dialoga contigo (una pregunta a la vez, 2-3 enfoques, diseño sección por sección), escribe `docs/ideas/<fecha>-<topic>-design.md`, y **tras tu aprobación explícita** inserta la feature en `feature_list.json` como `pending` |
| Idea ya clara, con criterios de aceptación concretos | `/add-feature` | Te pide `name`/`title`/`description`/`acceptance[]`, valida el JSON, la deja `pending` directamente — sin diálogo largo |

## 3. El ciclo SDD — el corazón del flujo

```
pending → [spec_author] → spec_ready → ⏸ TÚ APRUEBAS → in_progress → [implementer → reviewer] → done
```

### 3.1 — Redacción del spec

```
/implement-next
```

El `leader` ve la primera feature `pending`, lanza `spec_author`, que escribe
`specs/<name>/{requirements.md, design.md, tasks.md}` (requirements en EARS estricto,
design con la sección obligatoria "Capas afectadas y dirección de dependencias", tasks
ordenadas domain→infrastructure→presentation) y marca `spec_ready`. **Se detiene ahí** —
el agente nunca toca código sin que tú apruebes.

### 3.2 — Tú revisas el spec

Lees `specs/<name>/requirements.md`, `design.md`, `tasks.md` a mano. Pides cambios si
algo no cuadra, o dices "aprobado".

### 3.3 — Implementación

```
/approve-spec
```

(o vuelves a `/implement-next`; hace lo mismo una vez detecta tu aprobación). El `leader`
cambia el status a `in_progress`, lanza `implementer`, que va tarea por tarea de
`tasks.md` **de dentro hacia afuera**: primero el DTO, el use-case y el contrato en la
capa interna; luego la implementación concreta; al final la ruta en la capa de entrega; y
el wiring en el composition root si hace falta. Cada task de código va con su test
colocado antes de pasar a la siguiente. Al terminar, corre `./init.sh` completo y escribe `progress/impl_<name>.md`
con la trazabilidad `R<n> → test`.

### 3.4 — Revisión

El `leader` lanza automáticamente a `reviewer` tras el `implementer` (o lo disparas
manual con `/run-review` si la sesión se cortó). El `reviewer` comprueba: trazabilidad
requirements↔tests, todas las tasks `[x]`, auditoría de capas (que la capa interna no haya
importado una capa externa ni una librería vetada, que no haya `new` de implementaciones
concretas fuera del composition root, que la respuesta pase por el método de proyección),
`./init.sh` en verde, y los checkpoints `C1`–`C10` de `CHECKPOINTS.md` más los `P1`…`Pn`
de `docs/project/checkpoints.md` si existe. Escribe el veredicto en
`progress/review_<name>.md`: `APPROVED` o `CHANGES_REQUESTED`.

- Si `CHANGES_REQUESTED` → vuelve a **3.3** con la lista de cambios del reviewer.
- Si `APPROVED` → el `implementer` marca `status: "done"` en `feature_list.json`.

## 4. Cierre de sesión

```
/close-session
```

Verifica `./init.sh` en verde, confirma que como mucho hay 1 feature `in_progress`, mueve
el resumen de `progress/current.md` al final de `progress/history.md` (append-only, nunca
se editan entradas viejas), lo restaura desde
`.claude/harness/templates/progress-current.md`, y comprueba que no quedan
`console.log()` de debug ni temporales.

## 5. Repite desde el paso 2 para la siguiente feature

## Verificación en cualquier punto

- `pnpm test` — solo los tests de la capa interna: rápido, sin I/O.
- `pnpm typecheck` — typecheck, incluidos los archivos de test.
- `./scripts/check-dependency-rule.sh` — solo el guard de la Regla de Dependencia
  (checkpoint `C2`), útil a mitad de una task.
- `./init.sh` — todo lo anterior + validez de `feature_list.json`/specs. Es la
  verificación que exige el arnés antes de marcar cualquier cosa `done`.
- `request/*.rest` contra `pnpm dev` — smoke test manual del endpoint real (Nivel 3 de
  `docs/verification.md`).

## Referencia rápida de comandos

| Comando | Cuándo usarlo | Agente que actúa |
|---|---|---|
| `/brainstorm` | Idea vaga, quieres explorar antes de comprometerla | `ideator` |
| `/add-feature` | Idea clara, solo falta registrarla | — (edición directa de `feature_list.json`) |
| `/implement-next` | Avanzar la primera feature no-`done`/no-`blocked` según su estado | `leader` (+ `spec_author`/`implementer`/`reviewer` según el caso) |
| `/approve-spec` | Cerrar la puerta de aprobación humana y disparar implementación | `leader` → `implementer` → `reviewer` |
| `/run-review` | Forzar una pasada del `reviewer` sobre la feature `in_progress` | `reviewer` |
| `/close-session` | Cerrar la sesión de forma limpia | `leader` |
