# Requirements: hello_world (endpoint hola mundo, ejercicio 3 capas)

> Fuente: `feature_list.json` (id 2) + `docs/ideas/2026-09-01-hello-world-endpoint-design.md`
> (diseño ya aprobado por el humano). Notación EARS estricta, ver `docs/specs.md`.
>
> Leyenda de verificación:
> - **[Test dominio]** — verificable por un test en `src/domain/**/*.test.ts`, sin BD/Express/`.env`.
> - **[Nivel 3]** — exige Mongo/Express/`.env` reales o inspección de código; lo verifica el
>   `implementer` siguiendo `docs/verification.md` Nivel 3, no un test de dominio.

## R1
El sistema DEBE exponer en `domain/repositories/greeting.repository.ts` una clase
abstracta `GreetingRepository` con un único método abstracto `getMessage(): string`.

*Verificación:* **[Test dominio]** indirecta — el fake inyectado en el test de R3 está
tipado contra este contrato, así que un cambio de forma incompatible rompe la
compilación (`tsx --test`); además `pnpm exec tsc --noEmit` falla si el contrato no
existe con esta firma.

## R2
El código de `GreetingRepository` (`domain/repositories/greeting.repository.ts`) y de
`GetGreeting` (`domain/use-cases/greeting/get-greeting.use-case.ts`) NO DEBE importar,
directa ni transitivamente, nada de `infrastructure/`, `config/`, `data/` ni `express`.

*Verificación:* **[Nivel 3]** — guard de la Regla de Dependencia que corre `./init.sh`
(grep del checkpoint `C2` de `CHECKPOINTS.md`); también lo confirma que `pnpm test`
siga corriendo sin `.env` presente.

## R3
CUANDO se invoca `execute()` sobre una instancia de `GetGreeting` construida con un
`GreetingRepository` inyectado, el sistema DEBE retornar exactamente el valor que
devuelve `repository.getMessage()` (sin transformarlo).

*Verificación:* **[Test dominio]** — `get-greeting.use-case.test.ts`, fake
`GreetingRepository` con `getMessage()` devolviendo un string fijo de prueba, se
comprueba que `execute()` retorna ese mismo string.

## R4
El sistema DEBE proporcionar `GreetingRepositoryImpl` en
`infrastructure/repositories/greeting.repository.impl.ts`, que extienda
`GreetingRepository` y cuyo `getMessage()` retorne el string
`` `Hola mundo desde ${envs.APP_NAME}` ``.

*Verificación:* **[Nivel 3]** — este archivo importa `config/envs.ts`, que exige un
`.env` completo (`PORT`, `MONGO_URL`, `MONGO_DB_NAME`, `JWT_SEED`, `APP_NAME`) para
cargar sin lanzar; no es un test de dominio. Se verifica arrancando `pnpm dev` con
`APP_NAME` configurado y golpeando `GET /api/hello` manualmente (ver R8), o por
inspección directa del código.

## R5
`GreetingRepositoryImpl` DEBE ser el único archivo nuevo de este feature que importa
`config/envs.ts` (ni `domain/`, ni `presentation/hello/` lo hacen).

*Verificación:* **[Nivel 3]** — inspección de código / grep manual sobre los archivos
nuevos de este feature (`domain/repositories/greeting.repository.ts`,
`domain/use-cases/greeting/get-greeting.use-case.ts`,
`presentation/hello/controller.ts`, `presentation/hello/routes.ts`) confirmando
ausencia de `import ... from ".../config`.

## R6
El sistema DEBE exponer `APP_NAME` en `config/envs.ts` como variable de entorno
requerida, validada con `env-var` vía `.required().asString()`.

*Verificación:* **[Nivel 3]** — arrancar la app sin `APP_NAME` en `.env` DEBE hacer que
`config/envs.ts` lance al cargar (mismo comportamiento que las variables existentes);
se confirma manualmente o por inspección del código, no hay test de dominio posible
(`domain/` no puede importar `config/`, ver R2).

## R7
El sistema DEBE incluir la línea `APP_NAME=` en `src/.env.template`.

