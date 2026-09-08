# Tasks: hello_world (endpoint hola mundo, ejercicio 3 capas)

Orden de dentro hacia afuera: `domain/` → `infrastructure/` → `presentation/` →
composition root (`app.ts`). Cada task referencia los `R<n>` de `requirements.md` que
cubre. El `implementer` marca `[x]` al completar cada una; ninguna queda a medias sin
justificación documentada en `progress/impl_hello_world.md`.

## domain/

- [ ] T1 — Crear `domain/repositories/greeting.repository.ts` con la clase abstracta
      `GreetingRepository` (método abstracto `getMessage(): string`), cabecera
      `// CAPA: Domain | TIPO: Contrato (clase abstracta)` siguiendo el estilo de
      `auth.repository.ts`. Cubre: R1, R2.

- [ ] T2 — Crear `domain/use-cases/greeting/get-greeting.use-case.ts` con la clase
      `GetGreeting` (recibe `GreetingRepository` por constructor, `execute()` síncrono
      retorna `this.greetingRepository.getMessage()`), cabecera
      `// CAPA: Domain | TIPO: UseCase`. No importa nada de `infrastructure/` ni
      `config/`. Cubre: R2, R3.

- [ ] T3 — Test `domain/use-cases/greeting/get-greeting.use-case.test.ts`:
      `"GetGreeting delegates straight to the repository"` (mismo patrón que
      `get-users.use-case.test.ts`) — fake `GreetingRepository` con `getMessage()`
      devolviendo un string fijo de prueba, `assert.equal` sobre el resultado de
      `execute()`. Cubre: R3, R11.

- [ ] T4 — Añadir a `domain/index.ts`:
      `export * from './repositories/greeting.repository.js';` y
      `export * from './use-cases/greeting/get-greeting.use-case.js';`. Cubre: R12.

## infrastructure/

- [ ] T5 — Añadir `APP_NAME: envVar.get('APP_NAME').required().asString(),` a
      `config/envs.ts`. Cubre: R6.

- [ ] T6 — Añadir la línea `APP_NAME=` a `src/.env.template`. Cubre: R7.

- [ ] T7 — Crear `infrastructure/repositories/greeting.repository.impl.ts` con
      `GreetingRepositoryImpl extends GreetingRepository`, `getMessage()` retorna
      `` `Hola mundo desde ${envs.APP_NAME}` ``, cabecera
      `// CAPA: Infrastructure | TIPO: Implementación concreta de GreetingRepository`.
      Único archivo de este feature que importa `config/envs.ts`. Cubre: R4, R5.

- [ ] T8 — Añadir a `infrastructure/index.ts`:
      `export * from './repositories/greeting.repository.impl.js';`. Cubre: R12.

## presentation/

- [ ] T9 — Crear `presentation/hello/controller.ts` con `HelloController` (recibe
      `GreetingRepository` por constructor, `getHello = (req, res) => {...}` instancia
      `new GetGreeting(this.greetingRepository)`, llama `execute()`, responde
      `res.json({ message })`, sin `try/catch` ni `CustomError`). Cubre: R8.

- [ ] T10 — Crear `presentation/hello/routes.ts` con
      `HelloRoutes.routes(greetingRepository)` devolviendo un `Router` con
      `GET /` → `controller.getHello` (sin middleware de auth). Cubre: R8, R9.

- [ ] T11 — Modificar `presentation/routes.ts`: `AppRoutes.routes` gana el parámetro
      `greetingRepository: GreetingRepository` (segundo parámetro, junto al
      `authRepository` existente) y monta
      `router.use('/api/hello', HelloRoutes.routes(greetingRepository));`. Cubre: R9.

## Composition root

- [ ] T12 — Modificar `app.ts`: instanciar
      `const greetingRepository = new GreetingRepositoryImpl();` junto a la
      construcción existente de `authRepository`, y pasar ambos a
      `AppRoutes.routes(authRepository, greetingRepository)`. Ningún `new
      GreetingRepositoryImpl()` en ningún otro archivo. Cubre: R10.

## Verificación final (no es código nuevo, es checklist de cierre)

- [ ] T13 — Verificación manual Nivel 3 (`docs/verification.md`): levantar `pnpm dev`
      con `APP_NAME` configurado en `.env`, hacer `GET /api/hello` (sin
      `Authorization`) y confirmar `200` con `{ "message": "Hola mundo desde
      <APP_NAME>" }`. Documentar el resultado en `progress/impl_hello_world.md`. Cubre:
      R4, R8, R9.

- [ ] T14 — Ejecutar `./init.sh` en verde (typecheck, guard de la Regla de
      Dependencia, `pnpm test`) antes de marcar la feature como lista para review.
      Cubre: R1, R2, R12.
