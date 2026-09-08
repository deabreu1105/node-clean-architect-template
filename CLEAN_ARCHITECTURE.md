# Guía: Clean Architecture en este template

Esta guía explica **cómo se aplica Clean Architecture en el esqueleto real de este
template**, usando su único endpoint de ejemplo — `GET /api/health` — como recorrido
completo. No es un resumen teórico genérico: cada sección apunta a archivos reales bajo
`src/` para que puedas leer la teoría y el código al mismo tiempo.

Este archivo es parte del **arnés** (idéntico en todo proyecto creado desde el template,
igual que `docs/architecture.md` o `docs/conventions.md`): documenta el patrón, no tu
dominio. Cuando sustituyas el ejemplo de salud por tus propias features, esta guía te
sigue sirviendo como referencia del patrón — la lista concreta de clases de *tu* proyecto
vive en [`docs/project/architecture.md`](docs/project/architecture.md), que sí se
reescribe por proyecto.

---

## 1. La idea central: la Regla de Dependencia

Clean Architecture organiza el código en círculos concéntricos. La única regla que
importa:

> **El código fuente solo puede depender hacia adentro.** Un círculo interior no puede
> saber nada de un círculo exterior — ni sus clases, ni sus funciones, ni sus tipos de
> datos.

¿Por qué? Porque las capas internas son las reglas de negocio (lo que de verdad importa y
cambia poco), y las externas son detalles técnicos (Express, el reloj del sistema, las
variables de entorno — cosas que **sí** cambian o se sustituyen). Si las reglas de negocio
no conocen los detalles, puedes cambiar los detalles sin tocar las reglas.

En este template los círculos son:

```
┌──────────────────────────────────────────────────────────────┐
│ FRAMEWORKS & DRIVERS                                          │
│ Express, process.uptime()/process.version, dotenv (env-var)   │
│  ┌──────────────────────────────────────────────────────────┐│
│  │ INTERFACE ADAPTERS                                        ││
│  │ presentation/ (controller, router, server)                ││
│  │ infrastructure/ (repository impl., adapter del reloj)     ││
│  │  ┌────────────────────────────────────────────────────┐  ││
│  │  │ USE CASES                                            │  ││
│  │  │ domain/use-cases (GetHealth)                         │  ││
│  │  │  ┌──────────────────────────────────────────────┐   │  ││
│  │  │  │ ENTITIES                                       │   │  ││
│  │  │  │ domain/entities (HealthStatusEntity)           │   │  ││
│  │  │  └──────────────────────────────────────────────┘   │  ││
│  │  └────────────────────────────────────────────────────┘  ││
│  └──────────────────────────────────────────────────────────┘│
└──────────────────────────────────────────────────────────────┘
```

Fíjate que las carpetas del proyecto (`domain/`, `infrastructure/`, `presentation/`) **no
son exactamente** los 4 anillos clásicos del libro de Robert C. Martin — son una
agrupación práctica que los respeta:

| Carpeta | Anillo(s) que contiene |
|---|---|
| `domain/entities/` | Entities |
| `domain/use-cases/`, `domain/dtos/`, `domain/repositories/`, `domain/interfaces/` | Use Cases |
| `infrastructure/`, `presentation/` | Interface Adapters |
| Express, `dotenv`/`env-var`, el reloj del sistema (los `node_modules` y las APIs de Node) | Frameworks & Drivers |

Lo importante no es el nombre de la carpeta, es **hacia dónde apuntan los imports**.
Vamos a verlo con el flujo real de una petición.

---

## 2. Siguiendo una petición real: `GET /api/health?verbose=true`

```
Cliente
  │  GET /api/health?verbose=true
  ▼
presentation/server.ts               (Express recibe el HTTP)
  ▼
presentation/routes.ts               (AppRoutes monta HealthRoutes en /api/health)
  ▼
presentation/health/routes.ts        (HealthRoutes.routes → HealthController.getHealth)
  ▼
presentation/health/controller.ts    (HealthController.getHealth)
  │  1. HealthQueryDto.create(req.query)                    → valida ?verbose
  │  2. new GetHealth(healthRepository, clock).execute()
  │  3. res.json(status.toPublic(healthQueryDto.verbose))
  ▼
domain/use-cases/health/get-health.use-case.ts   (GetHealth — regla de negocio)
  │  1. healthRepository.getSnapshot()   → delega, no sabe qué hay detrás
  │  2. clock()                          → instante actual (inyectado, no importado)
  │  3. return new HealthStatusEntity(...)
  ▼
domain/repositories/health.repository.ts   (HealthRepository — SOLO el contrato, abstracto)
  ▼
infrastructure/repositories/health.repository.impl.ts   (HealthRepositoryImpl)
  │  1. envs.APP_NAME              → única lectura de configuración del feature
  │  2. process.uptime() / process.version   → detalle real del entorno de ejecución
  ▼
domain/interfaces/clock.interface.ts   (Clock — SOLO el tipo función, `() => Date`)
  ▼
infrastructure/adapters/system-clock.adapter.ts   (systemClock — implementación concreta)
```

