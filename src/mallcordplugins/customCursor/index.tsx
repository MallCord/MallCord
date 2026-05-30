/*
 * MallCord, a vaporwave-inspired Discord client mod
 * Copyright (c) 2026 Dann
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { definePluginSettings } from "@api/Settings";
import { MallCordDevs } from "@utils/constants";
import definePlugin, { OptionType } from "@utils/types";

const CURSORS: Record<string, { name: string; url: string; }> = {
    default: { name: "Discord Default", url: "auto" },
    mc_sword: { name: "Minecraft Diamond Sword", url: "url(https://cur.cursors-4u.net/games/gam-4/gam383.cur), auto" },
    mc_diamond: { name: "Minecraft Diamond", url: "url(https://cur.cursors-4u.net/games/gam-4/gam379.cur), auto" },
    cute_cat: { name: "Cute Nyan Cat", url: "url(https://cur.cursors-4u.net/anime/ani-12/ani1128.cur), auto" },
    crosshair: { name: "Pixel Crosshair", url: "url(https://cur.cursors-4u.net/games/gam-12/gam1151.cur), auto" },
    neon_blue: { name: "Neon Blue Arrow", url: "url(https://cur.cursors-4u.net/abstract/abs-5/abs471.cur), auto" },
};

let node: HTMLStyleElement | null = null;

function apply() {
    node ??= Object.assign(document.createElement("style"), { id: "mallcord-custom-cursor" });
    if (!node.isConnected) document.head.appendChild(node);

    const cursor = CURSORS[settings.store.cursor] ?? CURSORS.default;
    node.textContent = cursor.url === "auto" ? "" : `*{cursor:${cursor.url} !important;}`;
}

const settings = definePluginSettings({
    cursor: {
        type: OptionType.SELECT,
        description: "Which cursor to use",
        options: Object.entries(CURSORS).map(([value, c]) => ({
            label: c.name,
            value,
            default: value === "default"
        })),
        onChange: apply
    }
});

export default definePlugin({
    name: "CustomCursor",
    description: "Swap your Discord cursor for themed ones (Minecraft, cat, neon, crosshair...).",
    authors: [MallCordDevs.Dann],
    settings,

    start: apply,
    stop() {
        node?.remove();
        node = null;
    }
});
