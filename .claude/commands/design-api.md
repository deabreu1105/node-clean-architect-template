---
description: Diseña o extiende el contrato OpenAPI (docs/api/openapi.yaml) para una feature pending con "api":true, o la superficie completa del proyecto.
---

# /design-api

Lanza el subagente `api_designer` definido en
[.claude/agents/api_designer.md](../agents/api_designer.md). No edites el contrato tú
mismo — eso es su trabajo.

## Dos modos

- **Sin argumentos, o pidiendo revisar/ampliar la superficie completa**: el `api_designer`
  diseña o extiende `docs/api/openapi.yaml` para varios recursos de golpe (típicamente al
  arrancar el proyecto). Las operaciones nuevas nacen `x-status: planned`.
- **Con una feature concreta en mente** (la primera `pending` con `"api": true`, o la que
  el humano nombre): el `api_designer` diseña solo sus operaciones y la deja
  `contract_ready`.

## Paso a paso

1. Ejecuta `./init.sh`. Si falla, **para**.
2. Si el humano no dio una feature concreta, lee `feature_list.json` y localiza la
   primera `pending` con `"api": true`. Si no hay ninguna y tampoco se pidió diseño
   global, dilo y ofrece las dos opciones (`/add-feature` primero, o diseño global ahora).
3. Lanza `api_designer` con el modo correspondiente.
4. **Regla anti-teléfono-descompuesto**: el `api_designer` escribe en disco
   (`docs/api/openapi.yaml`) y devuelve una sola línea. No reproduzcas el contrato en
   chat.

## Reglas duras

- ❌ NO edites `docs/api/openapi.yaml` tú mismo.
- ❌ NO lances al `spec_author` a continuación — esa es la puerta 3, y necesita
  aprobación humana explícita del contrato primero (`/approve-contract`).
- ❌ NO marques ninguna operación como `x-status: live` — eso es del `implementer`.

## Salida esperada en chat

```
contract_ready -> docs/api/openapi.yaml (getHealth)   (esperando aprobación humana)
```
o, en modo global:
```
contract_updated -> docs/api/openapi.yaml (getHealth, listUsers)
```
