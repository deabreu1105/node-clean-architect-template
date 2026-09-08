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
  cubrible por un test concreto).
- `sdd` — `true` por defecto para features nuevas. Solo `false` si el
  humano lo pide explícitamente para algo trivial que no merece spec.

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
     "status": "pending"
   }
   ```

3. Insértalo al final del array `features` (antes del `]`).
4. Verifica que el JSON sigue siendo válido:

   ```bash
   node -e 'JSON.parse(require("fs").readFileSync("feature_list.json","utf8"))'
   ```

5. Ejecuta `./init.sh`. Tiene que terminar verde (las features `pending`
   con `sdd:true` no requieren spec todavía).

## Reglas duras

- ❌ NO toques el estado de features existentes.
- ❌ NO crees la carpeta `specs/<name>/` — eso lo hace el `spec_author`
  cuando arranque el flujo SDD.
- ❌ NO uses `id` duplicado ni `name` duplicado.
- ✅ Cada `acceptance` debe ser **verificable** (algo que un test pueda
  comprobar). Si no, pide al humano que lo concrete.

## Salida esperada en chat

```
added -> feature #<N> <name> (pending, sdd:true)
```
