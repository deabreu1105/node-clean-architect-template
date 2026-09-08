# Convenciones de código

> Homogeneidad extrema. La IA predice mejor cuando el repositorio se parece
> a sí mismo en todas partes.

## Estilo TypeScript / Node.js

- **Versión:** Node.js 20+, TypeScript, ESM estricto (`"module": "nodenext"`
  en `tsconfig.json`, `"type": "module"` en `package.json`).
- **Runtime de desarrollo:** `tsx`. Los comandos exactos están en
  `harness.config.json` (`commands.dev`, `commands.test`, `commands.build`);
  no los asumas de memoria.
- **Extensiones en imports relativos:** siempre `.js` explícito, aunque el
  archivo fuente sea `.ts` — lo exige `nodenext`.
  `import { HealthStatusEntity } from "../entities/health-status.entity.js";`
- **Formato:** 2 espacios de indentación.
- **Semicolons:** sí, al final de cada sentencia.
- **Strings:** comillas dobles `"..."` por defecto. Backticks solo para
  template literals con interpolación o multilínea.
- **Imports:** stdlib de Node (`node:*`) primero, luego paquetes de
  terceros, luego locales — este orden ya lo sigue el código existente.
  Siempre prefijo `node:` para módulos built-in (`node:path`, no `path`).
- **Tipos estrictos:** `tsconfig.json` tiene `noUncheckedIndexedAccess` y
  `exactOptionalPropertyTypes` activos. Un campo opcional se declara
  `foo?: string`, no `foo?: string | undefined`, y un acceso indexado
  (`arr[0]`, `query['x']`) puede ser `undefined` — trátalo así, no lo asumas
  presente.
- **Los tests se typechequean.** `tsconfig.json` los incluye; el que los
  excluye es `tsconfig.build.json`, que solo se usa para generar `dist/`.

## Nombres

| Tipo                          | Convención                              | Ejemplo                                    |
|--------------------------------|-------------------------------------------|----------------------------------------------|
| Archivos de dominio            | `kebab-case.<tipo>.ts`                    | `get-health.use-case.ts`, `health.repository.ts`, `custom.error.ts` |
| Archivos de infraestructura    | `kebab-case.<tipo>.impl.ts` o `.adapter.ts` | `health.repository.impl.ts`, `system-clock.adapter.ts` |
| Archivos de presentación       | `kebab-case.ts` (sin sufijo de tipo)       | `controller.ts`, `routes.ts`, `server.ts` |
| Clases                         | `PascalCase`                              | `GetHealth`, `HealthStatusEntity`, `CustomError` |
| Interfaces / abstract classes  | `PascalCase`, sin prefijo `I`             | `HealthRepository`, `PublicHealth`, `Clock`   |
| Funciones / variables          | `camelCase`                               | `getSnapshot`, `systemClock`                 |
| Tests                          | mismo nombre + `.test.ts`, colocado junto al archivo | `get-health.use-case.test.ts` junto a `get-health.use-case.ts` |

El sufijo de tipo (`.use-case`, `.dto`, `.entity`, `.datasource`,
`.repository`, `.adapter`, `.impl`, `.mapper`, `.error`) es lo que hace que
el nombre de archivo diga a qué capa y rol pertenece sin abrirlo.

## Estructura de archivo

Imports ordenados primero, luego una cabecera de comentario explicando el
propósito del archivo. Hay dos estilos, según el tipo de pieza:

**Piezas estructurales de la arquitectura** (contratos abstractos, DTOs,
use-cases, implementaciones concretas, controller, middleware) llevan la
etiqueta `// CAPA: <Capa> | TIPO: <Tipo>`:

```ts
import type { Clock } from "../../interfaces/clock.interface.js";
import type { HealthRepository } from "../../repositories/health.repository.js";

// CAPA: Domain | TIPO: UseCase
// Compone el estado del servicio a partir del snapshot del repositorio y del
// instante que da el reloj inyectado.
```

