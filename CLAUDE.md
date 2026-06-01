# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

MallCord is a vaporwave-themed Discord client mod — a fork of [Equicord](https://github.com/Equicord/Equicord), which is itself a fork of [Vencord](https://github.com/Vendicated/Vencord). It injects into the Discord desktop app (or ships as a browser extension/userscript) and modifies Discord's minified webpack bundle at runtime via patches and React component swaps.

## Commands

```sh
pnpm install --frozen-lockfile   # install deps
pnpm build                       # desktop build → dist/
pnpm buildWeb                    # browser extension + userscript → dist/
pnpm watch                       # dev: rebuild on change (alias: pnpm dev)
pnpm inject                      # inject built dist into local Discord install
pnpm lint                        # eslint
pnpm lint:fix                    # eslint --fix
pnpm lint-styles                 # stylelint src/**/*.css
pnpm lint:intl                   # validate intl keys
pnpm lint:patches                # validate patch structure
pnpm testTsc                     # type-check only (no emit)
pnpm test                        # full CI: build + tsc + lint + intl + patches + generatePluginJson
```

There are no unit tests. `pnpm test` is the full CI gate.

## Architecture

### Plugin system

Plugins live in one of two directories:

- `src/plugins/<name>/` — upstream plugins ported from Vencord/Equicord
- `src/mallcordplugins/<name>/` — MallCord-original plugins

Every plugin is a folder (even single-file ones) and must export `export default definePlugin({ ... })`. Folder name suffixes gate build targets: `.desktop`, `.web`, `.dev`, `.discordDesktop`, `.vesktop`, `.equibop`.

Required plugin fields: `name`, `description`, `authors` (use `Devs` from `@utils/constants` for upstream devs, `MallCordDevs` for new MallCord authors — never inline).

### Webpack patching

Discord ships a minified webpack bundle. Plugins modify it via `patches: [{ find, replacement: { match, replace } }]` in `definePlugin`. The build system rewrites `match`/`replace` strings before injection:

- `\i` in regex matches any minified identifier
- `#{intl::KEY}` expands to the hashed intl key (never hardcode the hash)
- `$self.fn(...)` in `replace` calls a method on the plugin object
- `$&` keeps the matched text; `$1`/`$2` reference captures

Patches run against the live Discord bundle; a failing patch logs a diff in dev mode.

### Import aliases (tsconfig.json paths)

| Alias | Points to |
|---|---|
| `@webpack/common` | `src/webpack/common` — React, hooks, stores, Discord components |
| `@webpack` | `src/webpack/webpack` — `find*Lazy` finders |
| `@api/*` | `src/api/*` — plugin APIs (Settings, Commands, DataStore, etc.) |
| `@utils/*` | `src/utils/*` — Logger, css, misc, text, react, modal, discord utils |
| `@components/*` | `src/components/*` — shared React components |
| `@plugins/*` | `src/plugins/*` |
| `@mallcordplugins/*` | `src/mallcordplugins/*` |
| `@main/*` | `src/main/*` — Electron main-process code |

Never use `../../` paths when an alias exists.

### Key source layout

```
src/
  Vencord.ts            entry point
  plugins/              upstream plugins (300+)
  mallcordplugins/      MallCord-specific plugins
  api/                  plugin APIs (Settings, DataStore, ContextMenu, …)
  components/           shared components (ErrorBoundary, Icons, …)
  utils/                utilities (Logger, css, misc, text, discord, …)
  webpack/
    common/             re-exports React, hooks, stores, Discord components
    webpack.ts          find*Lazy finders
    patchWebpack.ts     bundle interception
  main/                 Electron main-process IPC, CSP, updater
  shared/               code shared between renderer and main
browser/                browser extension wrapper (MV2 + MV3)
packages/
  discord-types/        Discord type definitions
  vencord-types/        public API types
scripts/
  build/                esbuild build scripts
```

### React and stores

Import `React`, hooks (`useState`, `useEffect`, etc.), stores, and Discord components from `@webpack/common` — never from `"react"` directly (use `import type` only for type-only React imports). Read Discord state via `useStateFromStores([Store], () => selector)`, never with `useState` + manual flux subscriptions.

### API plugin dependencies

When a plugin uses an API imperatively (e.g. `addContextMenuPatch`), it must declare the API in `dependencies`. Declarative plugin fields (e.g. `contextMenus: { ... }`) auto-enable the API without needing `dependencies`. See `.rules` for the full dependency table.

### File headers

Every new source file must start with:
```
/*
 * Vencord, a Discord client mod
 * Copyright (c) <year> Vendicated and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */
```

The header says `Vencord, a Discord client mod` even for new MallCord-only files — MallCord keeps upstream attribution across the whole tree.

## Project rules

The full coding rules are in `.rules` (also mirrored in `AGENTS.md` and `GEMINI.md`). Read it before making non-trivial changes. Key highlights:

- **Smallest diff wins.** Solve the problem at hand; no unsolicited refactors.
- **TypeScript**: never `any`, `!`, `as unknown as`, `@ts-ignore`, `enum`, or `namespace`. Use `unknown` + narrowing, `@ts-expect-error` with a reason, `as const` objects, modules.
- **Storage**: `DataStore` from `@api/DataStore` only. Never `localStorage`/`sessionStorage`/`indexedDB`.
- **Discord API calls**: `RestAPI` from `@webpack/common` only. Never raw `fetch("/api/v9/...")`.
- **DOM**: no `document.querySelector`, `MutationObserver`, or direct `element.style`. Use patches and React.
- **Logging**: `new Logger("PluginName")` at module scope. Never `console.*`.
- **Resource lifecycle**: everything started in `start()` must be cleaned up in `stop()`.

- **dont write urself in the git commits**
