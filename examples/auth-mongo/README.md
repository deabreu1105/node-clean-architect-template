# Ejemplo: API de autenticación con Clean Architecture

Una API REST de registro/login/listado de usuarios sobre Express 5, MongoDB
(Mongoose), JWT y bcrypt, estructurada con la misma Regla de Dependencia que el
esqueleto de la raíz. Este era el proyecto del que nació el template.

**No forma parte de tu proyecto.** Vive fuera de `src/`, así que ni `tsc` ni
`pnpm test` ni `./init.sh` lo miran.

## Qué mirar aquí

- **[`CLEAN_ARCHITECTURE.md`](CLEAN_ARCHITECTURE.md)** — lo más valioso del
  directorio. Recorre este código línea a línea: traza una petición completa
  desde la ruta hasta Mongo, explica entidades vs. use cases vs. DTOs, y su §7
  documenta **cinco bugs de arquitectura reales que tuvo este código y cómo se
  arreglaron** (un middleware que importaba el modelo de Mongo, un DTO que
  arrastraba `dotenv` a través de un barrel, adapters viviendo en `config/`…).
  Esa sección enseña más que cualquier explicación abstracta.
- `src/domain/` — tres capas pobladas de verdad: entidad con `toPublic()`, dos
  DTOs con la tupla `[error, dto]`, contratos abstractos de datasource y
  repository, cuatro use cases, y `SignToken` como puerto de función inyectado.
- `src/infrastructure/` — adapters sobre bcrypt y jsonwebtoken, mapper de
  documento Mongo a entidad, y el datasource real.
- `src/presentation/` — controller, rutas y un middleware de JWT escrito como
  factory que recibe el repositorio inyectado.
- `request/*.rest` — peticiones manuales (formato REST Client).

## Correrlo

Tiene su propio `package.json` y su propio `tsconfig.json`, porque el proyecto
raíz ya no lleva `mongoose`, `bcryptjs` ni `jsonwebtoken`:

```bash
cd examples/auth-mongo
pnpm install
pnpm test        # 13 tests de dominio, sin BD y sin .env
pnpm typecheck
```

Para levantarlo de verdad hacen falta un MongoDB accesible y un `.env` con
`PORT`, `MONGO_URL`, `MONGO_DB_NAME` y `JWT_SEED` (ver `src/.env.template`).

## Puntos ciegos conocidos

Se conservan **sin arreglar** a propósito: son parte de lo que el ejemplo
enseña, y `CLEAN_ARCHITECTURE.md` §7 explica la forma de varios de ellos.

- **Asimetría de mayúsculas al hacer login.** `RegisterUserDto.create` pasa el
  email a minúsculas; `LoginUserDto.login` no, y el datasource hace un
  `findOne({ email })` exacto. Quien se registra como `Ana@Example.com` no puede
  volver a entrar con esa combinación.
- **`envs.ts` resuelve el `.env` relativo a `import.meta.dirname`**, así que tras
  un build apunta a `dist/.env`, donde `tsc` nunca lo copia.
- **`UserMapper.userEntityFromObject` descarta `img`** aunque la entidad y el
  schema lo tienen los dos.
- **Naming inconsistente de las factories de DTO**: `RegisterUserDto.create` vs.
  `LoginUserDto.login`.
- **`GetUsers.execute()` devuelve `UserEntity[]` crudo** (con el hash dentro). El
  invariante de `toPublic()` lo sostiene el controller, no el tipo de retorno.
- **Los use cases importan `CustomError` a través del barrel del dominio**, así
  que cargar un use case carga el barrel entero. Inocuo aquí, pero es la forma
  exacta del bug de §7.3.

## Los README de capa

Este código tenía además un `README.md` en cada capa (`domain/`,
`infrastructure/`, `presentation/`). No se conservan: sus snippets estaban
desfasados respecto al código que documentaban, hasta el punto de que el propio
`CLAUDE.md` del proyecto avisaba a los agentes de que no se los creyeran.
`CLEAN_ARCHITECTURE.md` cubre lo mismo y sí está al día. Si los quieres ver:

```bash
git show 60e6b19:src/domain/README.md
```
