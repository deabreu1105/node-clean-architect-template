# Tasks — cli_export

## Checklist de implementación

- [x] T1 — Añadir imports `existsSync`, `writeFileSync` y `resolve` en `src/cli.js`. Cubre: R1, R4, R5.

- [x] T2 — Implementar `cmdExport(positional, flags)` en `src/cli.js`:
  - Validar que `positional[0]` existe, si no lanzar `NoteError`. Cubre: R1.
  - Resolver ruta absoluta con `resolve()`. Cubre: R1.
  - Si `existsSync(ruta) && !flags.force`, lanzar `NoteError` con mensaje claro. Cubre: R4.
  - Cargar notas con `storage.load()`. Cubre: R1, R7.
  - Ordenar por `id` ascendente. Cubre: R2.
  - Construir string Markdown con el formato `## title / _created_at_ / body`. Cubre: R3.
  - Escribir con `writeFileSync`. Cubre: R1, R5, R6.
  - Devolver `0`. Cubre: R6.

- [x] T3 — Registrar `export` en el mapa `COMMANDS` con opción `--force: boolean`. Cubre: R4, R5.

- [x] T4 — Añadir test `"export creates markdown file"` en `tests/test_cli.js`:
  - Añadir varias notas, exportar a ruta temporal, leer el archivo y verificar formato Markdown. Cubre: R1, R2, R3.

- [x] T5 — Añadir test `"export fails if file exists without --force"` en `tests/test_cli.js`:
  - Crear archivo previo en la ruta, ejecutar export sin `--force`, verificar exit code != 0 y archivo sin cambios. Cubre: R4.

- [x] T6 — Añadir test `"export overwrites with --force"` en `tests/test_cli.js`:
  - Crear archivo previo, ejecutar export con `--force`, verificar que el archivo contiene el Markdown correcto. Cubre: R5.

- [x] T7 — Añadir test `"export with no notes creates empty file"` en `tests/test_cli.js`:
  - Ejecutar export sin haber añadido notas, verificar exit code 0 y archivo creado (vacío o `""`). Cubre: R7.

## Orden de ejecución

T1 → T2 → T3 → T4 → T5 → T6 → T7

Los tests (T4–T7) se añaden en `tests/test_cli.js` al mismo `describe("cli")` existente,
siguiendo el patrón: `beforeEach` crea directorio temporal, `afterEach` lo limpia.
