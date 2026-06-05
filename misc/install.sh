#!/usr/bin/env bash
# MallCord installer / uninstaller
# Usage: bash install.sh
set -euo pipefail

REPO_URL="https://github.com/MallCord/MallCord"
INSTALL_DIR="$HOME/MallCord"

RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'
CYAN='\033[0;36m'; BOLD='\033[1m'; NC='\033[0m'

step() { echo -e "${CYAN}  =>${NC} $*"; }
ok()   { echo -e "${GREEN}  OK${NC} $*"; }
warn() { echo -e "${YELLOW}  !${NC}  $*"; }
die()  { echo -e "\n${RED}  ERROR:${NC} $*\n" >&2; exit 1; }
ask()  { echo -e -n "${YELLOW}  ?${NC}  $*"; }

echo -e "${BOLD}${CYAN}"
echo "   __  ___      ____  ____  ____              __ "
echo "  /  |/  /___ _/ / / / __ \/ __ \____  _____/ / "
echo " / /|_/ / __  / / / / / / / / / / __ \/ ___/ /  "
echo "/ /  / / /_/ / / / / /_/ / /_/ / / / / /  / /   "
echo "/_/  /_/\__,_/_/_/  \____/\____/_/ /_/_/  \__/   "
echo -e "${NC}"

[[ "$(id -u)" -ne 0 ]] || die "Do not run this script as root."

# ── Mode selection ────────────────────────────────────────────────────────────
echo -e "  What would you like to do?"
echo -e "  ${CYAN}[1]${NC} Install / Update MallCord"
echo -e "  ${CYAN}[2]${NC} Uninstall MallCord"
echo
ask "Choose an option [1/2]: "
read -r MODE_CHOICE
echo

if [[ "$MODE_CHOICE" == "2" ]]; then
    # ══════════════════════════════════════════════════════════
    #  UNINSTALL
    # ══════════════════════════════════════════════════════════
    [[ -d "$INSTALL_DIR/.git" ]] || die "MallCord not found at $INSTALL_DIR. Nothing to uninstall."

    step "Found MallCord at $INSTALL_DIR."
    echo

    step "Removing MallCord from Discord..."
    node "$INSTALL_DIR/scripts/runInstaller.mjs" -- --uninstall \
        || warn "Uninject step reported an error. Discord may already be uninjected."
    ok "MallCord removed from Discord."

    echo
    ask "Also delete the MallCord folder at $INSTALL_DIR? [y/N] "
    read -r DEL_CHOICE
    echo
    if [[ "$DEL_CHOICE" =~ ^[Yy]$ ]]; then
        step "Deleting $INSTALL_DIR..."
        rm -rf "$INSTALL_DIR"
        ok "Folder deleted."
    else
        ok "Kept folder — run this script again to reinstall."
    fi

    echo
    echo -e "${GREEN}${BOLD}  ============================================"
    echo "    MallCord uninstalled. Restart Discord."
    echo -e "  ============================================${NC}"
    echo
    exit 0
fi

# ══════════════════════════════════════════════════════════
#  INSTALL
# ══════════════════════════════════════════════════════════

step "Checking dependencies..."

command -v git >/dev/null 2>&1 \
    || die "git not found.\n  Install it first: https://git-scm.com/downloads"
ok "git $(git --version | awk '{print $3}')"

command -v node >/dev/null 2>&1 \
    || die "Node.js not found.\n  Install LTS from https://nodejs.org"

NODE_MAJOR=$(node -e "console.log(parseInt(process.version.slice(1)))")
[[ "$NODE_MAJOR" -ge 18 ]] \
    || die "Node.js v18+ required. You have $(node --version).\n  Update at https://nodejs.org"
ok "Node.js $(node --version)"

if ! command -v pnpm >/dev/null 2>&1; then
    warn "pnpm not found. Installing globally via npm..."
    npm install -g pnpm \
        || die "Failed to install pnpm.\n  Try: sudo npm install -g pnpm"
    NPM_BIN="$(npm config get prefix)/bin"
    export PATH="$NPM_BIN:$PATH"
    command -v pnpm >/dev/null 2>&1 \
        || die "pnpm installed but not in PATH.\n  Restart your terminal and re-run."
fi
ok "pnpm $(pnpm --version)"

echo ""
if [[ -d "$INSTALL_DIR/.git" ]]; then
    warn "MallCord already found at $INSTALL_DIR."
    ask "Update to the latest version? [y/N] "
    read -r answer
    if [[ "$answer" =~ ^[Yy]$ ]]; then
        step "Pulling latest changes..."
        git -C "$INSTALL_DIR" pull --ff-only \
            || die "git pull failed.\n  Try deleting $INSTALL_DIR and re-running."
        ok "Repository updated."
    else
        step "Skipping update — using existing checkout."
    fi
elif [[ -e "$INSTALL_DIR" ]]; then
    die "$INSTALL_DIR exists but is not a git repo.\n  Remove it and re-run."
else
    step "Cloning MallCord into $INSTALL_DIR..."
    git clone "$REPO_URL" "$INSTALL_DIR" \
        || die "Clone failed. Check your internet connection."
    ok "Cloned."
fi

cd "$INSTALL_DIR"

echo ""
step "Installing dependencies (this may take a minute)..."
pnpm install --frozen-lockfile \
    || die "pnpm install failed. See output above."
ok "Dependencies installed."

echo ""
step "Building MallCord..."
pnpm build \
    || die "Build failed. See output above."
ok "Build complete."

echo ""
step "Injecting into Discord..."
node "$INSTALL_DIR/scripts/runInstaller.mjs" -- --install \
    || die "Injection failed.\n  Make sure Discord is installed and you are not running as root."

echo ""
echo -e "${GREEN}${BOLD}  MallCord installed! Start Discord to load it.${NC}"
echo ""
