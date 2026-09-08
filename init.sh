#!/usr/bin/env bash
# init.sh — Verificación e inicialización del entorno.
#
# Lo ejecuta el agente al COMENZAR una sesión y antes de declarar cualquier
# tarea como `done`. Si falla, la sesión no debe avanzar.
#
# Todo lo específico del proyecto (gestor de paquetes, comandos, nombres de
# capa, paquetes vetados, archivos obligatorios) sale de harness.config.json.
# Este archivo es un orquestador: los cuerpos de cada comprobación viven en
# scripts/, para que puedan invocarse por separado (el reviewer corre el guard
# de la Regla de Dependencia sin correr la suite entera, por ejemplo).
#
# Sobre `set -e`: NO se usa a propósito. El diseño es acumular EXIT_CODE y
# seguir, para que una sola pasada muestre TODOS los problemas. Abortar en el
# primero ocultaría el resto, que es justo cómo la bifurcación anterior de este
# arnés estuvo rota meses sin que nadie lo notara.

set -uo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR" || exit 1
. "$SCRIPT_DIR/scripts/lib/config.sh"

EXIT_CODE=0

# ── 0. Contexto ─────────────────────────────────────────────────────────────
# Imprimir el proyecto y los comandos resueltos hace que un proyecto mal
# scaffoldeado se note en la primera línea, en vez de en el primer fallo raro.
if [ ! -f "$HARNESS_CONFIG" ]; then
  printf "\033[0;31m[FAIL]\033[0m  Falta %s — este repositorio no está inicializado como arnés SDD\n" "$HARNESS_CONFIG"
  exit 1
fi

if ! command -v node >/dev/null 2>&1; then
  printf "\033[0;31m[FAIL]\033[0m  node no está instalado (todo el arnés depende de él para leer la configuración)\n"
  exit 1
fi

PROJECT_NAME="$(harness_cfg project.name)"       || exit 1
MIN_NODE="$(harness_cfg stack.minRuntimeMajor)"  || exit 1
PKG_MANAGER="$(harness_cfg stack.packageManager)" || exit 1
DEPS_DIR="$(harness_cfg stack.depsDir node_modules)"
CMD_INSTALL="$(harness_cfg commands.install)"    || exit 1
CMD_TYPECHECK="$(harness_cfg commands.typecheck)" || exit 1
CMD_TEST="$(harness_cfg commands.test)"          || exit 1

echo "── 0. Contexto ────────────────────────────────────────"
ok "Proyecto: $PROJECT_NAME"
ok "Config:   $HARNESS_CONFIG"
ok "Comandos: typecheck='$CMD_TYPECHECK' · test='$CMD_TEST'"

# ── 1. Entorno ──────────────────────────────────────────────────────────────
echo ""
echo "── 1. Verificando entorno ─────────────────────────────"

ok "node -> $(node --version)"

NODE_MAJOR="$(node -p 'process.versions.node.split(".")[0]')"
if [ "$NODE_MAJOR" -lt "$MIN_NODE" ]; then
  fail "Se requiere Node.js >= $MIN_NODE (encontrado $NODE_MAJOR)"
  exit 1
fi
ok "Versión de Node compatible (>= $MIN_NODE)"

# Salida dura: sin gestor de paquetes, las secciones 5 y 6 fallarían después
# con errores confusos en vez de con este mensaje.
if ! command -v "$PKG_MANAGER" >/dev/null 2>&1; then
  fail "$PKG_MANAGER no está instalado (este proyecto usa $PKG_MANAGER — ver stack.packageManager)"
  exit 1
fi
ok "$PKG_MANAGER -> $($PKG_MANAGER --version)"

if [ ! -d "$DEPS_DIR" ]; then
  fail "Falta $DEPS_DIR/. Ejecuta: $CMD_INSTALL"
  exit 1
fi
ok "$DEPS_DIR/ presente"

# ── 2. Archivos base ────────────────────────────────────────────────────────
echo ""
echo "── 2. Verificando archivos base del arnés ──────────────"
if ! node scripts/check-base-files.mjs; then EXIT_CODE=1; fi

# ── 2b. Skills vendorizados (informativo) ───────────────────────────────────
echo ""
echo "── 2b. Skills vendorizados (informativo) ───────────────"
node scripts/check-skills-lock.mjs

# ── 3. feature_list.json y specs ────────────────────────────────────────────
echo ""
echo "── 3. Validando feature_list.json y specs ─────────────"
if ! node scripts/check-feature-list.mjs; then EXIT_CODE=1; fi

# ── 4. Regla de dependencia ─────────────────────────────────────────────────
echo ""
echo "── 4. Regla de dependencia ─────────────────────────────"
if ! ./scripts/check-dependency-rule.sh; then EXIT_CODE=1; fi

# ── 5. Typecheck ────────────────────────────────────────────────────────────
echo ""
echo "── 5. Typecheck ────────────────────────────────────────"
if eval "$CMD_TYPECHECK" 2>&1; then
  ok "Typecheck limpio"
else
  fail "Errores de TypeScript"
  EXIT_CODE=1
fi

# ── 6. Tests ────────────────────────────────────────────────────────────────
echo ""
echo "── 6. Ejecutando tests ─────────────────────────────────"
TEST_OUT="$( { eval "$CMD_TEST"; } 2>&1 )"
TEST_RC=$?
printf '%s\n' "$TEST_OUT"

if [ $TEST_RC -ne 0 ]; then
  fail "Hay tests rotos"
  EXIT_CODE=1
elif printf '%s' "$TEST_OUT" | grep -qE '^# tests 0$'; then
  # Una corrida verde con cero tests tiene que ser roja. El arnés anterior
  # hacía glob de 'tests/*.js', no encontraba nada, salía 0, y reportó verde
  # una bifurcación entera sin haber ejecutado jamás la suite real.
  fail "El runner no encontró NINGÚN test (glob vacío) — revisa commands.test en $HARNESS_CONFIG"
  EXIT_CODE=1
else
  ok "Todos los tests pasan"
fi

# ── 7. Resumen ──────────────────────────────────────────────────────────────
echo ""
echo "── 7. Resumen ──────────────────────────────────────────"
if [ $EXIT_CODE -eq 0 ]; then
  ok "Entorno listo. Puedes empezar a trabajar."
else
  fail "Entorno NO está listo. Resuelve los errores antes de avanzar."
fi

exit $EXIT_CODE
