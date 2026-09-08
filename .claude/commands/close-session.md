---
description: Cierra la sesión actual de forma limpia (verifica init, archiva progress/current.md, deja el repo en verde).
---

# /close-session

Atajo para el cierre de sesión descrito en
[docs/workflow.md](../../docs/workflow.md) § 4. Actúa como el subagente `leader` —
puedes editar archivos en `progress/` y `feature_list.json`, pero NO código
(`layers.sourceRoot` de `harness.config.json`).

## Paso a paso

1. **Verifica entorno.** Ejecuta `./init.sh`. Si está en rojo:
   - NO marques nada como `done`.
   - Anota el bloqueo en `progress/current.md` con el motivo.
   - Cambia el `status` de la feature en curso a `blocked` en
     `feature_list.json`.
   - **Para** y reporta al humano.

2. **Confirma estado coherente.**
   - Como mucho 1 feature en `in_progress` en `feature_list.json`.
   - Toda feature con `"sdd": true` y estado `spec_ready`/`in_progress`/
     `done` tiene su `specs/<name>/{requirements,design,tasks}.md`.
   - El `reviewer` aprobó (`progress/review_<name>.md` contiene
     `APPROVED`) antes de marcar `done`.

3. **Archiva la sesión.**
   - Lee `progress/current.md`.
   - Añade un bloque al **final** de `progress/history.md` con el
     formato:

     ```markdown
     ## YYYY-MM-DD — Feature N: <name>
     - **Agente:** <quién>
     - **Plan:** <resumen 1 línea del plan>
     - **Cambios:** <archivos tocados>
     - **Verificación:** ./init.sh verde, N tests pasan. Reviewer APPROVED.
     - **Cierre:** feature N marcada `done`. Próximo: feature N+1 (<name>).
     ```

   - Restaura `progress/current.md` desde su plantilla — es la fuente única,
     no la reescribas de memoria:

     ```bash
     cp .claude/harness/templates/progress-current.md progress/current.md
     ```

4. **Limpieza.** Verifica que no quedan:
   - Archivos temporales (`*.tmp`, `dist/` sin gitignorar, cualquier
     archivo fuera de lo que cubre `.gitignore`).
   - `console.log()` de debug en el código.
   - TODOs sin contexto.

5. **Verificación final.** Vuelve a ejecutar `./init.sh`. Tiene que
   terminar verde.

## Salida esperada en chat

Una sola línea:

```
session closed -> progress/history.md (feature N: <name> done)
```

o si hubo bloqueo:

```
session blocked -> progress/current.md (feature N: <name> blocked)
```
