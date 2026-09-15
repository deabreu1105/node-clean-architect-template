---
description: Añade una feature nueva al feature_list.json (status pending) con su acceptance criteria.
---

# /add-feature

Pide los datos al humano y añade una entrada al `feature_list.json`.
Puedes editar `feature_list.json` directamente (no es código).

## Datos a recoger del humano

Si alguno falta, **pregunta antes de escribir**:

- `name` — `snake_case`, único, coincide con `specs/<name>/`.
- `title` — frase corta humana.
- `description` — 1–2 frases describiendo qué hace.
- `acceptance` — lista de criterios verificables (cada uno debe ser
  cubrible por un test concreto). Si el humano tiene escenarios Gherkin completos
  (`Característica`/`Escenario`/`Dado`/`Cuando`/`Entonces`), `acceptance` sigue siendo
  frases cortas — una por escenario, resumida — nunca el bloque Gherkin íntegro dentro
  del JSON. El Gherkin completo se le entrega al `spec_author` aparte (pegado en el
  chat, o anotado en `progress/current.md`) cuando toque redactar el spec: él lo
  preserva verbatim en `requirements.md` (ver `docs/specs.md` § Escenarios de origen).
- `sdd` — `true` por defecto para features nuevas. Solo `false` si el
  humano lo pide explícitamente para algo trivial que no merece spec.
- `api` — `true` si la feature expone o cambia algo por HTTP (necesita pasar por
  `docs/api/openapi.yaml` antes del spec, ver `docs/api-design.md`). `false` en
  cualquier otro caso (lógica interna, tooling, etc.). Pregunta si no es obvio por la
  descripción.
- `jira` — **opcional**. Solo si el humano lo menciona (ya tiene la Story creada en
  Jira, p. ej. `PROJ-123`). Nunca lo preguntes de forma proactiva ni bloquees la
  creación de la feature por su ausencia. Ver `docs/jira-mapping.md`.

## Paso a paso

1. Lee `feature_list.json` y calcula el siguiente `id`: el mayor de los
   existentes más uno, o **`1` si `features` está vacío** (es el caso de un
   proyecto recién creado desde el template — `Math.max()` sobre un array
   vacío no da 0, da `-Infinity`).
2. Construye el bloque JSON respetando el orden de campos del resto:

   ```json
   {
     "id": <N>,
     "name": "<name>",
     "title": "<title>",
     "description": "<description>",
     "acceptance": [
       "<criterio 1>",
       "<criterio 2>"
     ],
     "sdd": true,
     "api": false,
     "status": "pending"
   }
   ```

   Si el humano dio un `jira`, añádelo como campo adicional (p. ej. tras `title`):
   `"jira": "PROJ-123"`. Sin él, el bloque no lleva el campo — nunca lo rellenes con un
   valor inventado ni con `null`.

3. Insértalo al final del array `features` (antes del `]`).
4. Verifica que el JSON sigue siendo válido:

   ```bash
   node -e 'JSON.parse(require("fs").readFileSync("feature_list.json","utf8"))'
   ```

5. Ejecuta `./init.sh`. Tiene que terminar verde (las features `pending`
   con `sdd:true` no requieren spec todavía, ni `api:true` requiere contrato todavía).

## Reglas duras

- ❌ NO toques el estado de features existentes.
- ❌ NO crees la carpeta `specs/<name>/` — eso lo hace el `spec_author`
  cuando arranque el flujo SDD.
- ❌ NO uses `id` duplicado ni `name` duplicado.
- ✅ Cada `acceptance` debe ser **verificable** (algo que un test pueda
  comprobar). Si no, pide al humano que lo concrete.

## Salida esperada en chat

```
added -> feature #<N> <name> (pending, sdd:true, api:false)
```
