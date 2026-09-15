# Spec Driven Development (SDD)

> Este proyecto sigue un flujo Kiro-style: requirements → design → tasks → code.
> El código no se escribe hasta que el spec está aprobado por un humano.

## Estructura

Cada feature nueva (`"sdd": true` en `feature_list.json`) tiene una carpeta
dedicada en cuanto deja `pending`:

```
specs/<feature-name>/
├── requirements.md   # QUÉ se necesita (EARS notation)
├── design.md         # CÓMO se construirá (decisiones técnicas)
└── tasks.md          # PASOS concretos a implementar
```

El `feature-name` coincide con el campo `name` de `feature_list.json`.

## Estados de una feature

| Estado           | Significado                                                    |
|------------------|-----------------------------------------------------------------|
| `pending`        | Sin spec (ni contrato, si aplica). Actúa `api_designer` si `"api": true`, si no `spec_author`. |
| `contract_ready` | Solo `"api": true`. Contrato drafted en `docs/api/openapi.yaml`. Esperando aprobación humana. |
| `spec_ready`     | Spec drafted. Esperando aprobación humana. NO se toca código.  |
| `in_progress`    | Spec aprobado. `implementer` trabajando.                       |
| `done`           | Código verde, `reviewer` aprobó, sesión cerrada.               |
| `blocked`        | Atascado. Razón en `progress/current.md`.                      |

Ver `docs/api-design.md` para la fase de contrato y sus reglas.

## La puerta de aprobación humana

El flujo automático se detiene **una vez**: cuando el `spec_author` termina
sus tres archivos, marca la feature como `spec_ready` y para. El humano
lee `specs/<feature>/` y dice "aprobado" (o pide cambios).

Solo entonces el `leader` transiciona `spec_ready → in_progress` y lanza
el `implementer`.

```
pending → [spec_author] → spec_ready → ⏸ HUMANO → in_progress → [implementer → reviewer] → done
```

Si la feature es `"api": true`, hay una puerta previa: `pending → [api_designer] →
contract_ready → ⏸ HUMANO → spec_author...`. El `spec_author` entonces referencia el
contrato ya aprobado en vez de diseñarlo — ver `docs/api-design.md`.

## Historia de usuario (obligatoria)

`requirements.md` abre siempre con una sección `## Historia de usuario` — antes de
cualquier otra cosa, incluso antes de `## Escenarios de origen` si la feature trae
Gherkin. Es el "para qué": una sola frase en el formato clásico de historia de usuario,
que ancla el resto del spec a un valor concreto para alguien.

```markdown
## Historia de usuario (PROJ-123)

Como usuario registrado, quiero iniciar sesión con mi correo y contraseña, para acceder
a mi panel de control.
```

- El `(PROJ-123)` del encabezado es **opcional** — solo aparece si la feature declara un
  `jira` en `feature_list.json` (ver `docs/jira-mapping.md`).
- **A diferencia de los escenarios Gherkin, la Historia de usuario nunca queda ausente.**
  Si la feature ya trae Gherkin de origen y su bloque `Característica:` incluye su propio
  narrative "Como/Quiero/Para" (es la convención estándar de un `.feature` file), la
  Historia de usuario de aquí lo **cita literal** — nunca redacta una versión distinta a
  la que ya viene en el Gherkin. Si no hay Gherkin, el `spec_author` la redacta él mismo
  a partir de `title`/`description`/`acceptance` de `feature_list.json` — es una sola
  frase, así que no hace falta que el humano la traiga ya escrita.
- La Historia de usuario **no sustituye a los `R<n>`**: sigue siendo el `reviewer` quien
  únicamente verifica `R<n>` ↔ test (§ Trazabilidad más abajo). Es contexto de lectura,
  no una unidad verificable por sí misma.
- **Granularidad: una Historia de usuario por spec, siempre.** Coincide con la regla dura
  "una sola feature a la vez" (`maxInProgress: 1`) — cada `specs/<name>/` resuelve
  exactamente una. Si tu equipo agrupa varias historias relacionadas en Jira, eso es un
  Epic del lado de Jira; el arnés no necesita saberlo (ver `docs/jira-mapping.md`).

## requirements.md — EARS estricto

Las requirements se redactan en **EARS** (Easy Approach to Requirements
Syntax). Cada requirement es un párrafo numerado con uno de estos cinco
patrones:

| Patrón         | Plantilla                                                   |
|----------------|-------------------------------------------------------------|
| **Ubicuo**     | `El sistema DEBE <acción>.`                                 |
| **Evento**     | `CUANDO <disparador>, el sistema DEBE <acción>.`            |
| **Estado**     | `MIENTRAS <estado>, el sistema DEBE <acción>.`              |
| **Opcional**   | `DONDE <feature opcional>, el sistema DEBE <acción>.`       |
| **No deseado** | `SI <evento no deseado> ENTONCES el sistema DEBE <acción>.` |

