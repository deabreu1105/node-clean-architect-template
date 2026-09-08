# Implementer report — cli_count

## Resultado

`done` — 33/33 tests pasan (29 previos + 4 nuevos de `count`).

## Archivos tocados

- `src/cli.js` — añadido `cmdCount` + entrada `count` en `COMMANDS`.
- `tests/test_cli.js` — añadidos 4 tests (`count empty`, `count with notes`,
  `count does not modify`, `count rejects extra arguments`).

## Trazabilidad R ↔ test

| Requirement | Test                                         |
|-------------|----------------------------------------------|
| R1          | `count with notes prints total`              |
| R2          | `count empty prints zero`                    |
| R3          | `count empty prints zero`, `count with notes prints total` (asserts `code === 0`) |
| R4          | `count does not modify notes file`           |
| R5          | `count rejects extra arguments`              |

## Desviaciones del design

Ninguna. `cmdCount` se ajusta literalmente al algoritmo descrito.

## Comando de verificación

```
./init.sh   # 33 pass / 0 fail
```
