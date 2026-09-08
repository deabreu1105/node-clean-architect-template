---
paths:
  - "src/**/*.test.ts"
---

# Tests

- Colocados: el test vive junto al archivo que prueba, con el mismo nombre + `.test.ts`.
- `node:test` + `node:assert/strict`. **Sin librería de mocking** y sin framework extra.
- Los dobles son objetos literales escritos a mano y **tipados contra el puerto abstracto**
  del dominio. Nunca se mockea la librería concreta ni la implementación de infraestructura.
- Cero I/O real: nada de base de datos, nada de `.env`, nada de servidor HTTP levantado.
- Cubre el camino feliz **y** al menos un camino de error si la pieza puede fallar.
- Afirma el resultado concreto (`assert.equal` / `deepEqual` / `rejects` con predicado),
  no `doesNotThrow`.
- Nombres de test descriptivos, en forma de frase.

Racional y ejemplos: `docs/conventions.md` § Tests y `docs/verification.md` Nivel 1.
