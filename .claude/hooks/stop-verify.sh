#!/usr/bin/env bash
# Hook Stop: verificación completa del arnés antes de cerrar la sesión.
#
# IMPORTANTE: el evento `Stop` NO es bloqueante. Su exit code no detiene nada y
# su stdout solo se loguea. Esto es una ALARMA, no una puerta. La puerta real
# es /close-session y el checkpoint C1 que recorre el reviewer.
#
# No reinvoca a Claude, así que no hay riesgo de bucle.

set -uo pipefail
cd "${CLAUDE_PROJECT_DIR:-$PWD}" || exit 0

[ -f ./init.sh ] || exit 0

# Log por proyecto y junto al código, no /tmp/harness_init.log: esa ruta fija
# colisiona entre proyectos concurrentes. .harness/ está gitignoreado.
LOG_DIR="$(node scripts/lib/config-read.mjs harness.config.json harness.logDir .harness 2>/dev/null || echo .harness)"
mkdir -p "$LOG_DIR"
LOG="$LOG_DIR/init.log"

if ./init.sh > "$LOG" 2>&1; then
  echo "[harness] init.sh OK"
else
  echo "[harness] init.sh FALLÓ — revisa $LOG antes de cerrar"
  grep -E '\[FAIL\]' "$LOG" | tail -20
fi
exit 0
