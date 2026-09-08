# Tasks — cli_recent

> Pasos discretos en orden. El `implementer` marca `[x]` al completar cada
> uno. Cada task referencia los `R<n>` que cubre.

## Implementación

- [x] T1 — Añadir la función `cmdRecent(positional, flags)` en `src/cli.js` que:
  resuelve `limit` (default 5), valida `Number.isInteger(limit) && limit > 0`
  (lanzando `NoteError` si no), carga las notas con `storage.load()`, las
  ordena por `created_at` descendente, aplica `slice(0, limit)` e imprime
  cada una con `formatRow(n)`. Cubre: R1, R2, R3, R4, R5, R6, R7.

- [x] T2 — Registrar la entrada `recent` en el diccionario `COMMANDS` de
  `src/cli.js` con `options: { limit: { type: "string" } }` y
  `handler: cmdRecent`. Cubre: R1, R2.

## Tests

- [x] T3 — Añadir `test recent default limit orders by created_at desc` en
  `tests/test_cli.js`: crea > 5 notas (vía el helper `addRaw` que escribe
  directamente al storage con `created_at` controlado), ejecuta `recent`
  sin flags y verifica que se imprimen exactamente 5 líneas en orden
  descendente por `created_at`. Cubre: R1, R3.

- [x] T4 — Añadir `test recent custom limit` en `tests/test_cli.js`:
  crea N notas, ejecuta `recent --limit K` con `K < N`, verifica que se
  imprimen exactamente `K` líneas y que cada línea respeta el formato
  `<id>\t<created_at>\t<title>`. Cubre: R2, R4.

- [x] T5 — Añadir `test recent empty outputs nothing` en
  `tests/test_cli.js`: sin notas previas, ejecuta `recent`, verifica
  exit code `0` y stdout vacío. Cubre: R5.

- [x] T6 — Añadir `test recent invalid limit zero` y
  `test recent invalid limit negative` en `tests/test_cli.js`: con notas
  presentes, ejecuta `recent --limit 0` y `recent --limit -3`
  respectivamente; verifica que exit code es `!= 0`, stdout vacío, stderr
  no vacío, y que el archivo de notas en disco no ha cambiado. Cubre: R6, R7.

## Cierre

- [x] T7 — Documentar trazabilidad `R<n>` ↔ test en
  `progress/impl_cli_recent.md` siguiendo el ejemplo de `docs/specs.md`.

- [x] T8 — Ejecutar `./init.sh` y comprobar que todos los tests pasan
  (incluyendo los nuevos). Cubre: verificación final antes del review.
