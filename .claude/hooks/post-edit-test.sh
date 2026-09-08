#!/usr/bin/env bash
# Hook PostToolUse: corre la suite SOLO si se editó código fuente.
#
# Por qué existe este wrapper en vez de poner el comando directo en
# settings.json: el `matcher` de un hook filtra por NOMBRE DE HERRAMIENTA
# (Edit|Write|MultiEdit), no por ruta de archivo. Sin este filtro, editar un
# .md de docs disparaba la suite entera.
#
# No reinvoca a Claude, así que no hay riesgo de bucle. No añadas nada que lo
# haga.
#
# Kill switch: borra el bloque PostToolUse de .claude/settings.json. La puerta
# real del arnés es ./init.sh, no este hook.

set -uo pipefail
cd "${CLAUDE_PROJECT_DIR:-$PWD}" || exit 0

[ -f harness.config.json ] || exit 0

# El payload del hook llega por stdin como JSON.
FILE="$(node -e '
  let s = "";
  process.stdin.on("data", (d) => (s += d)).on("end", () => {
    try { process.stdout.write(JSON.parse(s)?.tool_input?.file_path ?? ""); } catch {}
  });
' 2>/dev/null)" || exit 0

[ -n "$FILE" ] || exit 0

SRC_ROOT="$(node scripts/lib/config-read.mjs harness.config.json layers.sourceRoot src 2>/dev/null)"

# Solo código fuente, y solo dentro de la raíz de código.
case "$FILE" in
  *.d.ts)                 exit 0 ;;
  *.ts|*.tsx|*.mts|*.cts) ;;
  *)                      exit 0 ;;
esac
case "$FILE" in
  */"$SRC_ROOT"/*|"$SRC_ROOT"/*) ;;
  *)                             exit 0 ;;
esac

CMD_TEST="$(node scripts/lib/config-read.mjs harness.config.json commands.test 2>/dev/null)"
[ -n "$CMD_TEST" ] || exit 0

eval "$CMD_TEST" 2>&1 | tail -5
exit 0
