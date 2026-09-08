# Guía: Clean Architecture en node-auth

Esta guía explica **cómo se aplicó Clean Architecture en este proyecto concreto**, usando el
código real como ejemplo. No es un resumen teórico genérico — cada sección apunta a archivos de
`src/` para que puedas leer la teoría y el código al mismo tiempo.

Está pensada para alguien que está aprendiendo la arquitectura, así que empieza por los conceptos
base y termina con un caso de estudio real: los errores de arquitectura que tenía este proyecto y
cómo se corrigieron.

---

## 1. La idea central: la Regla de Dependencia

Clean Architecture organiza el código en círculos concéntricos. La única regla que importa:

> **El código fuente solo puede depender hacia adentro.** Un círculo interior no puede saber nada
> de un círculo exterior — ni sus clases, ni sus funciones, ni sus tipos de datos.

¿Por qué? Porque las capas internas son las reglas de negocio (lo que de verdad importa y cambia
poco), y las externas son detalles técnicos (Express, MongoDB, bcrypt — cosas que **sí** cambian:
hoy MongoDB, mañana PostgreSQL). Si las reglas de negocio no conocen los detalles, puedes cambiar
los detalles sin tocar las reglas.

En este proyecto los círculos son:

```
┌──────────────────────────────────────────────────────────────┐
│ FRAMEWORKS & DRIVERS                                          │
│ Express, Mongoose, bcryptjs, jsonwebtoken (las librerías)     │
│  ┌──────────────────────────────────────────────────────────┐│
│  │ INTERFACE ADAPTERS                                        ││
│  │ presentation/ (controllers, middlewares, rutas)           ││
│  │ infrastructure/ (datasources, repositories, mappers,      ││
│  │                   adapters)                               ││
│  │  ┌────────────────────────────────────────────────────┐  ││
│  │  │ USE CASES                                            │  ││
│  │  │ domain/use-cases (RegisterUser, LoginUser,           │  ││
│  │  │                    GetUsers, FindUserById)            │  ││
│  │  │  ┌──────────────────────────────────────────────┐   │  ││
│  │  │  │ ENTITIES                                       │   │  ││
│  │  │  │ domain/entities (UserEntity)                   │   │  ││
│  │  │  └──────────────────────────────────────────────┘   │  ││
│  │  └────────────────────────────────────────────────────┘  ││
│  └──────────────────────────────────────────────────────────┘│
└──────────────────────────────────────────────────────────────┘
```

Fíjate que las carpetas del proyecto (`domain/`, `infrastructure/`, `presentation/`) **no son
exactamente** los 4 anillos clásicos del libro de Robert C. Martin — son una agrupación práctica
que los respeta:

| Carpeta | Anillo(s) que contiene |
|---|---|
| `domain/entities/` | Entities |
| `domain/use-cases/`, `domain/dtos/`, `domain/repositories/`, `domain/datasources/` | Use Cases |
| `infrastructure/`, `presentation/` | Interface Adapters |
| Express, Mongoose, bcryptjs, jsonwebtoken (los `node_modules`) | Frameworks & Drivers |

Lo importante no es el nombre de la carpeta, es **hacia dónde apuntan los imports**. Vamos a
verlo con el flujo real de una petición.

---

## 2. Siguiendo una petición real: `POST /api/auth/register`

```
Cliente
  │  POST /api/auth/register { name, email, password }
  ▼
presentation/server.ts            (Express recibe el HTTP)
  ▼
presentation/auth/routes.ts       (enruta a AuthController.registerUser)
  ▼
presentation/auth/controller.ts   (AuthController.registerUser)
  │  1. RegisterUserDto.create(req.body)      → valida
  │  2. new RegisterUser(authRepository, JwtAdapter.generateToken)
  │  3. .execute(dto)
  ▼
domain/use-cases/auth/register-user.use-case.ts   (RegisterUser — regla de negocio)
  │  1. authRepository.register(dto)   → delega, no sabe qué hay detrás
  │  2. signToken({ id: user.id })     → firma el JWT (inyectado, no importado)
  │  3. return { token, user: user.toPublic() }
  ▼
domain/repositories/auth.repository.ts   (AuthRepository — SOLO el contrato, abstracto)
  ▼
infrastructure/repositories/auth.repository.impl.ts   (AuthRepositoryImpl — implementación)
  ▼
domain/datasources/auth.datasource.ts   (AuthDataSource — SOLO el contrato, abstracto)
  ▼
infrastructure/datasources/mongodb.auth.datasource.impl.ts   (MongoDBAuthDataSourceImpl)
  │  1. UserModel.findOne({ email })      → ¿ya existe?
  │  2. BcryptAdapter.hashPassword(...)    → hashea
  │  3. new UserModel({...}).save()        → persiste en Mongo
  │  4. UserMapper.userEntityFromObject()  → documento Mongo → UserEntity
  ▼
data/mongodb/models/user.model.ts   (esquema de Mongoose — el detalle real de MongoDB)
```

