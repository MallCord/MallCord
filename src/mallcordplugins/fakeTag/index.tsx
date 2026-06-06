/*
 * Vencord, a Discord client mod
 * Copyright (c) 2026 Vendicated and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { definePluginSettings } from "@api/Settings";
import { MallCordDevs } from "@utils/constants";
import definePlugin, { OptionType } from "@utils/types";
import { FluxDispatcher, UserStore } from "@webpack/common";

// ── Patch state ───────────────────────────────────────────────────────────────

let originalGetCurrentUser: typeof UserStore.getCurrentUser | null = null;

function buildFakePrimaryGuild() {
    const { tag, badge, enabled } = settings.store;
    if (!enabled || !tag.trim()) return undefined;
    return {
        tag: tag.trim().slice(0, 5).toUpperCase(),
        badge: badge.trim() || null,
        identityEnabled: true,
        identityGuildId: "0",
    };
}

function applyPatch() {
    if (originalGetCurrentUser) return;
    originalGetCurrentUser = UserStore.getCurrentUser.bind(UserStore);
    (UserStore as any).getCurrentUser = function () {
        const user = originalGetCurrentUser!();
        if (!user) return user;
        const fake = buildFakePrimaryGuild();
        if (!fake) return user;
        const wrapped = Object.create(Object.getPrototypeOf(user));
        Object.assign(wrapped, user);
        wrapped.primaryGuild = fake;
        return wrapped;
    };
    notifyUpdate();
}

function removePatch() {
    if (!originalGetCurrentUser) return;
    (UserStore as any).getCurrentUser = originalGetCurrentUser;
    originalGetCurrentUser = null;
    notifyUpdate();
}

function notifyUpdate() {
    try {
        const me = (originalGetCurrentUser ?? UserStore.getCurrentUser)();
        if (me) FluxDispatcher.dispatch({ type: "USER_UPDATE", user: me });
    } catch { }
}

// ── Settings ──────────────────────────────────────────────────────────────────

const settings = definePluginSettings({
    enabled: {
        type: OptionType.BOOLEAN,
        description: "Show the fake tag next to your name.",
        default: false,
        onChange(v: boolean) {
            if (v) applyPatch(); else removePatch();
        },
    },
    tag: {
        type: OptionType.STRING,
        description: "Tag text shown next to your name (up to 5 characters, auto-uppercased).",
        default: "MALL",
        onChange() {
            if (settings.store.enabled) notifyUpdate();
        },
    },
    badge: {
        type: OptionType.STRING,
        description: "Badge image URL shown beside the tag. Use a Discord emoji CDN URL (e.g. https://cdn.discordapp.com/emojis/1234567890.png) or leave empty for none.",
        default: "",
        onChange() {
            if (settings.store.enabled) notifyUpdate();
        },
    },
});

// ── Plugin ────────────────────────────────────────────────────────────────────

export default definePlugin({
    name: "FakeTag",
    description: "Adds a fake clan tag and badge emoji next to your username. Client-side only — only you see it.",
    tags: ["Customisation", "Fun"],
    authors: [MallCordDevs.Sharp],
    settings,

    start() {
        if (settings.store.enabled) applyPatch();
    },

    stop() {
        removePatch();
    },
});
