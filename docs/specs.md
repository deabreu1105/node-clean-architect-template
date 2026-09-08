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

| Estado         | Significado                                                    |
|----------------|----------------------------------------------------------------|
| `pending`      | Sin spec. El `spec_author` es el primero en actuar.            |
| `spec_ready`   | Spec drafted. Esperando aprobación humana. NO se toca código.  |
| `in_progress`  | Spec aprobado. `implementer` trabajando.                       |
| `done`         | Código verde, `reviewer` aprobó, sesión cerrada.               |
| `blocked`      | Atascado. Razón en `progress/current.md`.                      |

## La puerta de aprobación humana

El flujo automático se detiene **una vez**: cuando el `spec_author` termina
sus tres archivos, marca la feature como `spec_ready` y para. El humano
lee `specs/<feature>/` y dice "aprobado" (o pide cambios).

Solo entonces el `leader` transiciona `spec_ready → in_progress` y lanza
el `implementer`.

```
pending → [spec_author] → spec_ready → ⏸ HUMANO → in_progress → [implementer → reviewer] → done
```

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

## Trazabilidad (regla dura)

- Cada test relevante a la feature debe poder mapearse a un `R<n>` de su
  spec.
- Cada `R<n>` debe tener al menos un test concreto (o, si exige I/O real,
  una verificación manual documentada — ver `docs/verification.md`
  Nivel 4).
- El `reviewer` comprueba esta correspondencia explícitamente y rechaza
  si falta.

El `implementer` documenta el mapa en `progress/impl_<name>.md`:

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
