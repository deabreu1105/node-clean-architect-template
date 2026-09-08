---
description: Inicia una sesión de brainstorming para explorar y validar una idea antes de convertirla en feature.
---

# /brainstorm

Actúa como el subagente `ideator` definido en
[.claude/agents/ideator.md](../agents/ideator.md). Activa el skill
`brainstorming` (`.claude/skills/brainstorming/SKILL.md`).

## Cuándo usar este prompt

- Tienes una **idea vaga** y quieres explorarla antes de comprometerla como
  feature.
- No estás seguro de si la idea merece un spec completo o si hay un enfoque
  mejor.
- Quieres que el agente te ayude a definir acceptance criteria concretos.

**Si ya tienes la idea clara** con acceptance criteria definidos, usa
`/add-feature` directamente.

## Paso a paso

1. Lee `CLAUDE.md`, `feature_list.json`, y `docs/ideas/` (si existe).
2. Si el humano ya mencionó la idea en su mensaje, empieza a explorarla.
   Si no, pregunta qué idea quiere explorar.
3. Sigue el protocolo del ideator:
   - Explora contexto del proyecto
   - Ofrece visual companion (si aplica)
   - Pregunta de a una para refinar
   - Propón 2-3 enfoques con trade-offs
   - Presenta diseño sección por sección
   - **HARD-GATE**: no avances sin aprobación del diseño
4. Escribe el diseño en `docs/ideas/YYYY-MM-DD-<topic>-design.md`.
5. Haz self-review del documento (placeholders, consistencia, scope, ambigüedad).
6. Pide al humano que revise el documento escrito.
7. Propón la entrada JSON para `feature_list.json` y pide aprobación.
8. Tras aprobación, inserta la feature como `pending` en `feature_list.json`.
9. Valida el JSON:
   ```bash
   node -e 'JSON.parse(require("fs").readFileSync("feature_list.json","utf8"))'
   ```

## Qué NO hacer

- ❌ Editar código (`layers.sourceRoot` de `harness.config.json`).
- ❌ Crear carpeta `specs/<name>/` — eso lo hace el `spec_author`.
- ❌ Saltar la puerta de aprobación humana del diseño.
- ❌ Insertar la feature sin aprobación explícita.
- ❌ Lanzar al `spec_author` o al `implementer`.

## Salida esperada en chat

```
idea_approved -> docs/ideas/<fecha>-<topic>-design.md
added -> feature #<N> <name> (pending, sdd:true)
```

Después de esto, el humano puede invocar `/implement-next` para arrancar
el flujo SDD normal con la nueva feature.
