#!/usr/bin/env bash
# Guard de la Regla de Dependencia — checkpoint C2 de CHECKPOINTS.md.
#
# La capa interna (layers.inner) no puede importar nada de las capas externas
# (layers.outer) ni de los paquetes de terceros vetados (layers.bannedInInner),
# ni directa ni transitivamente. Eso es lo que permite testear el dominio sin
# base de datos, sin .env y sin servidor HTTP.
#
# Este script es el ÚNICO lugar del repositorio que implementa esta comprobación.
# Lo invocan init.sh §4, CHECKPOINTS.md C2, docs/verification.md Nivel 2 y
# .claude/agents/reviewer.md. Si necesitas cambiar qué está prohibido, edita
# layers.outer / layers.bannedInInner en harness.config.json, no este archivo.
#
# Uso:  ./scripts/check-dependency-rule.sh [--print-pattern]
# Sale: 0 sin hallazgos · 1 con hallazgos o si falta la capa interna

set -uo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR/.." || exit 1
. "$SCRIPT_DIR/lib/config.sh"

SRC="$(harness_cfg layers.sourceRoot)"          || exit 2
INNER="$(harness_cfg layers.inner)"             || exit 2
EXT="$(harness_cfg stack.sourceExtensions | head -1)"
REQUIRED="$(harness_cfg layers.innerLayerRequired true)"
INNER_DIR="$SRC/$INNER"

PATTERN="$(node "$SCRIPT_DIR/lib/dep-rule-pattern.mjs")" || exit 2

if [ "${1-}" = "--print-pattern" ]; then
  printf '%s\n' "$PATTERN"
  exit 0
fi

if [ ! -d "$INNER_DIR" ]; then
  if [ "$REQUIRED" = "true" ]; then
    # FAIL, no WARN: en un esqueleto Clean Architecture, que falte la capa
    # interna significa que el esqueleto está roto. Un warn aquí es cómo se
    # entrega un template cuyo invariante central nunca se verifica.
    fail "$INNER_DIR/ no existe — la capa interna es obligatoria (layers.innerLayerRequired)"
    exit 1
  fi
  warn "$INNER_DIR/ no existe todavía"
  exit 0
fi

# El `|| true` es obligatorio bajo `pipefail`: `grep A | grep -v B` sale 1
# cuando NO hay coincidencias, que aquí es justamente el caso de éxito.
LEAKS="$(grep -rnE "$PATTERN" "$INNER_DIR" --include="*.$EXT" 2>/dev/null \
         | grep -v "\.test\.$EXT:" || true)"

if [ -n "$LEAKS" ]; then
  fail "$INNER_DIR/ importa algo de una capa externa (rompe la Regla de Dependencia):"
  printf '%s\n' "$LEAKS"
  printf '\nVer el detalle de lo prohibido con: node scripts/lib/dep-rule-pattern.mjs --explain\n'
  exit 1
fi

ok "$INNER_DIR/ no importa capas externas ni librerías vetadas"
exit 0
