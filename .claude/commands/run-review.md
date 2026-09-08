---
description: Fuerza una pasada del reviewer sobre la feature in_progress y escribe el veredicto en progress/review_<name>.md.
---

# /run-review

Lanza al subagente `reviewer` definido en
[.claude/agents/reviewer.md](../agents/reviewer.md) sobre la feature
actualmente en `in_progress`. Útil cuando el `implementer` ya terminó
pero la sesión se cortó antes de obtener el veredicto, o cuando quieres
volver a revisar tras unos cambios.

## Pre-condiciones

- Existe **exactamente una** feature en estado `in_progress` en
  `feature_list.json`. Si hay 0 o > 1, **para** y reporta.
- Existen los 3 archivos en `specs/<name>/`.
- Existe `progress/impl_<name>.md` (el `implementer` ya pasó).

## Paso a paso

1. Ejecuta `./init.sh`. Si falla, **para** — el reviewer nunca aprueba
   con tests rojos.
2. Localiza la feature `in_progress` y guarda su `name`.
3. Lanza el subagente `reviewer` con esta instrucción:

   > Revisa la feature `<name>`. Sigue tu protocolo (trazabilidad
   > requirements ↔ tests, tasks completas, auditoría de capas y
   > checkpoints C1–C10). Escribe el veredicto en
   > `progress/review_<name>.md` y devuélveme una sola línea:
   > `APPROVED -> progress/review_<name>.md` o
   > `CHANGES_REQUESTED -> progress/review_<name>.md`.

4. Según el veredicto:
   - **APPROVED:** lanza al `implementer` para que marque `done` en
     `feature_list.json` y mueva el resumen a `progress/history.md`.
   - **CHANGES_REQUESTED:** lee `progress/review_<name>.md`, identifica
     los puntos a corregir y relanza al `implementer` con esa lista.

## Reglas duras

- ❌ NO edites el código tú mismo.
- ❌ NO marques `done` si el reviewer no aprobó.
- ❌ NO aceptes el veredicto en chat sin la referencia al archivo
  `progress/review_<name>.md`.

## Salida esperada en chat

Una sola línea, copiada del subagente:

```
APPROVED -> progress/review_<name>.md
```

o

```
CHANGES_REQUESTED -> progress/review_<name>.md
```
