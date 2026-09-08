# Tasks — cli_count

> Pasos discretos en orden. El `implementer` marca `[x]` al completar cada
> uno. Cada task referencia los `R<n>` que cubre.

## Implementación

- [x] T1 — Añadir la función `cmdCount(positional, flags)` en `src/cli.js`
  que valida `positional.length === 0` (lanzando `NoteError` si no), carga
  las notas con `storage.load()` y escribe `${notes.length}\n` en stdout.
  Retorna `0`. Cubre: R1, R2, R3, R4, R5.

- [x] T2 — Registrar la entrada `count` en el diccionario `COMMANDS` de
  `src/cli.js` con `options: {}` y `handler: cmdCount`. Cubre: R1, R5.

## Tests

- [x] T3 — Añadir `test count empty prints zero` en `tests/test_cli.js`:
  sin notas previas, ejecuta `count`, verifica exit code `0`, stderr
  vacío y stdout exactamente `"0\n"`. Cubre: R2, R3.

- [x] T4 — Añadir `test count with notes prints total` en
  `tests/test_cli.js`: añade 3 notas vía `add`, ejecuta `count` y
  verifica exit code `0`, stderr vacío y stdout exactamente `"3\n"`.
  Cubre: R1, R3.

- [x] T5 — Añadir `test count does not modify notes file` en
  `tests/test_cli.js`: añade 2 notas, lee los bytes y el contenido del
  archivo, ejecuta `count`, vuelve a leer y verifica que ambos son
  idénticos. Cubre: R4.

- [x] T6 — Añadir `test count rejects extra arguments` en
  `tests/test_cli.js`: ejecuta `count foo`, verifica exit code `!= 0`,
  stdout vacío y stderr no vacío. Cubre: R5.

## Cierre

- [x] T7 — Documentar trazabilidad `R<n>` ↔ test en
  `progress/impl_cli_count.md` siguiendo el ejemplo de `docs/specs.md`.

- [x] T8 — Ejecutar `./init.sh` y comprobar que todos los tests pasan
  (incluyendo los 4 nuevos, total esperado 33). Cubre: verificación
  final antes del review.
