# Fase de Ideación (pre-SDD)

> Antes de escribir specs o código, valida la idea. Esta fase convierte
> una intuición en una feature concreta con acceptance criteria.

## Flujo completo con ideación

```
idea → [ideator] → ⏸ HUMANO APRUEBA DISEÑO → feature_list.json (pending)
    → (si "api": true) [api_designer] → contract_ready → ⏸ HUMANO
    → [spec_author] → spec_ready → ⏸ HUMANO → in_progress
    → [implementer → reviewer] → done
```

La fase de ideación es **opcional**. Si ya tienes una idea clara con
acceptance criteria definidos, puedes saltar directo a `/add-feature`.

## Cuándo usar `/brainstorm`

| Situación | Comando |
|-----------|---------|
| Idea vaga, quieres explorar opciones | `/brainstorm` |
| Idea clara con criterios definidos | `/add-feature` |
| Feature ya en `feature_list.json` como `pending` | `/implement-next` |

## Qué produce el ideator

1. **Documento de diseño** en `docs/ideas/YYYY-MM-DD-<topic>-design.md`:
   - Contexto del proyecto
   - Alternativas consideradas con trade-offs
   - Diseño elegido (arquitectura, componentes, flujo de datos, errores) —
     **declarando en qué capa vive cada pieza nueva** (ver `layers` en
     `harness.config.json`) y, si toca algo externo desde un use-case, qué
     puerto de la capa interna lo abstrae. Ver `docs/architecture.md`. No se
     propone nada que exija romper la Regla de Dependencia (p. ej. un
     use-case importando directamente una librería vetada).
   - Acceptance criteria propuestos — si la feature expone HTTP, incluye la forma
     esperada de la superficie (recursos, métodos, códigos de estado relevantes) para que
     el `api_designer` no parta de cero en la fase de contrato. No es el contrato en sí
     (eso lo formaliza `/design-api`), solo la intención.

2. **Entrada en `feature_list.json`** con `status: "pending"`, `sdd: true` y `api: true`
   si la feature expone o cambia algo por HTTP.

## Convenciones para `docs/ideas/`

- **Naming**: `YYYY-MM-DD-<topic>-design.md` donde `<topic>` es `snake_case`.
- **Contenido mínimo**: contexto, alternativas, diseño, acceptance criteria.
- **Inmutabilidad**: una vez aprobado y creada la feature, el documento no
  se modifica. Si la idea evoluciona durante el spec, se documenta en
  `specs/<name>/design.md`.

## Puertas de aprobación

La fase de ideación tiene **dos** puertas humanas:

1. **Aprobación del diseño**: el ideator presenta el diseño y espera.
   No escribe el documento ni inserta la feature sin esta aprobación.
2. **Aprobación del documento escrito**: el ideator escribe el doc y
   pide al humano que lo revise antes de insertar la feature.

## Relación con otros agentes

| Agente | Relación con ideator |
|--------|---------------------|
| `leader` | No invoca al ideator. El ideator es human-triggered vía `/brainstorm`. |
| `api_designer` | Si la feature es `"api": true`, toma la intención de superficie HTTP del documento de ideación como punto de partida para el contrato. |
| `spec_author` | Toma la feature `pending`/`contract_ready` creada por el ideator y la refina en EARS. |
| `implementer` | Sin relación directa. Trabaja sobre el spec, no sobre el diseño de idea. |
| `reviewer` | Sin relación directa. |
