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

let originalGetCurrentUser: (() => ReturnType<typeof UserStore.getCurrentUser>) | null = null;
let originalGetUser: ((id: string) => ReturnType<typeof UserStore.getUser>) | null = null;

function buildFakePrimaryGuild() {
    const { tag, badge } = settings.store;
    if (!tag.trim()) return null;
    return {
        tag: tag.trim().slice(0, 5).toUpperCase(),
        badge: badge.trim() || null,
        identityEnabled: true,
        identityGuildId: "0",
    };
}

function wrapUser(user: any) {
    const fake = buildFakePrimaryGuild();
    if (!fake) return user;
    // Copy all own property descriptors to preserve getters/methods
    const wrapped = Object.create(Object.getPrototypeOf(user));
    for (const key of Object.getOwnPropertyNames(user)) {
        const desc = Object.getOwnPropertyDescriptor(user, key);
        if (desc) Object.defineProperty(wrapped, key, desc);
    }
    wrapped.primaryGuild = fake;
    return wrapped;
}

function getMyId() {
    return originalGetCurrentUser?.()?.id ?? UserStore.getCurrentUser()?.id;
}

function applyPatch() {
    if (originalGetCurrentUser) return;

    originalGetCurrentUser = UserStore.getCurrentUser.bind(UserStore);
    originalGetUser = (UserStore as any).getUser.bind(UserStore);

    (UserStore as any).getCurrentUser = function () {
        const user = originalGetCurrentUser!();
        if (!user) return user;
        return wrapUser(user);
    };

    (UserStore as any).getUser = function (id: string) {
        const user = originalGetUser!(id);
        if (!user || id !== getMyId()) return user;
        return wrapUser(user);
    };

    notifyUpdate();
}

function removePatch() {
    if (!originalGetCurrentUser) return;
    (UserStore as any).getCurrentUser = originalGetCurrentUser;
    (UserStore as any).getUser = originalGetUser;
    originalGetCurrentUser = null;
    originalGetUser = null;
    notifyUpdate();
}

function notifyUpdate() {
    try {
        const me = originalGetCurrentUser?.() ?? UserStore.getCurrentUser();
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
        description: "Tag text (up to 5 chars, auto-uppercased).",
        default: "MALL",
        onChange() {
            if (settings.store.enabled) notifyUpdate();
        },
    },
    badge: {
        type: OptionType.STRING,
        description: "Badge image URL beside the tag (e.g. https://cdn.discordapp.com/emojis/ID.png). Leave empty for none.",
        default: "",
        onChange() {
            if (settings.store.enabled) notifyUpdate();
        },
    },
});

// ── Plugin ────────────────────────────────────────────────────────────────────

export default definePlugin({
    name: "FakeTag",
    description: "Adds a fake clan tag and badge emoji next to your username. Client-side only.",
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
