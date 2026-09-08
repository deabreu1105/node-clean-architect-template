# Arquitectura — estándar normativo

> Los agentes revisores evalúan el código contra este archivo. **Si no está aquí, no es un
> requisito.**
>
> Este archivo es parte del arnés: enuncia los principios de forma genérica y **no se edita
> por proyecto**. Los nombres concretos (qué clases, qué puertos, qué excepciones) viven en
> `docs/project/architecture.md`. Lo ejecutable sale de `harness.config.json`.

## Anillos y carpetas

Clean Architecture organiza el código en círculos concéntricos, y solo hay una regla que
importe:

> **El código fuente solo puede depender hacia adentro.** Un círculo interior no puede
> saber nada de un círculo exterior — ni sus clases, ni sus funciones, ni sus tipos.

El porqué: las capas internas son las reglas de negocio (lo que de verdad importa y cambia
poco) y las externas son detalles técnicos (el framework HTTP, la base de datos, la
librería de hashing — cosas que **sí** cambian). Si las reglas no conocen los detalles,
puedes cambiar los detalles sin tocar las reglas.

```
┌───────────────────────────────────────────────────────────┐
│ FRAMEWORKS & DRIVERS                                       │
│ las librerías de node_modules                              │
│  ┌─────────────────────────────────────────────────────┐  │
│  │ INTERFACE ADAPTERS                                   │  │
│  │ presentation/ (controllers, rutas, middlewares)      │  │
│  │ infrastructure/ (datasources, repositories,          │  │
│  │                  mappers, adapters)                  │  │
│  │  ┌───────────────────────────────────────────────┐  │  │
│  │  │ USE CASES                                      │  │  │
│  │  │ domain/use-cases, dtos, repositories,          │  │  │
│  │  │ datasources                                     │  │  │
│  │  │  ┌────────────────────────────────────────┐   │  │  │
│  │  │  │ ENTITIES                                 │   │  │  │
│  │  │  │ domain/entities                          │   │  │  │
│  │  │  └────────────────────────────────────────┘   │  │  │
│  │  └───────────────────────────────────────────────┘  │  │
│  └─────────────────────────────────────────────────────┘  │
└───────────────────────────────────────────────────────────┘
```

Las carpetas **no son exactamente** los cuatro anillos del libro de Robert C. Martin: son
una agrupación práctica que los respeta.

| Carpeta | Anillo(s) que contiene |
|---|---|
| `domain/entities/` | Entities |
| `domain/{use-cases,dtos,repositories,datasources,interfaces}/` | Use Cases |
| `infrastructure/`, `presentation/` | Interface Adapters |
| `node_modules` | Frameworks & Drivers |

Lo importante no es el nombre de la carpeta, es **hacia dónde apuntan los imports**.

## Principios

1. **La Regla de Dependencia.** `presentation` → `infrastructure` → `domain`. La capa
   interna no sabe que existen el framework HTTP, el ORM ni la carga de `.env`. Verificable
   mecánicamente: `./scripts/check-dependency-rule.sh` (checkpoint `C2`).

2. **Qué le está permitido importar a cada capa.** Los nombres exactos salen de
   `harness.config.json`:

   | Capa | Puede importar | No puede importar |
   |---|---|---|
   | `layers.inner` | otras cosas de la propia capa interna | `layers.outer` y `layers.bannedInInner` |
   | capas externas | la capa interna, y librerías | — |
   | capa de entrega | la capa interna (contratos) | implementaciones concretas, salvo por parámetro |

3. **Puertos definidos en la capa interna, implementados afuera.** Toda pieza de la capa
   interna que necesite algo externo lo declara como interface, clase abstracta o function
   type **dentro** de la capa interna, y lo recibe por constructor **requerido**. Nunca
   importa el adapter concreto, ni como valor por defecto.

