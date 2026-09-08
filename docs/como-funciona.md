# Cómo funciona esto

> Orientación para tu primer día. Aquí está el **modelo mental**: qué es este repositorio,
> por qué está montado así y qué gana el que lo usa.
>
> Para el **paso a paso** de cada fase, ver [`workflow.md`](workflow.md). Para las **reglas
> normativas**, [`../.claude/harness/sdd.md`](../.claude/harness/sdd.md) y
> [`../CHECKPOINTS.md`](../CHECKPOINTS.md). Este archivo no repite ninguno de los dos: los
> explica.

## Qué es

Dos cosas que conviven:

1. **Un esqueleto de código** — Clean Architecture estricta, con una sola ruta de ejemplo
   (`GET /api/health`) que demuestra las tres capas de punta a punta.
2. **Un arnés de proceso** — cinco subagentes, seis slash commands y una verificación que
   no se puede saltar, montados para que las features nuevas pasen por especificación
   antes de por código.

Lo valioso es el segundo. El esqueleto lo escribes en una tarde; el arnés es lo que evita
que un agente te implemente con entusiasmo la cosa equivocada.

## El modelo mental: dos puertas humanas

Todo el diseño gira alrededor de esto:

```
   idea  ──►  ⏸ apruebas el DISEÑO  ──►  spec  ──►  ⏸ apruebas el SPEC  ──►  código
```

Las dos `⏸` son paradas reales. El agente escribe, marca el estado y **se detiene** a
esperarte. No es burocracia: es dónde se recupera el control.

Revisar un spec de tres archivos cuesta cinco minutos. Revisar una implementación
equivocada cuesta una tarde, y encima ya está escrita, así que la tentación es
aprovecharla. La puerta mueve tu atención al momento en que corregir es barato.

La segunda idea de diseño es la **regla anti-teléfono-descompuesto**: los subagentes
escriben sus resultados en disco y te devuelven *una línea*. No ves un volcado de
doscientas líneas en el chat; ves

```
spec_ready -> specs/exportar_informes/
```

y abres el archivo si quieres. Un resultado que llega en chat sin referencia a archivo no
se acepta — ni tú lo aceptas, ni el `leader`.

## Crear un proyecto

```bash
npx degit <usuario>/node-clean-architect-template mi-api
cd mi-api && pnpm install
node scripts/scaffold.mjs            # dry-run: enseña el plan, no toca nada
node scripts/scaffold.mjs --apply    # lo aplica y verifica
```

Si el template todavía no está publicado en GitHub, `README.md` § *Crear un proyecto nuevo*
trae la alternativa local (sin `.git`, en limpio).

El scaffold pregunta lo mínimo (nombre, descripción, gestor de paquetes, puerto, si
conservas `examples/`), reescribe los archivos que llevan el nombre del proyecto, resetea
el estado del arnés y **solo declara éxito si `./init.sh` acaba en verde**. Arrancas con el
endpoint de ejemplo funcionando y su suite pasando.

Deja anotada en `progress/history.md` la revisión exacta del template de la que salió tu
proyecto. Eso es para tu yo de dentro de un año: te deja diffear contra el template
actualizado y ver qué ha aprendido el arnés desde entonces.

## El ciclo diario

```
      idea vaga ──► /brainstorm ──┐
                                  ├──► feature en `pending`
     idea clara ──► /add-feature ─┘
                                  │
                                  ▼
                          /implement-next
                                  │
                    [spec_author] escribe
              specs/<name>/{requirements,design,tasks}.md
                                  │
                                  ▼
                     ⏸  PARA — tú lees el spec
                                  │
                          /approve-spec
                                  │
                  [implementer] ──► [reviewer]
                   de dentro         veredicto en
                   hacia afuera      progress/review_<name>.md
                                  │
                                  ▼
                          /close-session
```

Lo que escribes tú son seis comandos:

| Comando | Cuándo |
|---|---|
| `/brainstorm` | La idea está borrosa y quieres pensarla con alguien antes de comprometerla |
| `/add-feature` | La idea está clara y solo falta registrarla |
| `/implement-next` | Avanzar la siguiente feature, sea cual sea su estado |
| `/approve-spec` | Has leído el spec y te vale |
| `/run-review` | Forzar una review (p. ej. si la sesión se cortó a medias) |
| `/close-session` | Cerrar dejando el repositorio en verde y la bitácora al día |

El `implementer` recorre las tasks **de dentro hacia afuera**: primero el DTO, el use-case
y el contrato en la capa interna; después la implementación concreta; al final la ruta. No
es una preferencia estética — ese orden hace casi imposible romper la Regla de Dependencia
por accidente, porque cuando escribes la capa interna todavía no existe nada externo que
importar.

