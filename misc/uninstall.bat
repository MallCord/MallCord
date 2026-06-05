@echo off
setlocal enabledelayedexpansion

:: MallCord uninstaller — removes MallCord from Discord and optionally deletes the repo.
:: Run as a normal user (NOT as Administrator).

set INSTALL_DIR=%USERPROFILE%\MallCord

echo.
echo   +----------------------------------+
echo   ^|      MallCord Uninstaller        ^|
echo   +----------------------------------+
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

:: ── Check repo exists ─────────────────────────────────────────────────────────
if not exist "%INSTALL_DIR%\.git" (
    echo   ERROR: MallCord not found at %INSTALL_DIR%.
    echo          Nothing to uninstall.
    goto :fail
)

echo   Found MallCord at %INSTALL_DIR%.
echo.

:: ── Uninject ──────────────────────────────────────────────────────────────────
echo   Removing MallCord from Discord...
call node "%INSTALL_DIR%\scripts\runInstaller.mjs" -- --uninstall
if %errorlevel% neq 0 (
    echo   WARNING: Uninject step reported an error. Discord may already be uninjected.
)
echo   [OK] MallCord removed from Discord.

:: ── Optionally delete the repo ────────────────────────────────────────────────
echo.
choice /C YN /M "   Also delete the MallCord folder at %INSTALL_DIR%"
set DEL_CHOICE=!errorlevel!
echo.
if !DEL_CHOICE! equ 1 (
    echo   Deleting %INSTALL_DIR%...
    rmdir /s /q "%INSTALL_DIR%"
    echo   [OK] Folder deleted.
) else (
    echo   Kept folder — you can reinstall later by running install.bat.
)

echo.
echo   ============================================
echo     MallCord uninstalled. Restart Discord.
echo   ============================================
echo.
goto :end

:fail
echo.
echo   Uninstallation failed. See errors above.
echo.

:end
pause
endlocal