**Lo importante de este flujo:** el use case (`GetHealth`) nunca menciona Express,
`process`, ni `envs`. Solo habla con `HealthRepository` (una clase abstracta) y con
`clock` (una función que le inyectan). Todo lo concreto vive en los círculos de afuera y
se conecta al final, en el composition root (sección 6).

---

## 3. Entities vs. Use Cases

### Entities — reglas de negocio que existirían aunque no hubiera software

`domain/entities/health-status.entity.ts`:

```ts
export class HealthStatusEntity {
  constructor(
    public readonly status: 'ok',
    public readonly appName: string,
    public readonly uptimeSeconds: number,
    public readonly nodeVersion: string,
    public readonly checkedAt: Date,
  ) {}

  toPublic( verbose: boolean ): PublicHealth | PublicHealthVerbose {
    const base: PublicHealth = { status: this.status, appName: this.appName };
    if ( !verbose ) return base;
    return { ...base, uptimeSeconds: this.uptimeSeconds, nodeVersion: this.nodeVersion, checkedAt: this.checkedAt.toISOString() };
  }
}
```

`toPublic(verbose)` es una **regla de negocio real**, aunque el ejemplo sea pequeño: "el
detalle verboso del estado del servicio solo se expone si se pide explícitamente". Por eso
vive en la entidad y no en el controller — es una decisión de negocio, no de presentación
HTTP. Es exactamente el mismo patrón que impediría, en un dominio con usuarios, filtrar un
hash de contraseña hacia el cliente (ver `examples/auth-mongo/CLEAN_ARCHITECTURE.md` §7.2
para ese caso real).

### Use Cases — cómo la aplicación orquesta esas reglas para una operación concreta

`domain/use-cases/health/get-health.use-case.ts` es un **Interactor**: una clase, un
método `execute()`, una sola operación. Sigue el patrón:

```ts
interface GetHealthUseCase {
  execute(): HealthStatusEntity;
}

export class GetHealth implements GetHealthUseCase {
  constructor(
    private readonly healthRepository: HealthRepository,   // ← abstracción
    private readonly clock: Clock,                          // ← abstracción, obligatoria
  ) {}

  execute(): HealthStatusEntity {
    const snapshot = this.healthRepository.getSnapshot();
    return new HealthStatusEntity( 'ok', snapshot.appName, snapshot.uptimeSeconds, snapshot.nodeVersion, this.clock() );
  }
}
```

Al añadir tu segunda feature real, cada operación tendrá su propia clase de use case, no
un "servicio" gigante con diez métodos — eso rompería el Single Responsibility Principle
(cada clase cambiaría por razones distintas mezcladas en un solo archivo).

---

## 4. DTOs = Request Models cruzando el límite

Un Use Case nunca recibe un `Request` de Express ni un objeto crudo sin validar. Recibe un
DTO.

`domain/dtos/health/health-query.dto.ts`:

```ts
export class HealthQueryDto {
  private constructor( public readonly verbose: boolean ) {}

  static create( query: Record<string, unknown> ): [string?, HealthQueryDto?] {
    const verbose = Validators.boolean( query['verbose'] );
    if ( verbose === null ) return ['verbose debe ser "true" o "false"'];
    return ['', new HealthQueryDto( verbose )];
  }
}
```

Dos decisiones de diseño para notar:

- **Constructor privado + factory estático** (`create`): la única forma de obtener un
  `HealthQueryDto` válido es pasando por la validación. No puedes construir uno "a mano"
  con datos sucios.
- **Retorna `[error?, dto?]` en vez de lanzar una excepción.** Esto hace que el controller
  pueda responder `400` de forma explícita y predecible, sin `try/catch` para errores de
  validación.

`Validators` (`domain/validators.ts`) vive **dentro** de `domain/`, no en `config/` — es
una regla pura, sin dependencias externas, así que no rompe el círculo. Si viviera en
`config/` y `config/` importara `dotenv`/`env-var`, el dominio arrastraría esas
dependencias solo por validar un query param: los tests de `domain/` dejarían de poder
correr sin un `.env` completo.

---

## 5. Interface Adapters: Gateways, Presenters y Adapters

Este es el anillo que traduce entre "la forma que le conviene al dominio" y "la forma que
exige el mundo exterior".

### Gateway — el dominio define el contrato, afuera se implementa

`domain/repositories/health.repository.ts` (abstracto, en el dominio):