**Lo importante de este flujo:** el use case (`RegisterUser`) nunca menciona Mongo, Express,
bcrypt ni JWT concretos. Solo habla con `AuthRepository` (una clase abstracta) y con `signToken`
(una función que le inyectan). Todo lo concreto vive en los círculos de afuera y se conecta al
final, en el composition root (sección 6).

---

## 3. Entities vs. Use Cases

### Entities — reglas de negocio que existirían aunque no hubiera software

`domain/entities/user.entity.ts`:

```ts
export class UserEntity {
  constructor(
    public id: string,
    public name: string,
    public email: string,
    public password: string,
    public roles: string[],
    public img?: string,
  ) {}

  toPublic(): PublicUser {
    return { id: this.id, name: this.name, email: this.email };
  }
}
```

`UserEntity` no es el documento de Mongo (ese vive en `data/mongodb/models/user.model.ts` y tiene
`_id`, `__v`, etc.). Es la representación limpia del dominio. `toPublic()` es una **regla de
negocio real**: "un usuario nunca debe exponer su contraseña hacia afuera". Por eso vive en la
entidad y no en el controller — es una decisión de negocio, no de presentación HTTP.

### Use Cases — cómo la aplicación orquesta esas reglas para una operación concreta

`domain/use-cases/auth/register-user.use-case.ts` es un **Interactor**: una clase, un método
`execute()`, una sola operación. Sigue el patrón:

```ts
interface RegisterUserUseCase {
    execute( registerUserDto: RegisterUserDto ): Promise<UserToken>;
}

export class RegisterUser implements RegisterUserUseCase {
    constructor(
        private readonly authRepository: AuthRepository,   // ← abstracción
        private readonly signToken: SignToken,               // ← abstracción, obligatoria
    ) { }

    async execute( registerUserDto: RegisterUserDto ): Promise<UserToken> {
        const user  = await this.authRepository.register( registerUserDto );
        const token = await this.signToken({ id: user.id }, '2h' );
        if ( !token ) throw CustomError.internalServerError( 'Error generating token' );
        return { token, user: user.toPublic() };
    }
}
```

Cada operación tiene su propia clase: `RegisterUser`, `LoginUser`, `GetUsers`, `FindUserById`
(`domain/use-cases/auth/`). Nada de un "AuthService" gigante con diez métodos — eso rompería el
Single Responsibility Principle (cada clase cambiaría por razones distintas mezcladas en un solo
archivo).

---

## 4. DTOs = Request Models cruzando el límite

Un Use Case nunca recibe un `Request` de Express ni un objeto crudo sin validar. Recibe un DTO.

`domain/dtos/auth/register-user.dto.ts`:

```ts
export class RegisterUserDto {
  private constructor(
    public name: string,
    public email: string,
    public password: string,
  ) {}

  static create( object: { [key: string]: any } ) : [ string?, RegisterUserDto? ] {
    const { name, email, password } = object;
    if ( !name ) return ['Name is required'];
    if ( !email ) return ['Email is required'];
    if ( !Validators.email.test(email) ) return ['Email is invalid'];
    if ( !password ) return ['Password is required'];
    if ( password.length < 6 ) return ['Password must be at least 6 characters long'];
    return [ '', new RegisterUserDto(name, email.toLowerCase(), password) ];
  }
}
```

Dos decisiones de diseño para notar:

- **Constructor privado + factory estático** (`create`): la única forma de obtener un
  `RegisterUserDto` válido es pasando por la validación. No puedes construir uno "a mano" con
  datos sucios.
- **Retorna `[error?, dto?]` en vez de lanzar una excepción.** Esto hace que el controller pueda
  responder `400` de forma explícita y predecible, sin `try/catch` para errores de validación.

