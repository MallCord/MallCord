#!/usr/bin/env node
"use strict";

/*
 * MallCord setup. Installs, repairs or removes MallCord by patching the
 * Discord install on this machine. Run it with no arguments for a menu, or
 * pass --install / --uninstall / --repair. Packaged into mallcord-setup.exe
 * with `pnpm package:installer`.
 */

const fs = require("fs");
const os = require("os");
const path = require("path");
const readline = require("readline");
const { execSync } = require("child_process");

const REPO = "MallCord/MallCord";
const ASAR_URL = `https://github.com/${REPO}/releases/latest/download/desktop.asar`;
const DATA_DIR = path.join(process.env.LOCALAPPDATA || os.homedir(), "MallCord");
const ASAR_PATH = path.join(DATA_DIR, "desktop.asar");
const STUB_PKG = JSON.stringify({ name: "discord", main: "index.js" });

const log = (...a) => console.log("»", ...a);
const sleep = ms => new Promise(r => setTimeout(r, ms));

function resourcesDirs() {
    const dirs = [];
    if (process.platform === "win32") {
        const local = process.env.LOCALAPPDATA;
        if (!local) return dirs;
        for (const branch of ["Discord", "DiscordPTB", "DiscordCanary", "DiscordDevelopment"]) {
            const branchDir = path.join(local, branch);
            if (!fs.existsSync(branchDir)) continue;
            for (const name of fs.readdirSync(branchDir)) {
                if (!name.startsWith("app-")) continue;
                const res = path.join(branchDir, name, "resources");
                if (fs.existsSync(res)) dirs.push(res);
            }
        }
    } else if (process.platform === "darwin") {
        for (const b of ["Discord", "Discord PTB", "Discord Canary"]) {
            const res = path.join("/Applications", `${b}.app`, "Contents", "Resources");
            if (fs.existsSync(res)) dirs.push(res);
        }
    } else {
        for (const c of ["/usr/share/discord/resources", "/opt/discord/resources", "/opt/Discord/resources", path.join(os.homedir(), ".local/share/discord/resources")]) {
            if (fs.existsSync(c)) dirs.push(c);
        }
    }
    return dirs;
}

function closeDiscord() {
    try {
        if (process.platform === "win32") {
            for (const exe of ["Discord.exe", "DiscordPTB.exe", "DiscordCanary.exe", "DiscordDevelopment.exe"]) {
                try { execSync(`taskkill /F /T /IM ${exe}`, { stdio: "ignore" }); } catch { }
            }
        } else {
            try { execSync("pkill -i discord", { stdio: "ignore" }); } catch { }
        }
    } catch { }
}

async function downloadAsar() {
    log("Downloading the latest MallCord build...");
    const res = await fetch(ASAR_URL, { redirect: "follow", headers: { "User-Agent": "mallcord-setup" } });
    if (!res.ok) throw new Error(`Couldn't download desktop.asar (HTTP ${res.status}). Has a release been published yet?`);
    fs.mkdirSync(DATA_DIR, { recursive: true });
    fs.writeFileSync(ASAR_PATH, Buffer.from(await res.arrayBuffer()));
}

function writeStub(appDir) {
    fs.writeFileSync(path.join(appDir, "package.json"), STUB_PKG);
    fs.writeFileSync(path.join(appDir, "index.js"), `require(${JSON.stringify(ASAR_PATH.replace(/\\/g, "/"))});\n`);
}

async function rename(from, to) {
    for (let i = 0; i < 6; i++) {
        try { fs.renameSync(from, to); return; }
        catch (e) {
            if (!["EBUSY", "EPERM", "EACCES"].includes(e.code)) throw e;
            await sleep(500);
        }
    }
    throw new Error(`File is locked: ${from}. Fully close Discord and try again.`);
}

async function patch(resources) {
    const app = path.join(resources, "app.asar");
    const _app = path.join(resources, "_app.asar");
    if (fs.existsSync(_app)) {
        if (fs.existsSync(app) && fs.lstatSync(app).isDirectory()) { writeStub(app); return "refreshed"; }
        return "already";
    }
    if (!fs.existsSync(app) || fs.lstatSync(app).isDirectory()) return "skip";
    await rename(app, _app);
    fs.mkdirSync(app);
    writeStub(app);
    return "patched";
}

async function unpatch(resources) {
    const app = path.join(resources, "app.asar");
    const _app = path.join(resources, "_app.asar");
    if (!fs.existsSync(_app)) return "not installed";
    if (fs.existsSync(app) && fs.lstatSync(app).isDirectory()) fs.rmSync(app, { recursive: true, force: true });
    await rename(_app, app);
    return "removed";
}

async function run(action) {
    const dirs = resourcesDirs();
    if (!dirs.length) { log("Couldn't find Discord. Is it installed?"); return; }

    closeDiscord();
    await sleep(1500);

    if (action !== "uninstall") await downloadAsar();

    for (const res of dirs) {
        try {
            const r = action === "uninstall" ? await unpatch(res) : await patch(res);
            log(`${r}: ${res}`);
        } catch (e) {
            log(`failed: ${res} — ${e.message}`);
        }
    }

    log(action === "uninstall" ? "MallCord removed. Open Discord for vanilla." : "Done! Open Discord to use MallCord.");
}

function menu() {
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
    console.log("\n  MallCord Setup\n  --------------\n  1) Install\n  2) Repair\n  3) Uninstall\n  4) Exit\n");
    rl.question("  Pick an option: ", async ans => {
        rl.close();
        const choice = ans.trim();
        if (choice === "1") await run("install");
        else if (choice === "2") await run("repair");
        else if (choice === "3") await run("uninstall");
        else { return; }
        if (process.platform === "win32") {
            const wait = readline.createInterface({ input: process.stdin, output: process.stdout });
            wait.question("\n  Press Enter to close...", () => wait.close());
        }
    });
}

async function main() {
    const args = process.argv.slice(2);
    if (args.includes("--uninstall")) return run("uninstall");
    if (args.includes("--repair")) return run("repair");
    if (args.includes("--install")) return run("install");
    menu();
}

main().catch(e => { console.error("Something went wrong:", e.message); process.exitCode = 1; });
