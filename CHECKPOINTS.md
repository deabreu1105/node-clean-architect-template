# CHECKPOINTS.md — Criterios objetivos de "estado final correcto"

> El `reviewer` recorre esta lista al final de cada feature y marca `[x]`/`[ ]` en su
> veredicto (`progress/review_<name>.md`). Cada checkpoint tiene un **ID estable**
> (`C1`…`C11`) que se cita desde los agentes, los slash commands y `docs/`.
>
> **Este archivo es parte del arnés: no se edita por proyecto.** Enuncia las reglas en
> términos de capas y roles; los nombres concretos de tu proyecto viven en
> `docs/project/architecture.md`, y lo ejecutable sale de `harness.config.json`. Lo
> propio de tu proyecto va en el apéndice `P1`…`Pn` del final.
>
> Deriva de `docs/architecture.md`, `docs/conventions.md` y la *Quick Diagnostic* del
> skill `clean-architecture`.

## C1 — Entorno verde

`./init.sh` termina con exit code `0`.

```bash
./init.sh
```

## C2 — Regla de dependencia

La capa interna (`layers.inner` de `harness.config.json`) no importa nada de las capas
externas (`layers.outer`) ni de los paquetes de terceros vetados (`layers.bannedInInner`)
— ni siquiera transitivamente. Este es el checkpoint que hace posible `C3`.

```bash
./scripts/check-dependency-rule.sh
# exit 0 esperado
```

Qué está prohibido exactamente en este proyecto sale de la configuración, no de este
archivo. Para verlo: `node scripts/lib/dep-rule-pattern.mjs --explain`.

## C3 — Capa interna testeable en aislamiento

`commands.test` pasa al 100% **sin variables de entorno, sin base de datos levantada y
sin servidor arrancado**. Todo use-case o DTO nuevo trae su test colocado junto al archivo
que prueba, usando fakes de los puertos de la capa interna — nunca mocks de la librería
concreta.

Los puertos de este proyecto están listados en `docs/project/architecture.md § Puertos`.

## C4 — Dependencias externas solo por puerto inyectado

Toda pieza de la capa interna que necesite algo externo (hashing, firma de tokens, reloj,
IDs, aleatoriedad…) lo recibe como parámetro de constructor **requerido**, tipado contra
una abstracción definida en la propia capa interna (interface, clase abstracta o function
type). Nunca se importa un adapter concreto dentro de la capa interna, tampoco como valor
por defecto del parámetro.

## C5 — Composition root único

Los `new` de clases concretas de las capas externas aparecen solo en el composition root
(`layers.compositionRoot`). La capa de entrega recibe los puertos ya construidos por
parámetro y nunca instancia una clase concreta ella misma.

Las **excepciones sancionadas** de este proyecto están en
`docs/project/architecture.md § Excepciones sancionadas`. Si no está en esa lista, no es
una excepción.

## C6 — Frontera de datos hacia el cliente

Ninguna respuesta serializa una entidad interna cruda ni un registro crudo de la base de
datos: todo sale por el método de proyección pública de su entidad. Los DTOs nunca lanzan:
constructor privado + factory estática que devuelve `[error?, dto?]`.

Las entidades y sus proyecciones están en
`docs/project/architecture.md § Fronteras de salida`.

## C7 — Errores tipados

Los errores de use-cases e infraestructura usan la clase de error tipado del dominio y sus
factories, no `Error` crudo. La capa de entrega ramifica con `instanceof` para obtener el
código de estado correcto; si no reconoce el error, loguea y devuelve `500` sin filtrar el
stack al cliente. Las factories de error **no** loguean: el log va en el borde.

## C8 — Convenciones de módulo

- Import relativo interno con extensión explícita (ESM `nodenext`).
- Todo export nuevo se añade al barrel (`index.ts`) de su capa.
- Nombre de archivo en kebab-case con sufijo de capa/tipo (`<algo>.use-case.ts`,
  `<algo>.repository.ts`, `<algo>.adapter.ts`, `<algo>.mapper.ts`).
- Precisión con `noUncheckedIndexedAccess` y `exactOptionalPropertyTypes`.

```bash
# commands.typecheck de harness.config.json
pnpm typecheck
```

## C9 — Trazabilidad SDD

Cada `R<n>` de `specs/<name>/requirements.md` está cubierto por al menos un test concreto,
documentado en `progress/impl_<name>.md`. Todas las tasks de `specs/<name>/tasks.md` están
`[x]`, o la excepción está justificada por escrito en el mismo `progress/impl_<name>.md`.

## C10 — Cierre de sesión limpio

`progress/current.md` vuelve a su plantilla vacía
(`.claude/harness/templates/progress-current.md`), `progress/history.md` tiene la entrada
de la sesión cerrada, y no quedan `console.log()` de debug, archivos temporales ni TODOs
sin contexto.

## C11 — Contrato API sin deriva

Si el proyecto declara `harness.api` en `harness.config.json`, `docs/api/openapi.yaml` (o
la ruta que declare `harness.api.contract`) es OpenAPI 3.1 válido, con `$ref` solo
internos y `operationId` únicos, y toda operación trae `x-feature` + `x-status`. Las
rutas **realmente montadas** en la factory de rutas (`harness.api.routerFactory`)
coinciden exactamente con las operaciones `x-status: live` del contrato: ninguna ruta sin
su operación, ninguna operación `live` sin su ruta, ninguna ruta montada cuya operación
siga en `planned`.

```bash
# commands.apicheck de harness.config.json
pnpm exec tsx scripts/check-api-contract.mjs
# exit 0 esperado
```

Metodología y convenciones del contrato: `docs/api-design.md`. Si el proyecto no declara
`harness.api`, este checkpoint no aplica — márcalo `[x]` con la nota «sin fase de
contrato en este proyecto».

---

## Checkpoints del proyecto (`P1`…`Pn`)

Si existe `docs/project/checkpoints.md`, el `reviewer` lo recorre **después** de `C11` y
lo reporta con los mismos `[x]`/`[ ]`.

Usa el prefijo **`P`, nunca `C<n>`**: los IDs `C` están reservados para el arnés, y así una
versión futura del template puede añadir un `C12` sin chocar con la numeración de ningún
proyecto.

Ese archivo se entrega **ausente** a propósito. Créalo cuando tu proyecto tenga
invariantes propios que merezcan verificación en cada review.
