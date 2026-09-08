#!/usr/bin/env bash
# Utilidades compartidas por init.sh y los scripts de check.
# Se carga con `. scripts/lib/config.sh` desde la raíz del repositorio.

HARNESS_CONFIG="${HARNESS_CONFIG:-harness.config.json}"
HARNESS_LIB_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
NC='\033[0m'

ok()   { printf "${GREEN}[OK]${NC}    %s\n" "$1"; }
warn() { printf "${YELLOW}[WARN]${NC}  %s\n" "$1"; }
fail() { printf "${RED}[FAIL]${NC}  %s\n" "$1"; }

# harness_cfg <ruta.con.puntos> [default]
# Lee un escalar de harness.config.json. Solo cuatro valores del arnés llegan a
# bash por esta vía; todo lo que tiene forma de lista se consume dentro de los
# scripts node, que hacen su propio JSON.parse.
harness_cfg() {
  node "$HARNESS_LIB_DIR/config-read.mjs" "$HARNESS_CONFIG" "$1" ${2+"$2"}
}
