# Diseño: endpoint "hola mundo" (ejercicio de las 3 capas)

**Fecha:** 2026-09-01
**Estado:** aprobado por el humano, pendiente de convertir en feature `pending`

## Propósito

Ejercicio de aprendizaje de Clean Architecture, en la misma línea que
`change_password` (ver `CLEAN_ARCHITECTURE.md` §9). No resuelve una necesidad de
producto: existe para practicar la Regla de Dependencia con un caso mínimo que aun
así toca `domain/` → `infrastructure/` → `presentation/` y pasa por el composition
root (`app.ts`).

## Alcance

- Endpoint público (sin JWT): `GET /api/hello`.
- Respuesta: `{ "message": "Hola mundo desde <APP_NAME>" }`.
- Sin persistencia, sin lógica de negocio real, sin casos de error esperados
  (no hay input del cliente, no hay operación asíncrona que pueda fallar).
- El "detalle externo" que ilustra la inversión de dependencia es una variable de
  entorno nueva (`APP_NAME`), no una librería de terceros ni Mongo.

## Diseño

### `domain/`

- `domain/repositories/greeting.repository.ts`: contrato abstracto
  `GreetingRepository` con un único método `getMessage(): string`. No hay
  `datasource` separado (a diferencia de Auth) porque no existe una fuente de
  datos que varíe — el repositorio es la única abstracción que domain necesita
  para no saber de dónde sale el string.
- `domain/use-cases/greeting/get-greeting.use-case.ts`: clase `GetGreeting`,
  recibe `GreetingRepository` por constructor, `execute()` retorna
  `this.repository.getMessage()`. No importa nada de `infrastructure/` ni
  `config/`.
- Barrel `domain/index.ts` exporta `GreetingRepository` y `GetGreeting`.

### `infrastructure/`

- `infrastructure/repositories/greeting.repository.impl.ts`:
  `GreetingRepositoryImpl extends GreetingRepository`. `getMessage()` retorna
  `` `Hola mundo desde ${envs.APP_NAME}` ``. Este archivo es el único lugar que
  lee `config/envs.ts` para este feature — así se ilustra por qué domain no
  puede leer `config/` directamente (mismo motivo documentado para `SignToken`
  en `CLAUDE.md`).
- `config/envs.ts`: se agrega `APP_NAME` como variable requerida
  (`env-var`, `.required().asString()`).
- `src/.env.template`: se agrega la línea `APP_NAME=`.
- Barrel `infrastructure/index.ts` exporta `GreetingRepositoryImpl`.

### `presentation/`

- `presentation/hello/controller.ts`: `HelloController`, recibe
  `GreetingRepository` por constructor. `getHello = (req, res) => {...}`
  instancia `new GetGreeting(this.greetingRepository)`, llama `execute()` y
  responde `res.json({ message })`. Sin manejo de errores porque no hay
  operación que pueda fallar (no usa `CustomError`).
- `presentation/hello/routes.ts`: `HelloRoutes.routes(greetingRepository)`
  devuelve un `Router` con `GET /` → `controller.getHello`.
- `presentation/routes.ts` (`AppRoutes.routes`): monta
  `router.use('/api/hello', HelloRoutes.routes(greetingRepository))`, recibiendo
  `greetingRepository` como parámetro nuevo junto a `authRepository`.

### Composition root (`app.ts`)

Se agrega, junto a la construcción existente de `authRepository`:

```ts
const greetingRepository = new GreetingRepositoryImpl();
```

y se pasa a `AppRoutes.routes(authRepository, greetingRepository)` (o firma
equivalente que reciba ambos repositorios). Ningún `new` de clase concreta de
`infrastructure/` ocurre fuera de `app.ts`.

## Testing

Solo `domain/`, siguiendo el patrón existente (`node:test`, sin BD, sin
Express, sin `.env`):

- `domain/use-cases/greeting/get-greeting.use-case.test.ts`: un fake
  `GreetingRepository` (objeto literal con `getMessage()` devolviendo un
  string fijo de prueba) inyectado en `GetGreeting`; se verifica que
  `execute()` retorna exactamente ese string.

No se agregan tests de `infrastructure/` ni `presentation/` — no hay precedente
de tests fuera de `domain/` en este repo (`pnpm test` corre `src/**/*.test.ts`,
pero hoy solo existen específicos de dominio).

## Fuera de alcance

- Health checks reales (uptime, conexión a Mongo, etc.) — esto es solo un
  saludo, no un endpoint de monitoreo.
- Internacionalización del mensaje.
- Cualquier variante autenticada del endpoint.

## Enfoques descartados

- **Solo domain + presentation, sin infra real**: no cubre las 3 capas de forma
  significativa, descartado porque el propósito explícito es practicar
  Clean Architecture completa.
- **Contador persistido en MongoDB**: exercita infra "de verdad" (Mongoose),
  pero es demasiado trabajo/complejidad para un ejercicio de "hola mundo".
  Descartado por alcance.
