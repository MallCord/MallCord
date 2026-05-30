/*
 * Turns installer/mallcord-setup.cjs into mallcord-setup.exe using Node's
 * built-in Single Executable App support (Node 20+). No downloads of a base
 * binary - it copies the Node you're running and injects the script blob.
 */

import { execFileSync } from "child_process";
import { copyFileSync, rmSync, writeFileSync } from "fs";
import { join } from "path";

const FUSE = "NODE_SEA_FUSE_fce680ab2cc467b6e072b8b5df1996b2";
const root = process.cwd();
const config = join(root, "installer", "sea-config.json");
const blob = join(root, "installer", "sea-prep.blob");
const out = join(root, process.platform === "win32" ? "mallcord-setup.exe" : "mallcord-setup");

writeFileSync(config, JSON.stringify({
    main: "installer/mallcord-setup.cjs",
    output: "installer/sea-prep.blob",
    disableExperimentalSEAWarning: true
}));

console.log("Generating SEA blob...");
execFileSync(process.execPath, ["--experimental-sea-config", config], { stdio: "inherit" });

console.log("Copying Node binary...");
copyFileSync(process.execPath, out);

console.log("Injecting blob with postject...");
const postject = ["--yes", "postject", out, "NODE_SEA_BLOB", blob, "--sentinel-fuse", FUSE];
if (process.platform === "darwin") postject.push("--macho-segment-name", "NODE_SEA");
execFileSync(process.platform === "win32" ? "npx.cmd" : "npx", postject, { stdio: "inherit", shell: true });

rmSync(blob, { force: true });
rmSync(config, { force: true });
console.log(`\nDone -> ${out}`);
