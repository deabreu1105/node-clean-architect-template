---
description: Aprueba el spec de la feature en spec_ready y dispara al implementer + reviewer.
---

# /approve-spec

Atajo para cerrar la **puerta de aprobación humana** del flujo SDD.
Actúa como el subagente `leader` definido en
[.claude/agents/leader.md](../agents/leader.md).

## Pre-condiciones

- Existe **exactamente una** feature en estado `spec_ready` en
  `feature_list.json`. Si hay 0 o > 1, **para** y reporta.
- Los 3 archivos `specs/<name>/{requirements,design,tasks}.md` existen
  (lo valida `./init.sh`).

## Paso a paso

1. Ejecuta `./init.sh`. Si falla, **para**.
2. Localiza la feature `spec_ready` y guarda su `name`.
3. Cambia su `status` a `in_progress` en `feature_list.json`.
4. Lanza el subagente `implementer` indicándole `specs/<name>/` como
   input. Recuérdale que debe escribir su informe en
   `progress/impl_<name>.md` y devolver **una sola línea**.
5. Cuando el `implementer` devuelva `done -> progress/impl_<name>.md`,
   lanza el subagente `reviewer`. Debe escribir el veredicto en
   `progress/review_<name>.md` y devolver **una sola línea**:
   - `APPROVED -> progress/review_<name>.md` → el `implementer` marca
     `done` y mueve el resumen a `progress/history.md`.
   - `CHANGES_REQUESTED -> progress/review_<name>.md` → relanza al
     `implementer` con las correcciones listadas.

## Reglas duras

- ❌ NO edites tú mismo el código (`layers.sourceRoot`), `docs/api/openapi.yaml`, ni
  marques `done`.
- ❌ NO saltes al `implementer` si la feature no está en `spec_ready`.
- ❌ NO aceptes resultados del subagente que vengan en chat sin
  referencia a archivo.
- ✅ Una sola feature por sesión.

## Salida esperada en chat

```
in_progress -> implementer running on specs/<name>/
```

y al cerrar:

```
done -> progress/impl_<name>.md   (reviewer APPROVED)
```
