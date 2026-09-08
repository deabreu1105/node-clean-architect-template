---
description: Implementa la siguiente feature pendiente del feature_list.json siguiendo el flujo SDD del arnés.
---

# /implement-next

Actúa como el subagente `leader` definido en
[.claude/agents/leader.md](../agents/leader.md). No edites código tú mismo.

## Paso a paso

1. Ejecuta `./init.sh`. Si falla, **para** y reporta el error al humano.
2. Lee `feature_list.json` e identifica la primera feature no-`done` /
   no-`blocked`.
3. Aplica el flujo SDD según su estado:

   | Estado actual   | Acción                                                                 |
   |-----------------|------------------------------------------------------------------------|
   | `pending`       | Lanza `spec_author` → para en `spec_ready` y pide aprobación humana.   |
   | `spec_ready`    | Recuerda al humano que tiene que aprobar (no avances).                 |
   | `in_progress`   | Sesión interrumpida: pregunta si reanudar `implementer` o abortar.     |
   | *no hay ninguna* | Ver más abajo: no es un error.                                        |

   **Si no hay ninguna feature accionable** — `features` está vacío, o todas
   están en `done` / `blocked` — es el estado normal de un proyecto recién
   creado desde el template, **no un error**. No inventes trabajo: dile al
   humano que la lista está vacía y ofrécele las dos entradas posibles.

   ```
   feature_list.json sin features accionables.
   Idea vaga  -> /brainstorm
   Idea clara -> /add-feature
   ```

   Si hay features en `blocked`, menciónalas y por qué lo están.

4. **Regla anti-teléfono-descompuesto:** los subagentes escriben sus
   resultados en archivos (`specs/<name>/`, `progress/impl_<name>.md`,
   `progress/review_<name>.md`) y solo te devuelven una referencia de
   una línea. No reproduzcas su contenido en chat.

5. Cuando el humano diga **"aprobado"** sobre un spec en `spec_ready`:
   - Cambia el `status` a `in_progress` en `feature_list.json`.
   - Lanza `implementer` apuntando a `specs/<name>/`.
   - Cuando termine, lanza `reviewer`.
   - Si el reviewer devuelve `APPROVED`, el `implementer` marca `done` y
     mueve el resumen a `progress/history.md`.
   - Si devuelve `CHANGES_REQUESTED`, vuelve a lanzar al `implementer`
     con las correcciones listadas en `progress/review_<name>.md`.

## Qué NO hacer

- ❌ Editar código directamente (`layers.sourceRoot`).
- ❌ Marcar features como `done` tú mismo.
- ❌ Saltar la puerta de aprobación humana entre `spec_ready` e `in_progress`.
- ❌ Aceptar resultados de subagentes que vengan en chat sin referencia a
  archivo en disco.

## Salida esperada en chat

Una sola línea por transición, p. ej.:

```
spec_ready -> specs/<name>/   (esperando aprobación humana)
```

o

```
done -> progress/impl_<name>.md   (reviewer APPROVED)
```
