# Diseño de API — metodología API-first

> El contrato OpenAPI es la fuente de verdad de la superficie HTTP: se diseña y se aprueba
> **antes** de que exista `design.md`, y el código se verifica contra él, nunca al revés.
> Este documento es la metodología. El artefacto vive en `docs/api/openapi.yaml`. Para el
> flujo completo de una feature (de la que este contrato es la primera puerta), ver
> `docs/workflow.md`; para el resto del ciclo SDD, `docs/specs.md`.

## Por qué API-first

Sin contrato, la forma de un endpoint se decide implícitamente mientras se escribe el
controller — y queda documentada, en el mejor de los casos, como prosa suelta dentro de
`specs/<name>/design.md`, sin verificación y sin sobrevivir a la feature que la escribió.
API-first invierte el orden: la forma del request y de cada respuesta se fija por escrito y
se aprueba **antes** de decidir cómo se implementa por dentro. Eso hace dos cosas que la
prosa no hace:

- **Es un artefacto único y acumulativo.** `docs/api/openapi.yaml` describe la superficie
  HTTP completa del proyecto, no solo la de la feature en curso. Sobrevive a cada ciclo SDD.
- **Es verificable.** `scripts/check-api-contract.mjs` (checkpoint `C11`) falla si el código
  monta una ruta que el contrato no describe, o si el contrato promete una ruta `live` que
  el código no monta.

## Dónde vive

```
docs/
├── api-design.md        # este archivo — la metodología
└── api/
    └── openapi.yaml      # el contrato — la fuente de verdad
```

Un único archivo YAML, OpenAPI **3.1**, con `$ref` solo internos (`#/components/...`). Sin
bundler ni split: un contrato en un solo archivo se diffea limpio en cada PR de feature, y
es justo lo que necesita el guard N1+N2 (ver más abajo) sin tener que resolver referencias
externas.

## Anatomía de una operación

Cada operación (`paths.<ruta>.<método>`) lleva, además de lo estándar de OpenAPI, dos
extensiones `x-` **obligatorias**:

```yaml
paths:
  /api/health:
    get:
      operationId: getHealth
      x-feature: health        # el `name` de la feature en feature_list.json que la posee
      x-status: live           # live | planned
```

| Extensión | Significado |
|---|---|
| `x-feature` | El `name` (snake_case) de la feature de `feature_list.json` dueña de la operación. Ata el contrato al backlog — es el equivalente de `Cubre: R<n>` en `tasks.md`, pero a nivel de superficie HTTP. |
| `x-status` | `planned` — diseñada, todavía sin ruta montada en `src/`. `live` — implementada y montada; el guard exige que exista de verdad. |

`x-status: planned` es lo que permite diseñar varias operaciones de golpe con
`/design-api` antes de implementar ninguna: el guard no falla por una operación `planned`
sin ruta montada, solo por una `live` que no está.

## Reglas duras

- Cada operación tiene `operationId` en **camelCase**, único en todo el documento — es lo
  que el `spec_author` cita en `design.md` y el `implementer` usa para el nombre del
  método/handler.
- Cada operación tiene `x-feature` y `x-status`. Sin ellas, el guard falla (`C11`).
- La respuesta de error es **siempre** `{ "error": string }` — es la única forma que
  produce `handleError` en cualquier controller de este template (ver
  `src/presentation/health/controller.ts`). No inventes otra forma de error.
- Los códigos de error reutilizan `components/responses/{BadRequest,Unauthorized,
  Forbidden,NotFound,InternalServerError}`, que mapean 1:1 a las factories de
  `CustomError` (`docs/conventions.md`). No definas un error de statusCode nuevo sin
  antes comprobar que hace falta una factory nueva en `domain/errors/custom.error.ts`.
- Todo schema de una respuesta `2xx` tiene que ser expresable como la proyección pública
  de una entidad (`entity.toPublic(...)`, checkpoint `C6`). Si una operación exige exponer
  algo que no cabe en una proyección así, el diseño está mal — no el contrato.
- ❌ Nunca describas en el contrato una operación que rompa la Regla de Dependencia para
  implementarla (p. ej., algo que solo se pueda resolver importando una librería vetada
  directamente en `domain/`). Si la feature parece exigirlo, replantea con un puerto.
