@echo off
setlocal enabledelayedexpansion

:: MallCord installer — clones, builds, and injects from source.
:: Run as a normal user (NOT as Administrator).

set REPO_URL=https://github.com/MallCord/MallCord
set INSTALL_DIR=%USERPROFILE%\MallCord

echo.
echo   +---------------------------------+
echo   ^|       MallCord Installer        ^|
echo   +---------------------------------+
echo.

:: ── Warn if running as administrator ─────────────────────────────────────────
net session >nul 2>&1
if !errorlevel! equ 0 (
    echo   WARNING: You are running as Administrator.
    echo            This can break Discord. Run as a normal user instead.
    echo.
    choice /C YN /M "   Continue anyway"
    set ADMIN_CHOICE=!errorlevel!
    echo.
    if !ADMIN_CHOICE! equ 2 (
        echo   Cancelled.
        goto :end
    )
)

:: ── Check git ─────────────────────────────────────────────────────────────────
where git >nul 2>&1
if %errorlevel% neq 0 (
    echo   ERROR: git not found.
    echo          Install it from https://git-scm.com/download/win then re-run.
    goto :fail
)
for /f "tokens=3" %%v in ('git --version 2^>nul') do echo   [OK] git %%v

:: ── Check Node.js ─────────────────────────────────────────────────────────────
where node >nul 2>&1
if %errorlevel% neq 0 (
    echo   ERROR: Node.js not found.
    echo          Install LTS from https://nodejs.org then re-run.
    goto :fail
)

node -e "if(parseInt(process.version.slice(1))<18)process.exit(1)" >nul 2>&1
if %errorlevel% neq 0 (
    for /f "tokens=*" %%v in ('node --version 2^>nul') do (
        echo   ERROR: Node.js v18+ required. You have %%v.
    )
    echo          Update at https://nodejs.org
    goto :fail
)
for /f "tokens=*" %%v in ('node --version 2^>nul') do echo   [OK] Node.js %%v

:: ── Check / install pnpm ──────────────────────────────────────────────────────
where pnpm >nul 2>&1
if %errorlevel% neq 0 (
    echo   ! pnpm not found. Installing globally via npm...
    call npm install -g pnpm
    if %errorlevel% neq 0 (
        echo   ERROR: Failed to install pnpm.
        goto :fail
    )
    :: Add npm global prefix to PATH for this session
    for /f "tokens=*" %%p in ('npm config get prefix 2^>nul') do set PATH=%%p;!PATH!
    where pnpm >nul 2>&1
    if %errorlevel% neq 0 (
        echo   ERROR: pnpm was installed but is not in PATH.
        echo          Close this window, open a new Command Prompt, and re-run.
        goto :fail
    )
)
for /f "tokens=*" %%v in ('pnpm --version 2^>nul') do echo   [OK] pnpm %%v

:: ── Clone / update ────────────────────────────────────────────────────────────
echo.
if exist "%INSTALL_DIR%\.git" (
    echo   MallCord already found at %INSTALL_DIR%
    choice /C YN /M "   Update to the latest version"
    set UPDATE_CHOICE=!errorlevel!
    echo.
    if !UPDATE_CHOICE! equ 1 (
        echo   Pulling latest changes...
        git -C "%INSTALL_DIR%" pull --ff-only
        if %errorlevel% neq 0 (
            echo   ERROR: git pull failed.
            echo          Try deleting %INSTALL_DIR% and re-running.
            goto :fail
        )
        echo   [OK] Repository updated.
    ) else (
        echo   Skipping update — using existing checkout.
    )
) else if exist "%INSTALL_DIR%" (
    echo   ERROR: %INSTALL_DIR% exists but is not a git repository.
    echo          Delete it and re-run.
    goto :fail
) else (
    echo   Cloning MallCord into %INSTALL_DIR%...
    git clone "%REPO_URL%" "%INSTALL_DIR%"
    if %errorlevel% neq 0 (
        echo   ERROR: Clone failed. Check your internet connection.
        goto :fail
    )
    echo   [OK] Cloned.
)

cd /d "%INSTALL_DIR%"
if %errorlevel% neq 0 (
    echo   ERROR: Could not enter %INSTALL_DIR%.
    goto :fail
)

:: ── Install dependencies ──────────────────────────────────────────────────────
echo.
echo   Installing dependencies (this may take a minute)...
call pnpm --dir "%INSTALL_DIR%" install --frozen-lockfile
if %errorlevel% neq 0 (
    echo   ERROR: pnpm install failed. See output above.
    goto :fail
)
echo   [OK] Dependencies installed.

:: ── Build ─────────────────────────────────────────────────────────────────────
echo.
echo   Building MallCord...
call pnpm --dir "%INSTALL_DIR%" build
if %errorlevel% neq 0 (
    echo   ERROR: Build failed. See output above.
    goto :fail
)
echo   [OK] Build complete.

:: ── Inject ────────────────────────────────────────────────────────────────────
echo.
echo   Injecting into Discord...
call pnpm --dir "%INSTALL_DIR%" inject
if %errorlevel% neq 0 (
    echo   ERROR: Injection failed. Make sure Discord is installed.
    goto :fail
)

echo.
echo   ============================================
echo     MallCord installed! Start Discord to load it.
echo   ============================================
echo.
goto :end

:fail
echo.
echo   Installation failed. See errors above.
echo.

:end
pause
endlocal