```ts
export interface HealthSnapshot {
  appName: string;
  uptimeSeconds: number;
  nodeVersion: string;
}

export abstract class HealthRepository {
  abstract getSnapshot(): HealthSnapshot;
}
```

`infrastructure/repositories/health.repository.impl.ts` (concreto, en infrastructure):

```ts
export class HealthRepositoryImpl extends HealthRepository {
  getSnapshot(): HealthSnapshot {
    return {
      appName: envs.APP_NAME,
      uptimeSeconds: Math.round( process.uptime() ),
      nodeVersion: process.version,
    };
  }
}
```

Esto es **Dependency Inversion** en acción: `HealthRepository` se define en el círculo
interno (domain), pero lo implementa el círculo externo (infrastructure). El use case
depende de la abstracción; nunca sabe que detrás hay `envs`/`process`. Si mañana el
snapshot viniera de otra fuente (un servicio de orquestación, por ejemplo), escribes una
nueva implementación y no tocas el use case.

### Puerto de función — el reloj

`domain/interfaces/clock.interface.ts` declara el puerto más pequeño posible: un tipo
función, `export type Clock = () => Date`. No hace falta una interfaz con nombre y método
cuando el contrato es una sola operación — es la misma idea que un Gateway, con menos
ceremonia. `infrastructure/adapters/system-clock.adapter.ts` lo implementa:
`export const systemClock: Clock = () => new Date()`. Un test puede fijar la hora
inyectando cualquier otra función `() => Date` sin tocar `Date` global.

### "Presenter" — la forma segura de responder

Este proyecto no tiene una clase `Presenter` separada, pero `HealthStatusEntity.toPublic()`
cumple ese rol: es la única función que decide qué datos cruzan hacia el cliente. El
controller (`presentation/health/controller.ts`) SIEMPRE pasa por `toPublic()` antes de
`res.json(...)` — nunca serializa la entidad directamente.

### Adapters sobre APIs externas

`infrastructure/adapters/system-clock.adapter.ts` envuelve la API de reloj del sistema
(`new Date()`). Nadie fuera de `infrastructure/` la llama directamente. Al añadir una
librería de terceros de verdad (un cliente HTTP, un hasher, un ORM), el mismo patrón
aplica: el adapter vive en `infrastructure/adapters/`, y es la única pieza que importa esa
librería (ver `docs/architecture.md` § adapters y `examples/auth-mongo/` para adapters
sobre `bcryptjs` y `jsonwebtoken`).

---

## 6. Main — el composition root

Alguien tiene que construir las implementaciones concretas y conectarlas. Ese "alguien"
debe ser **un solo lugar**, no repartido por todo el proyecto. En este template es
`src/app.ts`:

```ts
async function main() {
  // Composition root: el ÚNICO lugar que instancia clases concretas de infrastructure.
  const healthRepository = new HealthRepositoryImpl();

  await new Server({
    port: envs.PORT,
    routes: AppRoutes.routes( healthRepository, systemClock ),
  }).start();
}
```

`AppRoutes.routes(healthRepository, clock)` → `HealthRoutes.routes(healthRepository,
clock)` (`presentation/routes.ts`, `presentation/health/routes.ts`) reciben los puertos ya
construidos y arman el `HealthController` con ellos. Ningún archivo bajo `presentation/`
escribe `new HealthRepositoryImpl()` — solo `app.ts` lo hace.

¿Por qué importa esto? Porque si mañana quieres correr un test de integración con un
`HealthRepository` falso, o cambiar de dónde sale el snapshot, solo cambias unas líneas en
`app.ts` (o en un `app.test.ts` paralelo) — nada en `domain/`, `infrastructure/` o
`presentation/` necesita enterarse.

Este template, hoy, **no tiene excepciones sancionadas** al composition root — toda
implementación concreta se instancia en `app.ts`. Si tu proyecto necesita una (una
utilidad sin estado y de implementación única, como el `JwtAdapter` inyectado
directamente en `examples/auth-mongo/`), documéntala en
[`docs/project/architecture.md`](docs/project/architecture.md) § *Excepciones sancionadas*
con su justificación — el `reviewer` solo acepta las que estén ahí.

---

## 7. Errores tipados, no `Error` crudo

`domain/errors/custom.error.ts` define `CustomError`, que transporta un `statusCode` HTTP
junto al mensaje, con factories (`badRequest`, `unauthorized`, `notFound`, `forbidden`,
`internalServerError`). El controller decide qué hacer según el tipo:

```ts
private handleError = ( error: unknown, res: Response ) => {
  if ( error instanceof CustomError ) {
    res.status( error.statusCode ).json({ error: error.message });
    return;
  }
  console.error( error );
  res.status(500).json({ error: 'Internal Server Error' });
};
```