`Validators` (`domain/validators.ts`) vive **dentro** de `domain/`, no en `config/` — es una regla
pura (una regex), sin dependencias externas, así que no rompe el círculo. Si viviera en `config/`
y `config/` importara `dotenv`/`env-var`, el dominio arrastraría esas dependencias solo por validar
un email (esto pasó de verdad en este proyecto — ver sección 7).

---

## 5. Interface Adapters: Gateways, Presenters y Mappers

Este es el anillo que traduce entre "la forma que le conviene al dominio" y "la forma que exige
el mundo exterior".

### Gateways — el dominio define el contrato, afuera se implementa

`domain/repositories/auth.repository.ts` (abstracto, en el dominio):

```ts
export abstract class AuthRepository {
    abstract login( loginUserDto: LoginUserDto ) : Promise<UserEntity>;
    abstract register( registerUserDto: RegisterUserDto ) : Promise<UserEntity>;
    abstract getUsers(): Promise<UserEntity[]>;
    abstract findById( id: string ): Promise<UserEntity>;
}
```

`infrastructure/repositories/auth.repository.impl.ts` (concreto, en infrastructure):

```ts
export class AuthRepositoryImpl implements AuthRepository {
    constructor( private readonly authDataSource: AuthDataSource ) {}
    login(dto)    { return this.authDataSource.login(dto); }
    register(dto) { return this.authDataSource.register(dto); }
    getUsers()    { return this.authDataSource.getUsers(); }
    findById(id)  { return this.authDataSource.findById(id); }
}
```

Esto es **Dependency Inversion** en acción: `AuthRepository` se define en el círculo interno
(domain), pero lo implementa el círculo externo (infrastructure). El use case depende de la
abstracción; nunca sabe que detrás hay Mongo. Si mañana cambias a PostgreSQL, escribes
`PostgresAuthDataSourceImpl` y no tocas ni un use case.

Hay dos niveles aquí (`AuthRepository` → `AuthDataSource`) a propósito: el repositorio es el punto
de extensión (podría combinar varios datasources, agregar caché) y el datasource es quien de
verdad habla con Mongo. Es más separación de la que un proyecto pequeño necesitaría, pero sirve
para practicar el patrón.

### Mappers — traducir el modelo de persistencia a una entidad limpia

`infrastructure/mappers/user.mapper.ts` convierte un documento de Mongoose (con `_id`, `__v`,
etc.) en un `UserEntity` del dominio. Así la entidad nunca se entera de que existe un ORM.

### "Presenter" — la forma segura de responder

Este proyecto no tiene una clase `Presenter` separada, pero `UserEntity.toPublic()` cumple ese rol:
es la única función que decide qué datos de un usuario cruzan hacia el cliente. El controller
(`presentation/auth/controller.ts`) SIEMPRE pasa por `toPublic()` antes de `res.json(...)`:

```ts
getUsers = ( req: Request, res: Response ) => {
    new GetUsers( this.authRepository )
      .execute()
      .then( users => res.json({
        users: users.map( user => user.toPublic() ),
        user: req.user?.toPublic(),
      }) )
      .catch( error => this.handleError( error, res ) );
}
```

### Adapters sobre librerías externas

`infrastructure/adapters/bcrypt.adapter.ts` y `infrastructure/adapters/jwt.adapter.ts` envuelven
`bcryptjs` y `jsonwebtoken` respectivamente. Nadie fuera de `infrastructure/` importa esas
librerías directamente. Si mañana cambias `jsonwebtoken` por `jose`, solo tocas
`jwt.adapter.ts`.

---

## 6. Main — el composition root

Alguien tiene que construir las implementaciones concretas y conectarlas. Ese "alguien" debe ser
**un solo lugar**, no repartido por todo el proyecto. En este proyecto es `src/app.ts`:

```ts
async function main() {
    await MongoDatabase.connect({ mongoUrl: envs.MONGO_URL, dbName: envs.MONGO_DB_NAME });

    // Composition root: el ÚNICO lugar que instancia clases concretas de infrastructure.
    const datasource     = new MongoDBAuthDataSourceImpl();
    const authRepository = new AuthRepositoryImpl( datasource );

    new Server({
      port: envs.PORT,
      routes: AppRoutes.routes( authRepository ),
    }).start();
}
```