4. **Errores explícitos y tipados.** Lo que puede fallar lanza la clase de error tipado del
   dominio con su código de estado, no `Error` crudo. Las factories de error **no** tienen
   efectos secundarios: no loguean. El log va en el handler del borde.

5. **Los DTOs nunca lanzan.** Constructor privado + factory estática que devuelve
   `[error?, dto?]`. La capa de entrega comprueba el slot de error y responde `400`.

6. **Frontera de salida.** Ninguna respuesta serializa una entidad interna completa ni un
   registro crudo de la base de datos. Cada entidad expone un método de proyección pública
   y ese es el único camino al cable.

7. **Un solo composition root.** `layers.compositionRoot` es el único archivo que hace
   `new` de clases concretas de las capas externas. Todo lo demás las recibe inyectadas.
   Las excepciones sancionadas se declaran en `docs/project/architecture.md`.

8. **Librerías externas, siempre envueltas.** Cada dependencia de terceros vive detrás de
   un adapter en el directorio de adapters. `config/` está reservado exclusivamente a la
   carga de variables de entorno.

9. **Cada capa tiene su barrel.** Los consumidores importan del `index.ts` de la capa, no
   de sus subcarpetas.

## Flujo de datos (ejemplo: `GET /api/health?verbose=true`)

```
cliente
  └─> presentation/server.ts            express(), json(), monta el router raíz
       └─> presentation/routes.ts       AppRoutes.routes(healthRepository, clock)
            └─> presentation/health/routes.ts     construye HealthController
                 └─> HealthController.getHealth
                      ├─ HealthQueryDto.create(req.query)   ← domain: valida, no lanza
                      │    └─ si [error] → 400 y termina
                      ├─ new GetHealth(healthRepository, clock).execute()   ← domain
                      │    └─ healthRepository.getSnapshot()    ← puerto abstracto
                      │         └─ HealthRepositoryImpl        ← infrastructure, lee config/
                      └─ entity.toPublic(verbose) → res.json   ← frontera de salida
```

Fíjate en la dirección: el controller conoce los contratos de `domain`; la implementación
concreta la recibe inyectada desde el composition root. `GetHealth` no sabe de dónde salen
los datos ni quién le da la hora.

## Qué NO hacer

- No instanciar una clase concreta de una capa externa fuera del composition root.
- No hacer que la capa interna importe una capa externa ni una librería vetada, ni directa
  ni transitivamente.
- No serializar una entidad interna ni un registro crudo en una respuesta.
- No lanzar `Error` crudo desde un use-case o un adapter.
- No añadir un valor por defecto a una dependencia de un use-case importando el adapter
  concreto dentro de la capa interna — ni siquiera "solo para no romper la firma".
- No dejar un método nuevo en un contrato abstracto sin su implementación correspondiente
  (o al revés): los dos se mueven juntos.

## Vocabulario

| Término (libro de Uncle Bob) | Dónde vive aquí |
|---|---|
| Entity | `domain/entities/` |
| Use Case / Interactor | `domain/use-cases/` |
| Request Model | los DTOs, `domain/dtos/` |
| Response Model | el resultado del método de proyección de la entidad |
| Input/Output Boundary | la interface `<Algo>UseCase` declarada dentro de cada archivo de use case |
| Gateway | el contrato abstracto de repository/datasource + su implementación en `infrastructure/` |
| Presenter | el método de proyección pública de la entidad |
| Controller | `presentation/<recurso>/controller.ts` |
| Frameworks & Drivers | las librerías de `node_modules` |
| Main / Composition Root | `layers.compositionRoot` |

La columna derecha, con los nombres reales de este proyecto, está en
`docs/project/architecture.md`.

Para la teoría completa (SOLID, componentes, boundaries), el repo trae el skill
`clean-architecture` en `.claude/skills/clean-architecture/`. Para verla aplicada a un
sistema entero, `examples/auth-mongo/CLEAN_ARCHITECTURE.md` la recorre línea a línea.
