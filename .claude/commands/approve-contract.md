---
description: Aprueba el contrato de la feature en contract_ready y dispara al spec_author.
---

# /approve-contract

Atajo para cerrar la **puerta 2** del flujo (aprobación del contrato API). Actúa como el
subagente `leader` definido en [.claude/agents/leader.md](../agents/leader.md).

## Pre-condiciones

- Existe **exactamente una** feature en estado `contract_ready` en `feature_list.json`.
  Si hay 0 o > 1, **para** y reporta.
- Sus operaciones existen en `docs/api/openapi.yaml` con `x-feature` apuntando a ella
  (lo valida `./init.sh` §4b, checkpoint `C11`).

## Paso a paso

1. Ejecuta `./init.sh`. Si falla, **para**.
2. Localiza la feature `contract_ready` y guarda su `name`.
3. Lanza directamente el subagente `spec_author` (sin cambiar el `status` tú mismo:
   sigue en `contract_ready` hasta que él lo avance), indicándole que el contrato de esta
   feature ya está aprobado en `docs/api/openapi.yaml` — debe **referenciarlo por
   `operationId`** en `design.md`, nunca rediseñarlo ni copiarlo en prosa.
4. Cuando el `spec_author` termine, marcará `status: spec_ready` él mismo y parará —
   es la puerta 3 (`/approve-spec`).

## Reglas duras

- ❌ NO edites tú mismo `docs/api/openapi.yaml` ni código (`layers.sourceRoot`).
- ❌ NO saltes al `spec_author` si la feature no está en `contract_ready`.
- ❌ NO aceptes resultados del subagente que vengan en chat sin referencia a archivo.
- ✅ Una sola feature por sesión.

## Salida esperada en chat

```
spec_ready -> specs/<name>/   (esperando aprobación humana)
```
