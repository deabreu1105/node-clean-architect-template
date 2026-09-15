---
description: Convierte un hallazgo de seguridad SEC-NNN en una feature pending del feature_list.json.
---

# /fix-finding

Convierte `docs/security/findings/SEC-NNN-<slug>.md` en una entrada `pending` de
`feature_list.json`, para que entre al flujo SDD normal (`docs/specs.md`). Puedes editar
`feature_list.json` y el frontmatter del hallazgo directamente — no es código.

## Pre-condiciones

- El humano da un `id` (`SEC-NNN`). Si no lo da, lista los hallazgos en
  `status: open` de `docs/security/findings/` y pregunta cuál.
- El archivo `docs/security/findings/SEC-NNN-*.md` existe. Si no, **para** y repórtalo.
- Su `status` en el frontmatter es `open`. Si ya es `feature`, `fixed`, `accepted_risk`
  o `false_positive`, **para** y reporta el estado actual — no lo dupliques.

## Paso a paso

1. Ejecuta `./init.sh`. Si falla, **para**.
2. Lee `docs/security/findings/SEC-NNN-<slug>.md` completo: título, severidad,
   `## Acceptance criteria propuestos`, `## Superficie HTTP afectada`.
3. Lee `feature_list.json` y calcula el siguiente `id`: el mayor de los existentes más
   uno, o **`1` si `features` está vacío** (`Math.max()` sobre un array vacío da
   `-Infinity`, no `0`).
4. Construye el bloque JSON respetando el orden de campos del resto:

   ```json
   {
     "id": <N>,
     "name": "sec_<nnn>_<slug>",
     "title": "Fix SEC-<NNN> — <título del hallazgo>",
     "description": "Remediación del hallazgo SEC-<NNN> (<severidad>). Ver docs/security/findings/SEC-<NNN>-<slug>.md",
     "acceptance": [
       "<copiados literalmente de '## Acceptance criteria propuestos' del hallazgo>"
     ],
     "sdd": true,
     "api": <true si '## Superficie HTTP afectada' del hallazgo dice api: true, si no false>,
     "status": "pending"
   }
   ```

5. Insértalo al final del array `features`.
6. Actualiza el frontmatter del hallazgo: `status: feature`, `feature: <name>`. Rellena
   también `## Trazabilidad → Feature` con el `name` nuevo.
7. Verifica que el JSON sigue siendo válido:
   ```bash
   node -e 'JSON.parse(require("fs").readFileSync("feature_list.json","utf8"))'
   ```
8. Ejecuta `./init.sh`. Tiene que terminar verde.

## Reglas duras

- ❌ NO edites nada bajo `layers.sourceRoot` (`src/`).
- ❌ NO crees `specs/<name>/` — eso lo hace el `spec_author` cuando arranque el flujo SDD
  normal (`/implement-next` o el `leader`).
- ❌ NO lances al `spec_author` ni a ningún otro subagente — la puerta de aprobación del
  spec sigue siendo del humano, igual que para cualquier otra feature.
- ❌ NO toques el estado de otras features ni de otros hallazgos.
- ❌ NO uses `id` ni `name` duplicado.
- ✅ Los `acceptance` copiados deben seguir siendo verificables por un test — si el
  hallazgo no los dejó así de concretos, pide al humano que los precise antes de
  insertar la feature.

## Salida esperada en chat

```
feature #4 sec_001_jwt_sin_exp (pending, sdd:true, api:false) <- docs/security/findings/SEC-001-jwt-sin-exp.md
```
