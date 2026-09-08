# Modo de comunicación — caveman

> **Fuente única.** El footer de stats y las reglas de caveman viven **solo aquí**.
> `.claude/agents/leader.md` y `.claude/agents/ideator.md` apuntan a este archivo en vez
> de repetirlo. Antes el footer estaba copiado en tres sitios y había que editarlo en
> los tres a la vez.

## A quién aplica

De los 5 subagentes, solo `leader` e `ideator` dialogan extensamente con el humano, así
que solo ellos usan el skill [`caveman`](../skills/caveman/SKILL.md) en nivel `full`, para
reducir ~75% el consumo de tokens. `spec_author`, `implementer` y `reviewer` escriben en
disco y devuelven una sola línea de referencia, así que caveman no les aplica.

Una sesión normal de Claude Code editando código directamente (sin subagente) **no** está
obligada a hablar en caveman.

## Cómo está cableado

`.claude/settings.json` declara `skillOverrides: { "caveman": "user-invocable-only" }`,
que corta el auto-disparo del skill en cualquier sesión; y `leader.md` / `ideator.md`
lo declaran en su frontmatter (`skills: [caveman]`), que es lo que se lo concede a esos
dos. El humano puede invocarlo a mano en cualquier momento con `/caveman`.

> Nota histórica: hasta ahora esto se declaraba con una clave `skills.alwaysActive` en
> `settings.json` que **no existe** en Claude Code, así que se ignoraba en silencio y
> caveman nunca estuvo realmente activo — solo descrito en prosa.

## Reglas

- Sin artículos, sin relleno, sin hedging; fragmentos están bien, sinónimos cortos están bien.
- **Excepciones obligatorias** (caveman se pausa y luego se reactiva): avisos de seguridad
  o confirmaciones de acciones irreversibles; el contenido de archivos del repo
  (`specs/`, `docs/`, `progress/`, código, commits, PRs) — se escribe en prosa normal;
  mensajes de error citados textualmente.
- Cambio de nivel solo si el humano lo pide: `/caveman lite|full|ultra`. Apagado solo con
  `"stop caveman"` / `"normal mode"`.

## Footer de stats

Cada mensaje al humano termina con:

```
---
💬 caveman full · esta resp: ~N chars · sin caveman est: ~4N chars · ahorro est: ~75%
```

`N` = cuenta de caracteres del cuerpo del mensaje (excluyendo el footer mismo).
`sin caveman est` = `N × 4`. Ajusta el multiplicador y el porcentaje si cambia el nivel
(`lite` ≈ 40%, `ultra` ≈ 80%).

Sin footer en mensajes que sean solo código o contenido de archivos, ni en confirmaciones
pausadas de acciones destructivas.

## Otros skills de ahorro de tokens

No hay ninguno más instalado. Si se añade uno, se declara aquí junto con su precedencia
respecto a caveman.
