# Requirements — cli_stats

Este spec define las especificaciones para el comando `stats`, el cual muestra métricas agregadas sobre las notas almacenadas.

## R1
CUANDO el usuario ejecuta `node src/cli.js stats`, el sistema DEBE imprimir en stdout:
- El número total de notas.
- La fecha de creación de la nota más antigua.
- La fecha de creación de la nota más reciente.
- La longitud media del cuerpo de las notas (como un entero redondeado, en caracteres).

## R2
El sistema DEBE dar formato a la salida de `stats` imprimiendo una línea por cada métrica bajo la estructura `clave: valor`. Las claves deben ser:
- `total_notes`
- `oldest_date`
- `newest_date`
- `avg_body_length`

## R3
MIENTRAS no existan notas almacenadas, el sistema DEBE imprimir únicamente el mensaje `sin notas` por stdout y salir con código 0.

## R4
El sistema NO DEBE modificar el contenido ni la estructura del archivo de almacenamiento de notas al ejecutar el comando `stats`.

## R5
SI el comando `stats` recibe argumentos adicionales no reconocidos ENTONCES el sistema DEBE imprimir un mensaje de error claro en stderr y salir con código diferente de 0.
