#!/usr/bin/env bash
# MallCord uninstaller — removes MallCord from Discord and optionally deletes the repo.
# Usage: bash uninstall.sh
set -euo pipefail

INSTALL_DIR="$HOME/MallCord"

RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'
CYAN='\033[0;36m'; BOLD='\033[1m'; NC='\033[0m'

step() { echo -e "${CYAN}  =>${NC} $*"; }
ok()   { echo -e "${GREEN}  OK${NC} $*"; }
warn() { echo -e "${YELLOW}  !${NC}  $*"; }
die()  { echo -e "\n${RED}  ERROR:${NC} $*\n" >&2; exit 1; }
ask()  { echo -e -n "${YELLOW}  ?${NC}  $*"; }

echo -e "${BOLD}${RED}"
echo "   __  ___      ____  ____  ____              __ "
echo "  /  |/  /___ _/ / / / __ \/ __ \____  _____/ / "
echo " / /|_/ / __  / / / / / / / / / / __ \/ ___/ /  "
echo "/ /  / / /_/ / / / / /_/ / /_/ / / / / /  / /   "
echo "/_/  /_/\__,_/_/_/  \____/\____/_/ /_/_/  \__/   "
echo -e "  Uninstaller${NC}"
echo

[[ "$(id -u)" -ne 0 ]] || die "Do not run this script as root."

# ── Check repo exists ─────────────────────────────────────────────────────────
if [[ ! -d "$INSTALL_DIR/.git" ]]; then
    die "MallCord not found at $INSTALL_DIR. Nothing to uninstall."
fi

step "Found MallCord at $INSTALL_DIR."
echo

# ── Uninject ──────────────────────────────────────────────────────────────────
step "Removing MallCord from Discord..."
node "$INSTALL_DIR/scripts/runInstaller.mjs" -- --uninstall || warn "Uninject step reported an error. Discord may already be uninjected."
ok "MallCord removed from Discord."

# ── Optionally delete the repo ────────────────────────────────────────────────
echo
ask "Also delete the MallCord folder at $INSTALL_DIR? [y/N] "
read -r DEL_CHOICE
echo
if [[ "$DEL_CHOICE" =~ ^[Yy]$ ]]; then
    step "Deleting $INSTALL_DIR..."
    rm -rf "$INSTALL_DIR"
    ok "Folder deleted."
else
    ok "Kept folder — you can reinstall later by running install.sh."
fi

echo
echo -e "${GREEN}${BOLD}  ============================================"
echo "    MallCord uninstalled. Restart Discord."
echo -e "  ============================================${NC}"
echo