Las factories **no loguean** — si loguearan, un `CustomError` capturado y convertido a
`400` también ensuciaría la salida, incluida la de los tests que provocan un fallo a
propósito. El log vive en el borde (el `handleError` del controller), que es quien sabe si
el error se está manejando o se está escapando de verdad.

Este template no arrastra (todavía) un catálogo de bugs de arquitectura reales y
corregidos — ver [`docs/project/blind-spots.md`](docs/project/blind-spots.md). Si quieres
ver ese caso de estudio aplicado a un dominio completo (con violaciones reales de la Regla
de Dependencia y cómo se detectaron y arreglaron), lee
[`examples/auth-mongo/CLEAN_ARCHITECTURE.md`](examples/auth-mongo/CLEAN_ARCHITECTURE.md)
§7 — mismo patrón, aplicado a una API de autenticación con Mongo y JWT.

---

## 8. Cómo verificar tú mismo que la arquitectura se respeta

Preguntas rápidas que puedes hacerte sobre cualquier cambio nuevo:

1. **¿Puedo testear la regla de negocio sin servidor, sin `.env`?**
   Prueba: `pnpm test`. Corre los tests de `src/domain/**/*.test.ts` sin arrancar Express
   ni leer variables de entorno.
2. **¿Todos los imports apuntan hacia adentro?**
   `grep -rn "infrastructure\|express" src/domain` no debería devolver nada. El script
   `./scripts/check-dependency-rule.sh` (parte de `./init.sh`) lo verifica automáticamente
   contra `harness.config.json`.
3. **¿Puedo cambiar de dónde sale el snapshot sin tocar `domain/` ni `presentation/`?**
   Solo tendrías que escribir una nueva implementación de `HealthRepository` en
   `infrastructure/` e instanciarla en `app.ts`.
4. **¿El framework está confinado al anillo externo?**
   Express solo aparece en `presentation/`.
5. **¿Hay un solo lugar que arma todo?**
   Sí: `app.ts`.

---

## 9. Para seguir practicando

Ideas de ejercicios sobre este mismo esqueleto, de menor a mayor dificultad:

1. **Agregar un campo nuevo a la respuesta verbose** (por ejemplo `pid: process.pid`): un
   cambio en `HealthSnapshot`, `HealthRepositoryImpl` y `HealthStatusEntity.toPublic()`.
   Fíjate en cuántas capas tocas y en qué orden (de adentro hacia afuera).
2. **Escribir un `HealthRepository` alternativo en memoria** (`FakeHealthRepository`) con
   valores fijos, y usarlo para escribir un test de integración de `GetHealth` sin
   `process.uptime()` real.
3. **Añadir tu primera feature real**: sigue el flujo del arnés (`/add-feature` →
   `spec_author` → aprobación humana → `implementer`) y compara cuántos archivos tocaste
   contra los que tocó `GetHealth` aquí — deberían ser análogos capa por capa.
4. **Intentar (a propósito) romper la regla**: importa `express` desde
   `domain/use-cases/health/get-health.use-case.ts` y corre `./init.sh`. Vas a ver fallar
   el guard de la Regla de Dependencia — es la mejor forma de sentir *por qué* existe la
   regla, no solo memorizarla.

---

## 10. Referencia rápida de vocabulario

| Término (libro de Uncle Bob) | En este template |
|---|---|
| Entity | `HealthStatusEntity` (`domain/entities/`) |
| Use Case / Interactor | `GetHealth` (`domain/use-cases/health/`) |
| Request Model | `HealthQueryDto` (`domain/dtos/health/`) |
| Response Model | `PublicHealth` / `PublicHealthVerbose` (`domain/entities/`) |
| Input/Output Boundary | La interfaz `GetHealthUseCase`, dentro del propio archivo del use case |
| Gateway | `HealthRepository` (contrato) + `HealthRepositoryImpl` (`infrastructure/`) |
| Presenter | `HealthStatusEntity.toPublic()` |
| Controller | `HealthController` (`presentation/health/controller.ts`) |
| Frameworks & Drivers | Express, `dotenv`/`env-var`, el reloj y el entorno de ejecución de Node |
| Main / Composition Root | `app.ts` |

Para la teoría completa (SOLID, componentes, boundaries), este repo trae el skill
`clean-architecture` en `.claude/skills/clean-architecture/` — vale la pena leer sus
`references/*.md` con este proyecto abierto al lado. Para ver el mismo patrón aplicado a
un dominio completo, con un caso de estudio de bugs reales de arquitectura,
[`examples/auth-mongo/CLEAN_ARCHITECTURE.md`](examples/auth-mongo/CLEAN_ARCHITECTURE.md).