Ver `src/domain/use-cases/health/*.ts`, `src/domain/dtos/**/*.ts`,
`src/domain/repositories/*.ts`,
`src/infrastructure/repositories/*.impl.ts`,
`src/presentation/health/controller.ts`.

**Piezas de soporte** (entidades, errores, adapters, mappers, wiring:
`server.ts`, `routes.ts`, `envs.ts`, `app.ts`) llevan un comentario
explicativo sin esa etiqueta fija, centrado en el *por qué* de una decisión
de diseño concreta:

```ts
// Envuelve el reloj del sistema para satisfacer el puerto `Clock` de domain.
// Encapsular aquí lo externo permite que un test fije la hora sin tocar Date,
// y que domain siga sin importar nada de fuera.
export const systemClock: Clock = () => new Date();
```

Al añadir un archivo nuevo, sigue el estilo del tipo de pieza más parecido
que ya exista en su carpeta.

## Patrón DTO — ctor privado + factory `[error?, dto?]`

Los DTOs nunca lanzan. Ctor `private`, factory `static` que valida y
devuelve una tupla:

```ts
export class HealthQueryDto {
  private constructor(
    public readonly verbose: boolean,
  ) {}

  static create(query: Record<string, unknown>): [string?, HealthQueryDto?] {
    const verbose = Validators.boolean(query["verbose"]);
    if (verbose === null) return ['verbose debe ser "true" o "false"'];
    return ["", new HealthQueryDto(verbose)];
  }
}
```

El slot de error es `""` (string vacío), no `undefined`, en el caso de
éxito — así lo comprueban los tests (`error === ""`). El controller
comprueba ese slot y responde `400` directamente si viene con contenido.

## Tests

- Colocados junto al archivo que prueban, mismo nombre + `.test.ts`
  (`health-query.dto.test.ts` al lado de `health-query.dto.ts`). No hay
  carpeta `tests/` separada.
- `import { test } from "node:test"` y
  `import assert from "node:assert/strict"`. Sin librería de mocking: se
  construyen fakes a mano tipados contra los puertos de la capa interna
  (`HealthRepository`, `Clock`).
- Cero I/O real: nada de base de datos, nada de `.env`, nada de HTTP. Un test
  que necesita eso no es un test de dominio — es verificación manual (ver
  `docs/verification.md`, Nivel 3).
- Nombres de test descriptivos en inglés, como frase:
  `"GetHealth takes the timestamp from the injected clock, never from Date directly"`.
- Comando estándar: `commands.test` de `harness.config.json`. Los tests **sí**
  se typechequean; el que los excluye es `tsconfig.build.json`, solo para el
  output de `dist/`.

## Manejo de errores

Excepción única de dominio, `src/domain/errors/custom.error.ts`:

```ts
export class CustomError extends Error {
  private constructor(public readonly statusCode: number, message: string) {
    super(message);
  }

  static badRequest = (message: string) => new CustomError(400, message);
  static unauthorized = (message: string) => new CustomError(401, message);
  static forbidden = (message: string) => new CustomError(403, message);
  static notFound = (message: string) => new CustomError(404, message);
  static internalServerError = (message = "Internal Server Error") =>
    new CustomError(500, message);
}
```

Use-cases e infraestructura lanzan `CustomError` vía sus factories, nunca
`Error` crudo. `AuthController`/`AuthMiddleware` capturan y ramifican con
`error instanceof CustomError` → `res.status(error.statusCode).json({
message: error.message })`; si no es `CustomError`, loguean y devuelven
`500`. Nunca se propaga un stack trace al cliente.

## Comentarios

Al contrario que en un proyecto minimalista: **sí se escriben**, y con un
propósito didáctico deliberado (ver los dos estilos de cabecera arriba).
Dentro del cuerpo, comenta solo lo que no es obvio por el nombre (una
decisión de diseño, una excepción a la regla general, la diferencia entre
dos conceptos parecidos, como una entidad del dominio frente al registro
crudo de la base de datos) — no repitas en prosa lo que el código ya dice.
