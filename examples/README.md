# examples/ — material de referencia congelado

Nada de este directorio forma parte de tu proyecto. No lo compila `tsc`, no lo
recorre `pnpm test`, no lo mira `./init.sh` y no lo escanea el guard de la Regla
de Dependencia. Está aquí para consultarlo.

`scripts/scaffold.mjs` te ofrece borrarlo entero al crear un proyecto nuevo.

| Directorio | Qué es | Para qué sirve |
|---|---|---|
| [`auth-mongo/`](auth-mongo/) | Una API REST de autenticación completa (Express 5, Mongoose, JWT, bcrypt) construida con esta misma arquitectura | Ver la arquitectura aplicada a algo real, con las tres capas pobladas. Trae `CLEAN_ARCHITECTURE.md`, un recorrido línea a línea del código |
| [`sdd-cycles/`](sdd-cycles/) | Ciclos SDD reales de otros proyectos | Ver cómo se ven un `requirements.md`, un `design.md`, un `tasks.md` y un informe de review terminados de verdad |

## Por qué se conservan y no se borran

El arnés SDD es fácil de describir y difícil de imaginar. Un `requirements.md` en
EARS escrito de verdad, con su trazabilidad a tests, enseña más que la
especificación del formato. Lo mismo con la arquitectura: el esqueleto de `src/`
demuestra el patrón con una sola ruta, y `auth-mongo/` lo demuestra con un
sistema entero.

## Congelado por diseño

Estos ejemplos **no se actualizan** cuando cambian las convenciones del
proyecto. Si `docs/conventions.md` y un archivo de `examples/` se contradicen,
manda `docs/`. Que un ejemplo quede desfasado no es un bug: es material de
archivo, y así está etiquetado.