`AppRoutes.routes(authRepository)` → `AuthRoutes.routes(authRepository)`
(`presentation/routes.ts`, `presentation/auth/routes.ts`) reciben el repositorio ya construido y
arman el `AuthController` y el `AuthMiddleware` con él. Ningún archivo bajo `presentation/`
escribe `new MongoDBAuthDataSourceImpl()` — solo `app.ts` lo hace.

¿Por qué importa esto? Porque si mañana quieres levantar el servidor con una base de datos en
memoria para tests de integración, solo cambias 2 líneas en `app.ts` (o en un `app.test.ts`
paralelo) — nada en `domain/`, `infrastructure/` o `presentation/` necesita enterarse.

Hay una única excepción deliberada: `AuthController`/`AuthMiddleware` importan `JwtAdapter`
directamente (no vía `app.ts`). Es un caso especial: `JwtAdapter` no tiene una implementación
alternativa que pueda variar por entorno (a diferencia de "¿qué base de datos uso?"), así que
inyectarlo a través de todo el árbol de composición sería ceremonia sin beneficio real.

---

## 7. Caso de estudio: los errores reales que tenía este proyecto

La primera versión de este proyecto tenía varias violaciones típicas de Clean Architecture.
Verlas (y cómo se arreglaron) enseña más que la teoría sola.

### 7.1 — Un middleware "outer" tocando Mongo directamente

**Antes**, `presentation/middlewares/auth.middleware.ts` hacía:

```ts
import { UserModel } from "../../data/mongodb/index.js";
...
const user = await UserModel.findById(payload.id);
```

Presentation (el anillo más externo) importaba el **modelo de Mongoose** — un detalle de
persistencia — saltándose por completo `AuthRepository`/`AuthDataSource`. Si cambiabas de Mongo a
otra base de datos, tenías que tocar el middleware, no solo `infrastructure/`.

**Después:** se agregó `findById` a `AuthDataSource`/`AuthRepository`, un use case
`FindUserById`, y el middleware pasó a ser una **factory inyectada**:

```ts
static validateJWT = ( authRepository: AuthRepository ): RequestHandler => {
    return async ( req, res, next ) => {
        ...
        req.user = await new FindUserById( authRepository ).execute( payload.id );
        next();
    };
}
```

Ahora el middleware solo conoce la abstracción del dominio, igual que el controller.

### 7.2 — El dominio filtraba el hash de contraseña al cliente

`GetUsers` devolvía `UserEntity[]` (que siempre trae `password`), y el controller lo mandaba tal
cual con `res.json({ users })`. Peor: `req.body.user` era el **documento crudo de Mongo**
adjuntado por el middleware. Ambos terminaban en la respuesta HTTP.

**Después:** se agregó `UserEntity.toPublic()` (sección 5) y el controller la usa siempre antes
de responder. Es la regla: *nunca serializar una entidad completa, siempre pasar por
`toPublic()`.*

### 7.3 — El dominio importaba el barrel de `config/` (y arrastraba `dotenv`)

Un DTO hacía `import { Validators } from "../../../config/index.js"`. Ese barrel reexportaba
`envs.ts`, que ejecuta `dotenv.config(...)` **al importarse** (efecto secundario a nivel de
módulo). Resultado: importar un DTO del dominio disparaba lectura de filesystem y validación de
variables de entorno — si no había un `.env` completo, el import fallaba.

Peor aún: `RegisterUser`/`LoginUser` tenían `JwtAdapter.generateToken` como **valor por defecto**
del constructor, lo que forzaba el mismo import incluso sin llamar a la función.

**Después:**
- `Validators` se movió a `domain/validators.ts` (sin dependencias externas).
- `signToken` pasó a ser un parámetro **obligatorio** (tipo `SignToken`, definido en
  `domain/interfaces/sign-token.interface.ts`), sin valor por defecto. Quien construye el use case
  (el controller) decide qué función concreta inyectar.

Esto es lo que permite que `pnpm test` corra el dominio completo sin `.env`, sin MongoDB y sin
Express — la prueba real de que la Regla de Dependencia se respeta.

### 7.4 — La composición vivía dentro de `presentation/auth/routes.ts`

`AuthRoutes.routes` hacía `new MongoDBAuthDataSourceImpl()` y `new AuthRepositoryImpl(...)`
internamente. Cada archivo de rutas era, a la vez, definición de endpoints y composition root.

