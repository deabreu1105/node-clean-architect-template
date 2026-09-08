# Feature detenida en la puerta de aprobación

`hello_world` era un endpoint `GET /api/hello` cuyo mensaje se armaba leyendo
`APP_NAME`, pensado como ejercicio de las tres capas. Llegó a `spec_ready` — con
sus doce requirements en EARS, su diseño y sus catorce tasks — y **nunca se
implementó**: se detuvo exactamente donde el arnés obliga a detenerse, esperando
que un humano leyera el spec y dijera "aprobado".

Se conserva por eso: es el ejemplo de qué hay en disco cuando una feature está
en `spec_ready`, y de que la puerta de aprobación es real.

El esqueleto de la raíz acabó implementando `GET /api/health`, que cubre lo
mismo y además ejercita un DTO y una frontera de proyección, cosas que este
diseño no tenía.

- `docs/2026-09-01-hello-world-endpoint-design.md` — salida del `ideator`
- `specs/hello_world/{requirements,design,tasks}.md` — salida del `spec_author`,
  con las catorce tasks todavía en `[ ]`
