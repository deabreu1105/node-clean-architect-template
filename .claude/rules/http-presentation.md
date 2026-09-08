---
paths:
  - "src/presentation/**/*.ts"
---

# Capa de entrega (HTTP)

- **Nunca** hagas `new` de una clase concreta de `infrastructure/` aquí. Los puertos
  llegan ya construidos por parámetro desde el composition root.
- Si el DTO devuelve error en el primer slot de la tupla, responde `400` de inmediato y
  no sigas.
- Errores: `instanceof` de la clase de error tipado → usa su `statusCode`. En cualquier
  otro caso, loguea y devuelve `500`. **Nunca** mandes un stack trace al cliente.
- **Nunca** serialices una entidad del dominio ni un documento crudo de la base de datos
  en una respuesta: pasa siempre por el método de proyección pública de la entidad.
- El usuario autenticado vive en `req.user`, nunca en `req.body.user` — `req.body` es del
  cliente.
- Cada endpoint nuevo trae su archivo en `request/*.rest`.

Racional y ejemplos: `docs/architecture.md` y `CHECKPOINTS.md` C5/C6/C7.
