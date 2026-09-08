# Design — cli_recent

> Decisiones técnicas para implementar el comando `recent`. Apoyado en
> `docs/architecture.md` y `docs/conventions.md`. Solo se documentan los
> puntos donde la feature roza la frontera de esas reglas.

## Alcance y archivos a tocar

| Archivo                  | Cambio                                                                 |
|--------------------------|------------------------------------------------------------------------|
| `src/cli.js`             | Añadir `cmdRecent` y registrar la entrada `recent` en `COMMANDS`       |
| `tests/test_cli.js`      | Añadir 5 tests nuevos (orden por defecto, límite custom, archivo vacío, límite 0, límite negativo) |

No se tocan `src/notes.js` ni `src/storage.js`. La feature es puramente
de presentación: lee notas con `storage.load()`, ordena y filtra en memoria,
imprime con el formato existente.

## Firma del nuevo subcomando

```js
function cmdRecent(positional, flags) {
  // flags.limit: string | undefined  (default 5 si no viene)
}
```

Entrada registrada en `COMMANDS`:

```js
recent: {
  options: { limit: { type: "string" } },
  handler: cmdRecent,
},
```

## Algoritmo

1. **Resolver el límite.** `const limit = flags.limit !== undefined
   ? Number.parseInt(flags.limit, 10) : 5;`
2. **Validación temprana del límite.** Si `!Number.isInteger(limit) || limit <= 0`,
   lanzar `NoteError("--limit debe ser un entero positivo")`. Esto cubre R6 y R7
   (al levantarse antes de `storage.load()`, no se modifica nada — y
   `cmdRecent` nunca llama a `storage.save()`, así que R7 está garantizado
   estructuralmente).
3. Cargar notas con `storage.load()`.
4. Si la lista está vacía, retornar `0` sin imprimir (cubre R5).
5. Ordenar la lista en memoria por `created_at` descendente:
   `[...notes].sort((a, b) => (a.created_at < b.created_at ? 1 : -1))`.
6. Hacer slice `slice(0, limit)`.
7. Para cada nota del slice, escribir
   `${n.id}\t${n.created_at}\t${n.title}\n` en stdout
   (idéntico al `cmdList`, vía el helper `formatRow`).
8. Retornar `0`.

## Manejo de errores

- Reutilizar `NoteError` ya definido en `src/notes.js`. No se introducen
  nuevas excepciones.
- El handler global `main()` captura `NoteError`, imprime a `stderr` con
  `console.error()` y retorna `1`. Mismo patrón que `cmdEdit` cuando
  faltan flags.

## Formato de salida

Idéntico a `cmdList`. Ambos usan el helper privado `formatRow(n)` para
producir `<id>\t<created_at>\t<title>`.

## Ordenación: por qué `created_at` y no `id`

`created_at` está en ISO 8601 generado por `Note.new()`
(`new Date().toISOString().replace(/\.\d{3}Z$/, "+00:00")`). El orden
lexicográfico de ISO 8601 coincide con el orden cronológico, así que un
sort por string es correcto sin parseo.

`id` también es monótonamente creciente, pero el acceptance criterion
exige explícitamente "ordenado por `created_at`", así que se sigue al pie
de la letra. (Si dos notas comparten `created_at` por venir creadas en el
mismo segundo, el orden relativo queda definido por la estabilidad de
`Array.prototype.sort` en Node — suficiente para esta feature.)

## Alternativa descartada

**Alternativa A: mantener un índice ordenado en disco y truncar al añadir.**
Más eficiente en `O(log n)` por inserción frente al `O(n log n)` del sort
en cada `recent`. Se descarta porque:

- El dataset esperado es pequeño (notas personales en un JSON local).
- Romper la simpleza de `storage.js` (un único array) introduciría un
  segundo formato en disco y migración.
- `docs/architecture.md` prioriza claridad sobre optimización prematura.

## Riesgos / notas

- **Límite mayor que el total de notas.** `Array.prototype.slice(0, limit)`
  con `limit > length` devuelve toda la lista sin error. Comportamiento
  aceptado sin requirement explícito.
- **`--limit` con valores no numéricos.** `Number.parseInt("abc", 10)` →
  `NaN`. La comprobación `!Number.isInteger(limit) || limit <= 0` cubre
  ese caso y lanza `NoteError` con el mismo mensaje que el límite ≤ 0.
