# Requirements — cli_count

> Feature #8 del `feature_list.json`. Comando `count` que imprime el
> número total de notas almacenadas.
>
> Cada requirement está redactado en EARS estricto y es verificable por al
> menos un test concreto en `tests/test_cli.js`.

## R1
CUANDO el usuario ejecuta `node src/cli.js count` y existen `N` notas
almacenadas (`N >= 1`), el sistema DEBE imprimir en stdout una única
línea con el entero `N` y nada más.

## R2
CUANDO el usuario ejecuta `node src/cli.js count` y no existe ninguna
nota almacenada (archivo vacío o inexistente), el sistema DEBE imprimir
en stdout una única línea con `0`.

## R3
CUANDO el usuario ejecuta `node src/cli.js count`, el sistema DEBE salir
con exit code `0`.

## R4
CUANDO el usuario ejecuta `node src/cli.js count`, el sistema NO DEBE
modificar el archivo de notas (ni su contenido ni su mtime mediante
escritura).

## R5
SI el usuario pasa argumentos posicionales o flags adicionales a `count`
(p. ej. `count foo` o `count --limit 3`) ENTONCES el sistema DEBE salir
con exit code distinto de `0` y escribir un mensaje de error en stderr.

## Trazabilidad con `acceptance` del feature_list.json

| Acceptance criterion (feature #8)                                        | Cubierto por |
|--------------------------------------------------------------------------|--------------|
| `node src/cli.js count` imprime un entero único: el número total de notas | R1, R3       |
| Si no hay notas, imprime `0`                                             | R2, R3       |
| El comando no modifica el archivo de notas                               | R4           |
| tests/test_cli.js cubre: archivo vacío y archivo con varias notas        | R1, R2 (vía tests) |

R5 es una salvaguarda extra (rechazar argumentos inesperados) consistente
con el modo `strict: true` que ya usa `parseArgs` en el resto del CLI.
No aparece en el `acceptance` original pero es trivialmente verificable
y evita ambigüedades futuras.