**Después:** ver sección 6 — `app.ts` es el único composition root; `AppRoutes`/`AuthRoutes`
reciben el repositorio ya construido.

### 7.5 — Los adaptadores sobre librerías externas vivían en `config/`

`BcryptAdapter`/`JwtAdapter` estaban en `config/`, mezclados con `envs.ts` (carga de variables de
entorno). Son responsabilidades distintas: `envs.ts` cambia si cambia el deployment;
`BcryptAdapter`/`JwtAdapter` cambian si cambias de librería de hashing o de JWT.

**Después:** se movieron a `infrastructure/adapters/`, junto a los demás detalles concretos
(`datasources/`, `repositories/`, `mappers/`). `config/` quedó solo para `envs.ts`.

---

## 8. Cómo verificar tú mismo que la arquitectura se respeta

Preguntas rápidas que puedes hacerte sobre cualquier cambio nuevo:

1. **¿Puedo testear la regla de negocio sin BD, sin Express, sin variables de entorno?**
   Prueba: `pnpm test`. Corre 13 tests sobre DTOs y use cases sin tocar Mongo ni `.env`
   (`src/domain/**/*.test.ts`).
2. **¿Todos los imports apuntan hacia adentro?**
   `grep -rn "infrastructure\|express\|mongoose" src/domain` no debería devolver nada (pruébalo).
3. **¿Puedo cambiar de base de datos sin tocar `domain/` ni `presentation/`?**
   Solo tendrías que escribir un nuevo `XAuthDataSourceImpl` en `infrastructure/` e instanciarlo
   en `app.ts`.
4. **¿El framework está confinado al anillo externo?**
   Express solo aparece en `presentation/`. Mongoose solo en `data/mongodb/` e
   `infrastructure/datasources/`.
5. **¿Hay un solo lugar que arma todo?**
   Sí: `app.ts`.

---

## 9. Para seguir practicando

Ideas de ejercicios sobre este mismo proyecto, de menor a mayor dificultad:

1. **Agregar un nuevo use case** (ej. `ChangePassword`): un DTO nuevo, un método en
   `AuthDataSource`/`AuthRepository`, la implementación en Mongo, y el endpoint en el controller.
   Fíjate en cuántas capas tocas y en qué orden (de adentro hacia afuera).
2. **Escribir un datasource alternativo en memoria** (`InMemoryAuthDataSourceImpl`) que implemente
   `AuthDataSource` con un array en vez de Mongo. Úsalo para escribir un test de integración de
   `AuthRepositoryImpl` sin tocar la base de datos real.
3. **Cambiar `JwtAdapter` por otra librería** (por ejemplo `jose`) sin tocar nada fuera de
   `infrastructure/adapters/jwt.adapter.ts`.
4. **Intentar (a propósito) romper la regla**: importa `UserModel` desde un DTO del dominio y
   corre `pnpm test`. Vas a ver el mismo error de `.env`/Mongo descrito en la sección 7.3 — es la
   mejor forma de sentir *por qué* existe la regla, no solo memorizarla.

---

## 10. Referencia rápida de vocabulario

| Término (libro de Uncle Bob) | En este proyecto |
|---|---|
| Entity | `UserEntity` (`domain/entities/`) |
| Use Case / Interactor | `RegisterUser`, `LoginUser`, `GetUsers`, `FindUserById` (`domain/use-cases/`) |
| Request Model | Los DTOs (`domain/dtos/`) |
| Response Model | `UserToken`, `PublicUser` (`domain/interfaces/`, `domain/entities/`) |
| Input/Output Boundary | Las interfaces `RegisterUserUseCase`, `LoginUserUseCase`, etc., dentro de cada archivo de use case |
| Gateway | `AuthRepository`/`AuthDataSource` (contrato) + sus implementaciones en `infrastructure/` |
| Presenter | `UserEntity.toPublic()` |
| Controller | `AuthController` (`presentation/auth/controller.ts`) |
| Frameworks & Drivers | Express, Mongoose, bcryptjs, jsonwebtoken |
| Main / Composition Root | `app.ts` |

Para la teoría completa (SOLID, componentes, boundaries), este repo trae el skill
`clean-architecture` en `.claude/skills/clean-architecture/` — vale la pena leer sus
`references/*.md` con este proyecto abierto al lado.
