/*
 * MallCord, a vaporwave-inspired Discord client mod
 * Copyright (c) 2026 unfamiliardev
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

/**
 * Self-contained native injector for MallCord.
 *
 * Replaces the old "download Equilotl and run it" flow. This patches
 * Discord directly, using the exact folder-shim mechanism the in-app
 * host-update hook relies on (see src/main/applyHostPatch.ts):
 *
 *   - rename vanilla `resources/app.asar` -> `resources/_app.asar`
 *   - create a *folder* named `resources/app.asar/` with a package.json +
 *     index.js whose index.js `require()`s our built `dist/desktop/patcher.js`
 *
 * Electron treats a directory named `app.asar` as an unpacked app and loads
 * it over the archive, so it runs our stub, which loads the patcher, which
 * loads the original `_app.asar`. Idempotent: the `_app.asar` marker means
 * re-running is safe (we just refresh the stub's patcher path).
 *
 * Usage (via package.json):
 *   pnpm inject     -> --install
 *   pnpm uninject   -> --uninstall
 *   pnpm repair     -> --repair
 */

import "./checkNodeVersion.js";

import { execSync } from "child_process";
import { existsSync, lstatSync, mkdirSync, readdirSync, renameSync, rmSync, writeFileSync } from "fs";
import { homedir } from "os";
import { dirname, join } from "path";
import { setTimeout as sleep } from "timers/promises";
import { fileURLToPath } from "url";

const BASE_DIR = join(dirname(fileURLToPath(import.meta.url)), "..");
const PATCHER_PATH = join(BASE_DIR, "dist", "desktop", "patcher.js");

const STUB_PACKAGE = JSON.stringify({ name: "discord", main: "index.js" });
const makeStubIndex = patcherPath => `require(${JSON.stringify(patcherPath.replace(/\\/g, "/"))});\n`;

const VERSION_PREFIX = "app-";

function getResourcesDirs() {
    const dirs = [];

    if (process.platform === "win32") {
        const local = process.env.LOCALAPPDATA;
        if (!local) return dirs;
        for (const branch of ["Discord", "DiscordPTB", "DiscordCanary", "DiscordDevelopment"]) {
            const branchDir = join(local, branch);
            if (!existsSync(branchDir)) continue;
            for (const name of readdirSync(branchDir)) {
                if (!name.startsWith(VERSION_PREFIX)) continue;
                const res = join(branchDir, name, "resources");
                if (existsSync(res)) dirs.push(res);
            }
        }
    } else if (process.platform === "darwin") {
        for (const branch of ["Discord", "Discord PTB", "Discord Canary"]) {
            const res = join("/Applications", `${branch}.app`, "Contents", "Resources");
            if (existsSync(res)) dirs.push(res);
        }
    } else {
        // linux: best-effort list of common install locations
        const candidates = [
            "/usr/share/discord/resources",
            "/usr/lib/discord/resources",
            "/usr/lib64/discord/resources",
            "/opt/discord/resources",
            "/opt/Discord/resources",
            "/opt/DiscordCanary/resources",
            "/opt/DiscordPTB/resources",
            join(homedir(), ".local/share/discord/resources"),
            join(homedir(), ".local/share/DiscordCanary/resources"),
        ];
        for (const c of candidates) if (existsSync(c)) dirs.push(c);
    }

    return dirs;
}

function killDiscord() {
    console.log("Closing Discord so its files can be patched...");
    try {
        if (process.platform === "win32") {
            for (const exe of ["Discord.exe", "DiscordPTB.exe", "DiscordCanary.exe", "DiscordDevelopment.exe"]) {
                try {
                    execSync(`taskkill /F /T /IM ${exe}`, { stdio: "ignore" });
                } catch {
                    // not running -> taskkill exits non-zero, that's fine
                }
            }
        } else {
            try {
                execSync("pkill -i discord", { stdio: "ignore" });
            } catch {
                // nothing running
            }
        }
    } catch (err) {
        console.warn("Could not close Discord automatically. Close it manually if patching fails.", err?.message ?? err);
    }
}

/** rename with a few retries to ride out lingering file locks after closing Discord */
async function renameWithRetry(from, to) {
    let lastErr;
    for (let attempt = 0; attempt < 6; attempt++) {
        try {
            renameSync(from, to);
            return;
        } catch (err) {
            lastErr = err;
            if (err.code !== "EBUSY" && err.code !== "EPERM" && err.code !== "EACCES") throw err;
            await sleep(500);
        }
    }
    throw lastErr;
}

async function patch(resources) {
    const app = join(resources, "app.asar");
    const _app = join(resources, "_app.asar");

    if (existsSync(_app)) {
        // already patched -> just refresh the stub so it points at the current patcher path
        if (existsSync(app) && lstatSync(app).isDirectory()) {
            writeFileSync(join(app, "package.json"), STUB_PACKAGE);
            writeFileSync(join(app, "index.js"), makeStubIndex(PATCHER_PATH));
            return "refreshed";
        }
        return "already";
    }

    if (!existsSync(app) || lstatSync(app).isDirectory()) return "skip";

    await renameWithRetry(app, _app);
    try {
        mkdirSync(app);
        writeFileSync(join(app, "package.json"), STUB_PACKAGE);
        writeFileSync(join(app, "index.js"), makeStubIndex(PATCHER_PATH));
    } catch (err) {
        // roll back the rename so we never leave Discord without an app.asar
        try {
            rmSync(app, { recursive: true, force: true });
            renameSync(_app, app);
        } catch (cleanupErr) {
            console.error("Rollback failed:", cleanupErr);
        }
        throw err;
    }
    return "patched";
}

async function unpatch(resources) {
    const app = join(resources, "app.asar");
    const _app = join(resources, "_app.asar");

    if (!existsSync(_app)) return "notpatched";

    if (existsSync(app) && lstatSync(app).isDirectory()) {
        rmSync(app, { recursive: true, force: true });
    }
    await renameWithRetry(_app, app);
    return "unpatched";
}

async function main() {
    const argStart = process.argv.indexOf("--");
    const args = argStart === -1 ? [] : process.argv.slice(argStart + 1);
    const action = args.includes("--uninstall")
        ? "uninstall"
        : args.includes("--repair")
            ? "repair"
            : "install";

    if (action !== "uninstall" && !existsSync(PATCHER_PATH)) {
        console.error("Could not find the built patcher at dist/desktop/patcher.js.");
        console.error("Run `pnpm build` first, then `pnpm inject`.");
        process.exit(1);
    }

    const resourcesDirs = getResourcesDirs();
    if (!resourcesDirs.length) {
        console.error("No Discord installation found. Is Discord installed?");
        process.exit(1);
    }

    console.log(`Found ${resourcesDirs.length} Discord install(s).`);
    killDiscord();
    await sleep(1500);

    let ok = 0;
    for (const resources of resourcesDirs) {
        try {
            if (action === "uninstall") {
                const r = await unpatch(resources);
                console.log(`  [${r}] ${resources}`);
            } else {
                if (action === "repair") await unpatch(resources);
                const r = await patch(resources);
                console.log(`  [${r}] ${resources}`);
            }
            ok++;
        } catch (err) {
            console.error(`  [failed] ${resources}\n    ${err?.message ?? err}`);
        }
    }

    if (ok === 0) {
        console.error("Nothing was changed. If files were locked, fully close Discord and try again.");
        process.exit(1);
    }

    console.log(
        action === "uninstall"
            ? "MallCord removed. Start Discord normally for vanilla."
            : "Done! Start Discord to load MallCord."
    );
}

main().catch(err => {
    console.error("Something went wrong:", err);
    process.exit(1);
});