Reglas duras:

- Cada requirement tiene un id estable: `R1`, `R2`, ...
- Cada requirement DEBE ser verificable por al menos un test concreto.
- No mezcles varios `DEBE` en un mismo requirement. Si hay más de uno, parte.
- No uses verbos blandos ("podría", "puede", "soporta"). Solo `DEBE` / `NO DEBE`.

Ejemplo:

```markdown
## R1
CUANDO el cliente hace `GET /api/health` sin el parámetro `verbose`, el
sistema DEBE responder `200` con un objeto que contenga exactamente
`status` y `appName`, y ningún otro campo.

## R2
SI el parámetro `verbose` llega con un valor que no es `"true"` ni
`"false"` ENTONCES el sistema DEBE responder `400` con un mensaje que
nombre el parámetro, sin lanzar una excepción.
```

### Escenarios de origen (Gherkin, opcional)

Cuando el humano (o QA, o producto) entrega los acceptance criteria ya redactados como
escenarios Gherkin (`Característica` / `Escenario` / `Dado`/`Cuando`/`Y`/`Entonces`/
`Pero`), se preservan **verbatim** — sin reformatear, sin traducir, sin resumir — en una
sección `## Escenarios de origen` al principio de `requirements.md`, antes del primer
`R<n>`:

````markdown
## Escenarios de origen

> Preservados tal cual los entregó el equipo. No se reformatean ni se traducen — son la
> fuente; los R<n> de abajo son su formalización EARS.

```gherkin
Característica: Inicio de sesión de usuarios

  Escenario: Inicio de sesión exitoso con credenciales válidas
    Dado que el usuario está en la página de inicio de sesión
    Cuando el usuario ingresa su correo electrónico válido
    Y el usuario ingresa su contraseña correcta
    Y hace clic en el botón "Iniciar Sesión"
    Entonces el sistema debe redirigirlo a la página de inicio
    Y debe mostrar un mensaje de bienvenida "Hola, Usuario"
```
````

Cada escenario se desglosa después en uno o más `R<n>` EARS — el Gherkin nunca sustituye
al EARS, porque el `reviewer` solo verifica trazabilidad contra `R<n>`, no contra
escenarios. La correspondencia N:M (un escenario puede cubrir varios `R<n>`, un `R<n>`
puede derivar de varios escenarios) se documenta en la tabla de trazabilidad al final del
archivo — ver § Trazabilidad más abajo.

**Colisión léxica a vigilar:** el patrón EARS "Evento" ya usa `CUANDO` y el patrón "No
deseado" ya usa `SI...ENTONCES` — un escenario Gherkin en español reutiliza esas mismas
palabras (`Cuando`, `Entonces`) con un significado distinto: EARS declara una regla
universal ("CUANDO pasa X, el sistema SIEMPRE DEBE Y"), Gherkin narra un ejemplo concreto
("Dado este estado, cuando ocurre esto, entonces pasa aquello"). Por eso el Gherkin va
siempre dentro de su propio bloque fenced ` ```gherkin `, nunca mezclado en la misma frase
que un `R<n>` — la separación visual es la que evita la ambigüedad al leer.

**Alcance:** esta sección es opcional y solo aparece cuando el Gherkin ya existía como
entrada. El `spec_author` **nunca inventa** un escenario que el humano no entregó — si no
hay Gherkin de origen, `requirements.md` se ve exactamente como antes de esta convención,
solo con los `R<n>` EARS.

## design.md — decisiones técnicas

Captura **antes** de tocar código:

- Qué archivos se crean / modifican.
- Qué firmas nuevas aparecen (métodos, DTOs, endpoints).
- Qué excepciones se reutilizan o se añaden (siempre `CustomError`, ver
  `docs/conventions.md`).
- Qué alternativa se descartó y por qué (mínimo una).
- **Capas afectadas y dirección de dependencias** (obligatorio): una tabla
  o lista corta con qué se toca en `domain/`, `infrastructure/` y
  `presentation/`, y confirmación explícita de que ningún import nuevo
  viola la Regla de Dependencia (`docs/architecture.md`). Si la feature
  necesita algo externo desde un use-case, aquí se declara el puerto
  (interface/function type en `domain/`) y quién lo implementa.
- **Si la feature es `"api": true`**: referencia cada endpoint por su `operationId`
  exacto de `docs/api/openapi.yaml` (el contrato, ya aprobado en la puerta previa) —
  nunca redescribas método/ruta/schemas en prosa. Ver `docs/api-design.md`.

NO es ingeniería desde primeros principios — apóyate en
`docs/architecture.md` y `docs/conventions.md`. El `design.md` documenta los
puntos donde tu feature roza la frontera de esas reglas.

## tasks.md — checklist ejecutable

Pasos discretos en orden, cada uno con checkbox. Cada task referencia al
menos un `R<n>` que cubre.

Ejemplo:

```markdown
- [ ] T1 — Añadir `HealthQueryDto` en `domain/dtos/health/`, con la tupla
      `[error?, dto?]` y sin lanzar. Cubre: R2.
