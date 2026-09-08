# Design: hello_world (endpoint hola mundo, ejercicio 3 capas)

> Diseño ya acordado con el humano en
> `docs/ideas/2026-09-01-hello-world-endpoint-design.md` (brainstorming previo). Este
> documento lo formaliza en el formato Kiro-style exigido por `docs/specs.md`, referencia
> los requirements de `requirements.md` y confirma cumplimiento de
> `docs/architecture.md`. No introduce decisiones nuevas respecto a la idea aprobada.

## Archivos a crear

| Archivo | Capa | Rol |
|---|---|---|
| `src/domain/repositories/greeting.repository.ts` | `domain/` | Contrato abstracto `GreetingRepository` |
| `src/domain/use-cases/greeting/get-greeting.use-case.ts` | `domain/` | Caso de uso `GetGreeting` |
| `src/domain/use-cases/greeting/get-greeting.use-case.test.ts` | `domain/` | Test de dominio (fake repository) |
| `src/infrastructure/repositories/greeting.repository.impl.ts` | `infrastructure/` | `GreetingRepositoryImpl` |
| `src/presentation/hello/controller.ts` | `presentation/` | `HelloController` |
| `src/presentation/hello/routes.ts` | `presentation/` | `HelloRoutes.routes(greetingRepository)` |

## Archivos a modificar

| Archivo | Cambio |
|---|---|
| `src/domain/index.ts` | Añade `export * from './repositories/greeting.repository.js';` y `export * from './use-cases/greeting/get-greeting.use-case.js';` |
| `src/infrastructure/index.ts` | Añade `export * from './repositories/greeting.repository.impl.js';` |
| `src/config/envs.ts` | Añade `APP_NAME: envVar.get('APP_NAME').required().asString(),` |
| `src/.env.template` | Añade la línea `APP_NAME=` |
| `src/presentation/routes.ts` | `AppRoutes.routes` gana un segundo parámetro `greetingRepository: GreetingRepository` y monta `router.use('/api/hello', HelloRoutes.routes(greetingRepository));` |
| `src/app.ts` | Instancia `const greetingRepository = new GreetingRepositoryImpl();` y la pasa a `AppRoutes.routes(authRepository, greetingRepository)` |

## Firmas nuevas

```ts
// domain/repositories/greeting.repository.ts
export abstract class GreetingRepository {
  abstract getMessage(): string;
}
```

```ts
// domain/use-cases/greeting/get-greeting.use-case.ts
interface GetGreetingUseCase {
  execute(): string;
}

export class GetGreeting implements GetGreetingUseCase {
  constructor(private readonly greetingRepository: GreetingRepository) {}
  execute(): string {
    return this.greetingRepository.getMessage();
  }
}
```

```ts
// infrastructure/repositories/greeting.repository.impl.ts
export class GreetingRepositoryImpl extends GreetingRepository {
  getMessage(): string {
    return `Hola mundo desde ${envs.APP_NAME}`;
  }
}
```

```ts
// presentation/hello/controller.ts
export class HelloController {
  constructor(private readonly greetingRepository: GreetingRepository) {}
  getHello = (req: Request, res: Response) => {
    const message = new GetGreeting(this.greetingRepository).execute();
    res.json({ message });
  }
}
```

```ts
// presentation/hello/routes.ts
export class HelloRoutes {
  static routes(greetingRepository: GreetingRepository): Router {
    const router = Router();
    const controller = new HelloController(greetingRepository);
    router.get('/', controller.getHello);
    return router;
  }
}
```

```ts
// presentation/routes.ts
static routes(authRepository: AuthRepository, greetingRepository: GreetingRepository): Router
```

```ts
// config/envs.ts
export const envs = {
  PORT: ...,
  MONGO_URL: ...,
  MONGO_DB_NAME: ...,
  JWT_SEED: ...,
  APP_NAME: envVar.get('APP_NAME').required().asString(),
};
```

`GetGreeting.execute()` es síncrono (`string`, no `Promise<string>`) porque
`getMessage()` no hace I/O — a diferencia de los use-cases de `auth/`, que sí son
asíncronos por hablar con Mongo. `HelloController.getHello` no necesita `.then/.catch`
ni `handleError`.