## Lo que te protege sin que hagas nada

**`./init.sh`** es la puerta que no se puede saltar. Siete secciones: entorno, archivos
base del arnés, skills vendorizados, validez de `feature_list.json` y sus specs, Regla de
Dependencia, typecheck y suite completa. Ninguna feature se marca `done` sin que esté en
verde; lo corre el `reviewer`, y un hook lo dispara al cerrar sesión.

Su comprobación más valiosa es la menos obvia: **una corrida verde con cero tests es
roja**. La bifurcación anterior de este arnés hacía glob de un directorio que no existía,
no encontraba nada, salía con código 0 y reportó verde durante meses sin haber ejecutado
jamás la suite real. Un arnés que puede mentirte no sirve para nada.

**Las reglas de `.claude/rules/`** se activan solas según lo que abras, gracias a su
`paths:` scope:

| Editas… | Aparece |
|---|---|
| `src/domain/**` | La Regla de Dependencia: qué no puede importar la capa interna |
| `src/presentation/**` | Errores, códigos de estado, frontera de salida |
| `src/**/*.test.ts` | Fakes tipados contra el puerto, cero I/O |
| `src/**` | Convenciones de ESM, nombres y tipos estrictos |

Son imperativas y cortas a propósito, con un puntero a `conventions.md` para el porqué. La
diferencia con un README de capa es el momento: un README en `src/domain/` se lee *nunca*;
una regla scopeada a `src/domain/**` se lee *exactamente cuando alguien edita domain*.

**`CHECKPOINTS.md`** (`C1`–`C10`) es la lista con la que el `reviewer` aprueba o rechaza.
Si tu proyecto tiene invariantes propios, los añades como `P1`…`Pn` en
`project/checkpoints.md` sin tocar los `C` — así una versión futura del template puede
añadir un `C11` sin chocar con tu numeración.

## Cómo lo adaptas a otro proyecto

Todo lo específico del stack vive en **`harness.config.json`**:

```json
"layers": {
  "sourceRoot": "src",
  "inner": "domain",
  "outer": ["config", "data", "infrastructure", "presentation"],
  "bannedInInner": ["express", "mongoose", "bcryptjs", "jsonwebtoken", "env-var", "dotenv"]
}
```

Si el próximo proyecto usa Prisma en vez de Mongoose, cambias `bannedInInner` y el guard
se ajusta solo. Si tu capa interna se llama `core`, cambias `inner`. **`init.sh`,
`CHECKPOINTS.md` y los cinco agentes ya no nombran nada de ningún stack concreto.**

Conviene dejar en `bannedInInner` paquetes que ni siquiera tienes instalados: prohibir lo
que no usas cuesta cero y te protege el día que alguien lo añada.

`CLAUDE.md` está partido en dos mitades y no se edita a mano:

- **`.claude/harness/`** — el arnés. Idéntico en todos tus proyectos. Cuando lo mejoras,
  mejoras la mitad que viaja a todas partes.
- **`docs/project/`** — tu proyecto. Lo único que escribes: qué hace, qué clases tiene,
  qué puntos ciegos conoces.

Esa separación es la razón de ser del template. Las dos veces anteriores que este arnés se
copió a un proyecto nuevo, la migración costó cuatro fases de edición manual porque las
dos mitades estaban entrelazadas en los mismos archivos.

## Cuándo NO usar nada de esto

Para un typo, un `console.log` olvidado, renombrar una variable, ajustar un comentario:
edita y ya. El arnés es para **features** — algo que merece una especificación y una
review. Meterlo todo por el ciclo SDD no lo hace más seguro, solo más lento, y acabas
saltándotelo por costumbre. Que es peor.

`specs.md` lo dice explícitamente: las features con `"sdd": false` no llevan spec.

## Dónde seguir

| Si quieres… | Lee |
|---|---|
| El paso a paso de cada fase | [`workflow.md`](workflow.md) |
| Escribir o leer un spec (notación EARS) | [`specs.md`](specs.md) |
| Las reglas de arquitectura | [`architecture.md`](architecture.md) |
| Las convenciones de código | [`conventions.md`](conventions.md) |
| Cómo se demuestra que algo funciona | [`verification.md`](verification.md) |
| Cuándo hacer brainstorming | [`ideation.md`](ideation.md) |
| Los criterios de review | [`../CHECKPOINTS.md`](../CHECKPOINTS.md) |
| Ver un ciclo SDD terminado de verdad | [`../examples/sdd-cycles/`](../examples/sdd-cycles/) |
| Ver la arquitectura en un sistema entero | [`../examples/auth-mongo/CLEAN_ARCHITECTURE.md`](../examples/auth-mongo/CLEAN_ARCHITECTURE.md) |
