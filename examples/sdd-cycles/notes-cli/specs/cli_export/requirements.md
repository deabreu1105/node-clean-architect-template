# Requirements — cli_export

Feature: `cli_export` (id=9)
Acceptance original: `feature_list.json` §id=9

---

## R1

CUANDO el usuario ejecuta `node src/cli.js export <ruta>`, el sistema DEBE
escribir todas las notas en el archivo en `<ruta>` con formato Markdown.

## R2

El sistema DEBE ordenar las notas por `id` ascendente en el archivo exportado.

## R3

El sistema DEBE representar cada nota como:
- Una sección de nivel 2 con el título: `## <title>`
- Una línea con la fecha: `_<created_at>_`
- Una línea en blanco
- El cuerpo como párrafo: `<body>`
- Una línea en blanco de separación entre notas

## R4

SI la ruta destino ya existe Y no se pasa el flag `--force`, ENTONCES el
sistema DEBE imprimir un mensaje de error en stderr y salir con código != 0
sin modificar ningún archivo.

## R5

CUANDO el usuario pasa el flag `--force` Y la ruta destino ya existe,
el sistema DEBE sobreescribir el archivo existente con el nuevo contenido.

## R6

CUANDO la exportación termina con éxito, el sistema DEBE salir con exit
code 0 sin imprimir nada en stdout.

## R7

SI no hay notas almacenadas, el sistema DEBE crear el archivo en `<ruta>`
con contenido vacío (o solo el encabezado) y salir con exit code 0.