## Excepciones

Ninguna. No hay input de cliente que validar (no hay DTO), ni operación asíncrona ni de
I/O en el camino feliz del use-case (`getMessage()` es una lectura de una constante en
memoria construida en `app.ts` al arrancar). Por tanto no hay rama de error que
representar con `CustomError`, y ni `GetGreeting` ni `HelloController` la usan. Esto es
intencional y está explícito en `docs/ideas/2026-09-01-hello-world-endpoint-design.md`.

## Alternativa descartada

**Datasource separado (`GreetingDataSource` + `GreetingRepository` como pass-through),
espejando el patrón de `AuthDataSource`/`AuthRepository`.** Se descartó porque ese
patrón existe en `auth/` para permitir intercambiar la fuente de datos (Mongo hoy,
otra cosa mañana) o componer varias fuentes detrás del repositorio. Aquí no hay fuente
de datos que vaya a variar — el repositorio ya es la abstracción mínima suficiente
para que `domain/` no sepa que el mensaje sale de una variable de entorno. Añadir un
datasource sería una capa de indirección sin propósito, oscureciendo el ejercicio de
Clean Architecture en vez de ilustrarlo. (Justificación heredada de
`docs/ideas/2026-09-01-hello-world-endpoint-design.md`, sección "Diseño > domain/".)

Segunda alternativa descartada (también documentada en la idea original): **contador
persistido en MongoDB** en vez de una variable de entorno como "detalle externo" a
invertir. Se descartó por alcance — exigiría un datasource y un modelo Mongoose reales
para un ejercicio de "hola mundo", desproporcionado frente al propósito didáctico.

## Capas afectadas y dirección de dependencias

| Capa | Qué se toca | Importa de | Confirmación Regla de Dependencia |
|---|---|---|---|
| `domain/` | `GreetingRepository` (contrato), `GetGreeting` (use-case), su test | Nada nuevo fuera de `domain/` (el test importa solo `node:test`/`node:assert` + el propio use-case/repositorio) | ✅ Cero imports de `infrastructure/`, `config/`, `data/`, `express`. `GetGreeting` recibe `GreetingRepository` por constructor (puerto), igual que `RegisterUser` recibe `AuthRepository`. No hay dependencia externa que necesite un puerto adicional tipo `SignToken` — el único "detalle externo" (`APP_NAME`) vive detrás de `GreetingRepository` mismo. |
| `infrastructure/` | `GreetingRepositoryImpl` implementa `GreetingRepository` | `domain/` (el contrato) + `config/envs.ts` (única lectura de env para este feature) | ✅ `infrastructure/` puede importar `domain/` (implementa su contrato) y la pieza de `config/`/librería que envuelve — igual que `MongoDBAuthDataSourceImpl` importa `bcryptjs`. No importa nada de `presentation/`. |
| `presentation/` | `HelloController`, `HelloRoutes`, cambio de firma en `AppRoutes.routes` | Solo el tipo abstracto `GreetingRepository` de `domain/` (vía parámetro inyectado) | ✅ `presentation/hello/` NO instancia `GreetingRepositoryImpl` — la recibe ya construida. Ningún import de `infrastructure/repositories/` ni de `config/` en esta capa (a diferencia de `AuthController`, que sí importa `JwtAdapter` como excepción sancionada — aquí no aplica ninguna excepción similar). |
| Composition root (`app.ts`) | Instancia `GreetingRepositoryImpl` y la pasa a `AppRoutes.routes` | `infrastructure/index.ts` (barrel) | ✅ Único lugar que hace `new GreetingRepositoryImpl()`, igual que hace con `MongoDBAuthDataSourceImpl`/`AuthRepositoryImpl`. |

Ningún import nuevo introducido por esta feature viola la Regla de Dependencia
(`presentation → infrastructure → domain`, siempre hacia adentro). El único puerto
nuevo en `domain/` es `GreetingRepository`; no se necesita un puerto adicional tipo
`SignToken` porque no hay una operación (firmar, hashear) que un use-case deba delegar
más allá de "obtener el mensaje", que es exactamente lo que el repositorio abstrae.
