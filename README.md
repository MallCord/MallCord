# [<img src="https://iili.io/C3jZGrg.th.png" width="40" align="left" alt="MallCord">](https://github.com/MallCord/MallCord) MallCord

[![License](https://img.shields.io/badge/License-GPL--3.0-ff71ce?style=flat)](./LICENSE)
[![Vaporwave](https://img.shields.io/badge/aesthetic-vaporwave-01cdfe?style=flat)](#)
[![Discord](https://img.shields.io/badge/Discord-join-b967ff?style=flat&logo=discord&logoColor=white)](https://discord.gg/VBAJFf6fY6)

> aesthetic vibes for your client.

**MallCord** is a vaporwave-inspired Discord client mod by **matthew (unfamiliardev)**. It is a rebrand and reskin of
[Equicord](https://github.com/Equicord/Equicord), which is itself an enhanced fork of
[Vencord](https://github.com/Vendicated/Vencord) bundling 300+ community plugins.

## Installing MallCord

### Quick install

**Linux / macOS**
```sh
wget https://raw.githubusercontent.com/MallCord/MallCord/refs/heads/main/misc/install.sh && chmod +x install.sh && ./install.sh
```

**Windows** — 
```sh
irm "https://raw.githubusercontent.com/MallCord/MallCord/main/misc/install.bat" -OutFile install.bat; .\install.bat
```
The script checks all dependencies, clones the repo, builds, and injects into Discord automatically.

### Manual install (build from source)

Works on **Windows**, **macOS**, **Linux** and **BSD** — anything with Git, Node and the Discord desktop app. `pnpm inject` auto-detects your Discord install (Stable/PTB/Canary/Dev, including `/opt`, distro packages, `~/.local`, BSD `/usr/local`, Flatpak and Snap layouts).

### Dependencies

[Git](https://git-scm.com/download) and [Node.JS LTS](https://nodejs.dev/en/) are required.

Install `pnpm`:

> :exclamation: This next command may need to be run as admin/root depending on your system, and you may need to close and reopen your terminal for pnpm to be in your PATH.

```shell
npm i -g pnpm
```

> :exclamation: **IMPORTANT** Make sure you aren't using an admin/root terminal from here onwards. It **will** mess up your Discord/MallCord instance and you **will** most likely have to reinstall.

Clone MallCord:

```shell
git clone https://github.com/MallCord/MallCord
cd MallCord
```

Install dependencies:

```shell
pnpm install --frozen-lockfile
```

Build MallCord:

```shell
pnpm build
```

Inject MallCord into your desktop client:

```shell
pnpm inject
```

Build MallCord for web:

```shell
pnpm buildWeb
```

After building MallCord's web extension, locate the appropriate ZIP file in the `dist` directory and follow your browser's guide for installing custom extensions, if supported.

Note: Firefox extension zip requires Firefox for developers

## Support

Need help, want to report a bug, or just hang out? Join the MallCord Discord server:

**https://discord.gg/VBAJFf6fY6**

## Credits

Built on the shoulders of:

- [Vencord](https://github.com/Vendicated/Vencord) by [Vendicated](https://github.com/Vendicated) — the original Discord client mod.
- [Equicord](https://github.com/Equicord/Equicord) — the enhanced fork MallCord is based on.

Huge thanks to everyone who contributed to those projects; individual plugin authors are credited in their respective source files.

## Disclaimer

Discord is trademark of Discord Inc., and solely mentioned for the sake of descriptivity.
Mentioning it does not imply any affiliation with or endorsement by Discord Inc.
Vencord is not connected to MallCord and as such, all donation links go to Vendicated's donation link.

<details>
<summary>Using MallCord violates Discord's terms of service</summary>

Client modifications are against Discord's Terms of Service.

However, Discord is pretty indifferent about them and there are no known cases of users getting banned for using client mods! So you should generally be fine if you don't use plugins that implement abusive behaviour. But no worries, all inbuilt plugins are safe to use!

Regardless, if your account is essential to you and getting disabled would be a disaster for you, you should probably not use any client mods (not exclusive to MallCord), just to be safe.

Additionally, make sure not to post screenshots with MallCord in a server where you might get banned for it.

</details>
