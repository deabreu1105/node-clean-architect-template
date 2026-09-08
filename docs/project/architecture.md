## Arquitectura de este proyecto

Los principios normativos genéricos están en `docs/architecture.md`. Aquí solo está lo
**concreto de este proyecto**: qué clases existen, qué puertos hay, dónde se compone todo
y cuáles son las excepciones sancionadas. Es lo que el `reviewer` consulta cuando
`CHECKPOINTS.md` dice «la lista de este proyecto está en `docs/project/architecture.md`».

> **Este archivo se reescribe por proyecto.** Al crear uno nuevo, sustituye el contenido
> por el de tu dominio.

```
src/
├── app.ts                                  ★ composition root (ver abajo)
├── config/                                 SOLO carga de entorno (barrel: index.ts)
│   └── envs.ts                             PORT, APP_NAME validados con env-var
├── domain/                                 ★ núcleo — cero dependencias externas
│   ├── validators.ts                       Validators.boolean — usado por los DTOs
│   ├── entities/health-status.entity.ts    HealthStatusEntity + toPublic(verbose)
│   ├── dtos/health/health-query.dto.ts     ctor privado + factory → [error?, dto?]
│   ├── repositories/health.repository.ts   contrato abstracto + HealthSnapshot
│   ├── use-cases/health/get-health.use-case.ts   GetHealth(repository, clock)
│   ├── interfaces/clock.interface.ts       Clock = () => Date  ← puerto de función
│   └── errors/custom.error.ts              CustomError + factories por statusCode
├── infrastructure/                         implementa los contratos de domain
│   ├── adapters/system-clock.adapter.ts    systemClock: Clock
│   └── repositories/health.repository.impl.ts   único archivo que lee config/
└── presentation/                           capa HTTP (Express)
    ├── server.ts                           clase Server: port + routes inyectados
    ├── routes.ts                           AppRoutes.routes(healthRepository, clock)
    └── health/{controller.ts,routes.ts}
```

### Composition root

`src/app.ts` es el **único** lugar que construye clases concretas de `infrastructure`:

```ts
const healthRepository = new HealthRepositoryImpl();

await new Server({
  port: envs.PORT,
  routes: AppRoutes.routes( healthRepository, systemClock ),
}).start();
```

`AppRoutes.routes` y `HealthRoutes.routes` reciben los puertos ya construidos por
parámetro. Al añadir un recurso nuevo, la composición se hace aquí — no hagas `new` de una
clase de `infrastructure` en ningún sitio bajo `presentation/`.

### Puertos de este proyecto

| Puerto | Definido en | Implementado por | Inyectado en |
|---|---|---|---|
| `HealthRepository` | `domain/repositories/` | `HealthRepositoryImpl` (infrastructure) | `GetHealth`, vía el controller |
| `Clock` | `domain/interfaces/` | `systemClock` (infrastructure) | `GetHealth`, vía el controller |

### Fronteras de salida

| Entidad | Método de proyección | Qué expone |
|---|---|---|
| `HealthStatusEntity` | `.toPublic(verbose)` | `{status, appName}`, y con `verbose` además `uptimeSeconds`, `nodeVersion`, `checkedAt` |

Ninguna respuesta serializa la entidad directamente. Es el checkpoint `C6`.

### Superficie HTTP

La fuente de verdad es [`docs/api/openapi.yaml`](../api/openapi.yaml) (metodología en
`docs/api-design.md`). Cada operación declara `x-feature` (la feature dueña) y
`x-status` (`live`/`planned`); `scripts/check-api-contract.mjs` (checkpoint `C11` de
`CHECKPOINTS.md`) falla si el código monta una ruta que el contrato no describe, o si el
contrato promete una ruta `live` que el código no monta.

### Excepciones sancionadas al composition root

**Ninguna, hoy.** Si tu proyecto necesita una (p. ej. una utilidad sin estado y de
implementación única que no sea un detalle de persistencia intercambiable), documéntala
aquí con su justificación. El `reviewer` solo acepta las que estén en esta lista.

### Convenciones a preservar al añadir features

- **`domain/` nunca importa `config/`, `data/`, `infrastructure/` ni `express`** — directa
  ni transitivamente. Es lo que permite que la suite corra sin `.env` ni base de datos. Si
  una pieza nueva necesita algo externo, entra como parámetro de constructor **requerido**
  tipado contra una función o interfaz definida en `domain` (ver `Clock`). Nunca importes
  el adapter concreto dentro de `domain/`, ni como valor por defecto.
- **Los DTOs nunca lanzan.** Constructor privado + factory estática que devuelve
  `[error?, dto?]`, con `''` en el primer slot cuando va bien. El controller comprueba el
  slot de error y responde `400`.
- **Nunca serialices una entidad directamente.** Siempre por su método de proyección.
- **Los errores usan `CustomError`** y sus factories (`badRequest`, `unauthorized`,
  `notFound`, `forbidden`, `internalServerError`), no `Error` crudo. La factory no
  loguea: el log va en el `handleError` del controller.
- **Cada capa tiene su barrel `index.ts`.** Añade los exports nuevos ahí.
- **Las librerías externas se envuelven en adapters** bajo `infrastructure/adapters/`.
  `config/` está reservado exclusivamente a `envs.ts`.
- **ESM `nodenext`**: los imports relativos internos llevan extensión `.js` explícita
  aunque el archivo fuente sea `.ts`.
- **`noUncheckedIndexedAccess` y `exactOptionalPropertyTypes` están activos.** Sé preciso
  con campos opcionales y acceso indexado.
- **Los tests van colocados** junto al código que prueban, y **sí se typechequean** (el
  build los excluye vía `tsconfig.build.json`, el typecheck no).
