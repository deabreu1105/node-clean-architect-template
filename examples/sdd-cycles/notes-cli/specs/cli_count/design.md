# Design — cli_count

> Decisiones técnicas para implementar el comando `count`. Apoyado en
> `docs/architecture.md` y `docs/conventions.md`. Solo se documentan los
> puntos donde la feature roza la frontera de esas reglas.

## Alcance y archivos a tocar

| Archivo                  | Cambio                                                                 |
|--------------------------|------------------------------------------------------------------------|
| `src/cli.js`             | Añadir `cmdCount` y registrar la entrada `count` en `COMMANDS`         |
| `tests/test_cli.js`      | Añadir 3 tests nuevos (vacío, varias notas, no modifica el archivo)    |

No se tocan `src/notes.js` ni `src/storage.js`. La feature es puramente
de lectura: invoca `storage.load()` y escribe la longitud por stdout.

## Firma del nuevo subcomando

```js
function cmdCount(positional, flags) {
  // No acepta argumentos: positional debe estar vacío y flags también.
}
```

Entrada registrada en `COMMANDS`:

```js
count: {
  options: {},
  handler: cmdCount,
},
```

## Algoritmo

1. **Rechazar argumentos extra.** Si `positional.length > 0`, lanzar
   `NoteError("count no acepta argumentos")`. Cubre R5 para posicionales.
   (Para flags desconocidas, `parseArgs` con `strict: true` — el modo que
   ya usa `main()` — lanza por sí solo antes de invocar al handler, y
   `main()` ya captura ese error y devuelve `1`.)
2. Cargar notas con `storage.load()`.
3. Escribir `${notes.length}\n` en stdout (incluye el caso 0 → cubre R2).
4. Retornar `0` (cubre R3).

R4 (no modificar el archivo) se cumple **estructuralmente**: `cmdCount`
nunca llama a `storage.save()`. El test correspondiente lo verifica
comparando bytes antes/después.

## Manejo de errores

- Reutilizar `NoteError` ya definido en `src/notes.js`. No se introducen
  nuevas excepciones.
- El handler global `main()` captura `NoteError`, imprime a `stderr` con
  `console.error()` y retorna `1`. Mismo patrón que `cmdEdit` cuando
  faltan flags y que `cmdRecent` con `--limit` inválido.

## Formato de salida

Una sola línea con el entero seguida de `\n`. Sin sufijos, prefijos ni
ceros a la izquierda. Ejemplo para 3 notas:

```
3
```

Y para archivo vacío:

```
0
```

## Alternativa descartada

**Alternativa A: leer el JSON sin parsearlo y contar entradas con un
regex.** Sería marginalmente más rápido al evitar `JSON.parse` para
archivos grandes. Se descarta porque:

- El dataset esperado es pequeño (notas personales en un JSON local).
- Romper la abstracción de `storage.load()` introduce un camino paralelo
  de lectura que hay que mantener.
- `docs/architecture.md` desaconseja optimizaciones prematuras.

## Riesgos / notas

- **Archivo corrupto.** Si `notes.json` existe pero no es JSON válido,
  `storage.load()` propaga el `SyntaxError` nativo de `JSON.parse`. Ese
  no es un `NoteError`, así que `main()` lo dejará escapar como stack
  trace. Comportamiento aceptado: ningún comando del CLI maneja archivos
  corruptos hoy (mismo riesgo que `list`, `recent`, etc.). No se añade
  manejo específico en esta feature.
- **`count` con un archivo de notas inexistente.** `storage.load()`
  devuelve `[]` cuando no existe. `[].length === 0` → imprime `0`. Sin
  rama especial.
