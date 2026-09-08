# Implementación — cli_recent

**Feature:** #7 — `cli_recent`
**Estado final:** `done`
**Spec:** `specs/cli_recent/`

## Archivos tocados

- `src/cli.js` — añadido `cmdRecent` y entrada `recent` en el diccionario
  `COMMANDS` con `options.limit` (`type: "string"`).
- `tests/test_cli.js` — añadidos 5 tests (default, custom, vacío, limit 0,
  limit negativo) y el helper `addRaw(title, body, createdAt)` para
  inyectar `created_at` controlado sin pasar por `Note.new()`.

## Trazabilidad

- R1 → `test recent default limit orders by created_at desc`
- R2 → `test recent custom limit`
- R3 → `test recent default limit orders by created_at desc`
- R4 → `test recent custom limit` (verifica formato `<id>\t<created_at>\t<title>`)
- R5 → `test recent empty outputs nothing`
- R6 → `test recent invalid limit zero` + `test recent invalid limit negative`
- R7 → `test recent invalid limit zero` + `test recent invalid limit negative`
  (verifican que el archivo de notas no cambia en disco)

## Verificación

```
$ ./init.sh
...
[OK]    Todos los tests pasan
[OK]    Entorno listo. Puedes empezar a trabajar.
```

29 tests pasan (3 storage + 5 notes + 21 cli).
