# Design — cli_export

## Archivos a modificar

| Archivo | Operación |
|---|---|
| `src/cli.js` | Añadir `cmdExport` y registrar subcomando `export` en `COMMANDS` |

No se crean archivos nuevos. No se toca `storage.js` ni `notes.js`.

## Firma nueva

```js
function cmdExport(positional, flags)
```

- `positional[0]`: ruta destino (string, obligatoria — lanza `NoteError` si falta).
- `flags.force`: boolean (flag `--force`, booleano, default `false`).
- Devuelve `0` en éxito.
- Lanza `NoteError` si la ruta ya existe y no hay `--force`.

## Registro en COMMANDS

```js
export: {
  options: { force: { type: "boolean", default: false } },
  handler: cmdExport,
},
```

## Algoritmo de `cmdExport`

1. Leer `positional[0]`; si es `undefined`, lanzar `NoteError("export requiere una ruta destino")`.
2. Resolver ruta absoluta con `node:path`.
3. Si el archivo existe (`fs.existsSync(ruta)`) y `!flags.force`, lanzar `NoteError("el archivo ya existe; usa --force para sobreescribir")`.
4. Cargar notas con `storage.load()`.
5. Ordenar por `id` ascendente.
6. Construir el contenido Markdown:
   ```
   ## <title>
   _<created_at>_

   <body>

   ```
   (una línea en blanco entre secciones)
7. Escribir con `fs.writeFileSync(ruta, contenido, "utf8")` — no necesita atomicidad (no es `notes.json`).
8. Devolver `0`.

## Formato Markdown exacto (R3)

```markdown
## Título de la nota
_2024-01-15T10:30:00.000Z_

Cuerpo de la nota.

## Segunda nota
_2024-01-16T08:00:00.000Z_

Cuerpo de la segunda nota.
```

- Separación entre notas: una línea en blanco tras el cuerpo.
- Si no hay notas: archivo vacío (string `""`).

## Alternativa descartada

**Atomicidad (write-to-tmp + rename):** Se descartó para el archivo exportado
porque la atomicidad protege el archivo de notas de la aplicación
(`notes.json`) ante fallo de proceso. Un export Markdown es un artefacto
desechable — si el proceso muere a mitad, el usuario simplemente reexporta.
Añadir la complejidad de `renameSync` aquí violaría YAGNI sin beneficio real.

## Imports adicionales en `cli.js`

```js
import { existsSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
```

Estos módulos son stdlib (`node:`), coherente con la regla de sin dependencias externas.