*Verificación:* **[Nivel 3]** — inspección directa del archivo.

## R8
CUANDO el cliente hace `GET /api/hello` sin cabecera `Authorization`, el sistema DEBE
responder `200` con cuerpo JSON `{ "message": string }`, donde `message` es el valor
retornado por `GreetingRepositoryImpl.getMessage()`.

*Verificación:* **[Nivel 3]** — requiere Express real levantado; se verifica con una
petición manual (p. ej. un archivo `request/get-hello.rest` o `curl`) contra el
servidor corriendo con `pnpm dev`, siguiendo `docs/verification.md` Nivel 3. No hay
input de cliente ni rama de error posible (no hay body, no hay auth), por lo que no
aplica un requirement `SI...ENTONCES` adicional de error.

## R9
El sistema DEBE montar el router de este feature como
`HelloRoutes.routes(greetingRepository)` en `presentation/hello/routes.ts`, y
`presentation/routes.ts` (`AppRoutes.routes`) DEBE exponerlo bajo el prefijo
`/api/hello`, recibiendo `greetingRepository` como parámetro adicional junto al
`authRepository` ya existente.

*Verificación:* **[Nivel 3]** — inspección de código (firma de `AppRoutes.routes` y de
`HelloRoutes.routes`) más la verificación funcional de R8, que solo pasa si el router
está montado correctamente en ese prefijo.

## R10
El sistema DEBE instanciar `GreetingRepositoryImpl` únicamente en `app.ts`
(composition root) y pasarla a `AppRoutes.routes` junto con `authRepository`; ningún
archivo bajo `presentation/` DEBE hacer `new GreetingRepositoryImpl()`.

*Verificación:* **[Nivel 3]** — inspección de código de `app.ts` y de
`presentation/hello/{controller,routes}.ts` confirmando ausencia de `new
GreetingRepositoryImpl` fuera de `app.ts` (mismo patrón que el guard de composition
root descrito en `docs/architecture.md` punto 7).

## R11
El sistema DEBE tener un test en
`domain/use-cases/greeting/get-greeting.use-case.test.ts` que cubra el comportamiento
de R3 usando un `GreetingRepository` fake (objeto literal), sin BD, sin Express y sin
`.env`.

*Verificación:* **[Test dominio]** — es el propio test; se confirma con `pnpm test`
en verde y colocación del archivo junto a `get-greeting.use-case.ts`.

## R12
Los barrels `domain/index.ts` e `infrastructure/index.ts` DEBEN exportar,
respectivamente, `GreetingRepository`+`GetGreeting` y `GreetingRepositoryImpl`.

*Verificación:* **[Nivel 3]** — `pnpm exec tsc --noEmit` falla si
`presentation/hello/controller.ts` (que importa `GreetingRepository` desde el barrel
de `domain/`) o `app.ts` (que importa `GreetingRepositoryImpl` desde el barrel de
`infrastructure/`) no encuentran el export; se confirma también por inspección directa
de ambos barrels.

## Trazabilidad con `feature_list.json` (id 2, `acceptance`)

| Acceptance original (resumen) | Requirements que lo cubren |
|---|---|
| `GreetingRepository` con `getMessage(): string` | R1 |
| `GetGreeting` recibe `GreetingRepository`, no importa infra/config | R2, R3 |
| `GreetingRepositoryImpl` retorna mensaje con `envs.APP_NAME`, único lector de `config/envs.ts` | R4, R5 |
| `config/envs.ts` expone `APP_NAME` requerida; `.env.template` incluye la línea | R6, R7 |
| `GET /api/hello` sin JWT responde 200 `{ message }`, montado vía `HelloRoutes.routes` bajo `presentation/hello/` | R8, R9 |
| `app.ts` instancia `GreetingRepositoryImpl`, pasa a `AppRoutes.routes`; ningún `new` de infra fuera de `app.ts` | R10 |
| Tests en `get-greeting.use-case.test.ts` con fake `GreetingRepository` | R3, R11 |
| Barrels `domain/index.ts` e `infrastructure/index.ts` exportan los símbolos nuevos | R12 |