- ❌ Nunca uses `$ref` externos (a otro archivo o URL). Solo `#/components/...`.

## Cómo se verifica

`scripts/check-api-contract.mjs` corre en `./init.sh` §4b y es el checkpoint `C11` de
`CHECKPOINTS.md`. Dos niveles:

**N1 — el contrato es válido en sí mismo:**
- Parsea como YAML y declara `openapi: 3.1.x`.
- Todo `$ref` es interno y resuelve.
- Todo `operationId` está presente y es único.
- Toda operación trae `x-feature` (string) y `x-status` (`live` | `planned`).
- Toda feature con `"api": true` en un estado que lo exige tiene al menos una operación
  con su `x-feature`.

**N2 — no hay deriva entre el contrato y el código.** El guard importa
`src/presentation/routes.ts`, invoca la factory de rutas con puertos inertes (nunca
ejecuta lógica de negocio: los puertos son proxies que no hacen nada si se llaman) y
recorre el árbol de routers real para obtener la lista de rutas **realmente montadas**.
Compara esa lista contra las operaciones `live` del contrato:

| Situación | Veredicto |
|---|---|
| Ruta montada sin operación en el contrato | FAIL |
| Operación `live` sin ruta montada | FAIL |
| Operación `planned` sin ruta montada | OK — todavía no le toca |
| Ruta montada cuya operación sigue en `planned` | FAIL — se olvidó flipar a `live` al implementar |

Correr el guard suelto, sin el resto de `./init.sh`:
```bash
pnpm exec tsx scripts/check-api-contract.mjs
```

## La correspondencia contrato → código

El mapa que usa el `implementer` para traducir una operación aprobada en archivos reales:

| Elemento OpenAPI | Dónde aterriza en `src/` |
|---|---|
| `paths` (ruta completa) | prefijo en `presentation/routes.ts` (`router.use('/api/health', ...)`) + sufijo en `presentation/<recurso>/routes.ts` (`router.get('/', ...)`) — el path completo solo existe componiendo los dos archivos |
| método HTTP + `operationId` | el handler montado: `router.get('/', controller.getHealth)` |
| `parameters` (query/path) | el argumento de `XQueryDto.create(req.query)` y sus validaciones en `domain/dtos/` |
| `requestBody` | el argumento de `XDto.create(req.body)` |
| schema de una respuesta `2xx` | la interfaz `Public*` exportada junto a la entidad, lo que devuelve `entity.toPublic(...)` |
| schemas de `4xx`/`5xx` | siempre `components/schemas/Error` (`{ error: string }`) + el `statusCode` de la factory de `CustomError` usada |
| `info.title` / `servers[].url` | `project.displayName` de `harness.config.json` / `envs.PORT` |

## Anti-patrones (no hacer)

- ❌ Describir el contrato **después** de escribir el controller — eso no es API-first, es
  documentación tardía con otro nombre.
- ❌ Dejar una operación en `planned` cuando la ruta ya está montada. El guard lo detecta,
  pero no esperes a que lo detecte: flipa `x-status` en la misma task que monta la ruta.
- ❌ Copiar la forma exacta de una entidad de dominio en el schema de respuesta en vez de
  su proyección pública — el checkpoint `C6` existe también para el contrato, no solo para
  el código.
- ❌ Añadir un `$ref` externo o una dependencia de validación en tiempo de ejecución
  (`ajv`, `zod`, un middleware que valide contra el YAML). El contrato es documentación
  verificada estáticamente, no un validador de runtime — eso metería una dependencia
  nueva en `src/` sin que se haya discutido, y la Regla de Dependencia no distingue entre
  una librería «solo para validar» y cualquier otra.

## Restricción conocida del guard

Los puertos que recibe la factory de rutas durante el guard son proxies inertes: si algún
día una factory de rutas **invoca** un puerto durante el wiring (en vez de solo pasarlo
por parámetro), el guard puede comportarse de forma inesperada. Eso, si ocurre, es en sí
mismo un olor de diseño — el wiring no debe ejecutar lógica de negocio — así que trátalo
como una señal de que el composition root se está desviando del patrón, no como un bug del
guard.