- [ ] T2 — Añadir el caso de uso `GetHealth` en `domain/use-cases/health/`,
      inyectando `HealthRepository` y `Clock` como parámetros requeridos.
      Cubre: R1.
- [ ] T3 — Implementar `HealthRepositoryImpl` en
      `infrastructure/repositories/`, único archivo que lee `config/`.
      Cubre: R1.
- [ ] T4 — Añadir `GET /api/health` en `presentation/health/` y montarlo en
      `AppRoutes`. Cubre: R1, R2.
- [ ] T5 — Test `GetHealth composes the entity from the repository snapshot`
      en `get-health.use-case.test.ts`. Cubre: R1.
- [ ] T6 — Test `HealthQueryDto.create rejects a non-boolean value without
      throwing` en `health-query.dto.test.ts`. Cubre: R2.
```

El `implementer` marca `[x]` cada task al completarla. El `reviewer`
rechaza si queda alguna `[ ]` sin justificación documentada.

`tasks.md` sigue citando solo `R<n>` por id — nunca copia el Gherkin de origen ni lo
repite en prosa. Cuando un `R<n>` deriva de un escenario Gherkin (§ Escenarios de
origen), la única convención extra es que el nombre del test que lo cubre debería
espejar el título del escenario, para que la cadena completa se pueda seguir de un
vistazo sin saltar entre archivos:

```
Escenario "Inicio de sesión exitoso con credenciales válidas" (Gherkin, requirements.md)
  → R1, R2 (EARS, requirements.md)
    → T5 "Test ... Cubre: R1, R2" (tasks.md)
      → test "logs the user in and shows the welcome message on valid credentials"
```

Como una spec tiene exactamente una Historia de usuario (§ arriba), el vínculo hacia
ella es estructural — todas las `T<n>` de ese `tasks.md` la resuelven por construcción,
sin necesidad de etiquetar cada task con su id. Basta una línea de cabecera al principio
del archivo:

```markdown
# Tasks — login

> Todas las tasks de este archivo resuelven la Historia de usuario de
> `requirements.md` (`PROJ-123`, si aplica).

- [ ] T1 — ...
```

## Trazabilidad (regla dura)

- Cada test relevante a la feature debe poder mapearse a un `R<n>` de su
  spec.
- Cada `R<n>` debe tener al menos un test concreto (o, si exige I/O real,
  una verificación manual documentada — ver `docs/verification.md`
  Nivel 4).
- El `reviewer` comprueba esta correspondencia explícitamente y rechaza
  si falta.

`requirements.md` cierra con una tabla de trazabilidad hacia atrás, hacia el origen de
cada `R<n>`. Dos variantes, según de dónde salió el spec:

```markdown
## Trazabilidad con `acceptance` del feature_list.json
| Acceptance criterion | Cubierto por |
|---|---|
| GET /api/health responde 200 con { status, appName } | R1 |
```

o, cuando `requirements.md` tiene una sección `## Escenarios de origen`:

```markdown
## Trazabilidad con escenarios Gherkin
| Escenario | Cubierto por |
|---|---|
| Inicio de sesión exitoso con credenciales válidas | R1, R2 |
| Inicio de sesión fallido con contraseña incorrecta | R3 |
```

La relación es N:M en ambos casos — un acceptance o escenario puede cubrir varios `R<n>`,
y viceversa. Un `R<n>` sin acceptance/escenario de origen es aceptable si es una
salvaguarda trivialmente verificable (documéntalo en prosa junto a la tabla); un
acceptance o escenario sin ningún `R<n>` que lo cubra no lo es — significa que el spec
quedó incompleto.

El `implementer` documenta el mapa hacia el código en `progress/impl_<name>.md`:

```markdown
## Trazabilidad
- R1 → `test "GetHealth composes the entity from the repository snapshot"`
- R2 → `test "HealthQueryDto.create rejects a non-boolean value without throwing"`
```

## Cuándo NO aplica SDD

Las features con `"sdd": false` o sin el campo `sdd` NO tienen spec. Por
defecto, SDD se aplica a toda feature nueva; marca `"sdd": false` solo para
cosas que no son features de producto (un spike, un ajuste de tooling, la
feature semilla del template).
