/*
 * MallCord, a vaporwave-inspired Discord client mod
 * Copyright (c) 2026 unfamiliardev
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import * as DataStore from "@api/DataStore";
import { definePluginSettings } from "@api/Settings";
import { Button } from "@components/Button";
import { FormSwitch } from "@components/FormSwitch";
import { MallCordDevs } from "@utils/constants";
import definePlugin, { OptionType } from "@utils/types";
import { React, Text, TextInput, useEffect, useState } from "@webpack/common";

const KEY = "MallCord_CustomProfile";

interface Profile {
    username: string;
    displayName: string;
    avatar: string;
    simulateNitro: boolean;
    bio: string;
    pronouns: string;
    color1: string;
    color2: string;
    creationDate: string;
    email: string;
}

const EMPTY: Profile = {
    username: "", displayName: "", avatar: "", simulateNitro: false,
    bio: "", pronouns: "", color1: "#5865f2", color2: "#eb459e",
    creationDate: "", email: ""
};

let current: Profile = { ...EMPTY };
let styleNode: HTMLStyleElement | null = null;

function applyStyle(p: Profile) {
    styleNode ??= Object.assign(document.createElement("style"), { id: "mallcord-custom-profile" });
    if (!styleNode.isConnected) document.head.appendChild(styleNode);
    if (!p.simulateNitro) { styleNode.textContent = ""; return; }
    // local-only banner gradient preview using the chosen profile colors
    styleNode.textContent = `:root{--mc-profile-1:${p.color1};--mc-profile-2:${p.color2};}`;
}

async function load() {
    current = { ...EMPTY, ...(await DataStore.get<Profile>(KEY) ?? {}) };
    applyStyle(current);
}

const field = (label: string, hint: string, children: React.ReactNode) => (
    <div style={{ marginBottom: 16 }}>
        <Text variant="text-sm/semibold" style={{ marginBottom: 4 }}>{label}</Text>
        {children}
        {hint && <Text variant="text-xs/normal" style={{ color: "var(--text-muted)", marginTop: 2 }}>{hint}</Text>}
    </div>
);

function Editor() {
    const [p, setP] = useState<Profile>(current);
    const [saved, setSaved] = useState(false);

    useEffect(() => { load().then(() => setP(current)); }, []);

    const set = (k: keyof Profile, v: any) => setP(prev => ({ ...prev, [k]: v }));

    const save = async () => {
        current = p;
        await DataStore.set(KEY, p);
        applyStyle(p);
        setSaved(true);
        setTimeout(() => setSaved(false), 1500);
    };
    const reset = () => setP({ ...EMPTY });

    return (
        <div style={{ color: "var(--text-normal)" }}>
            <Text variant="heading-lg/semibold" style={{ marginBottom: 12 }}>✦ Custom Profile</Text>

            {field("Username", "", <TextInput value={p.username} onChange={v => set("username", v)} placeholder="my_username" />)}
            {field("Display Name", "", <TextInput value={p.displayName} onChange={v => set("displayName", v)} placeholder="My Name" />)}
            {field("Profile Picture", "", <TextInput value={p.avatar} onChange={v => set("avatar", v)} placeholder="Image URL..." />)}

            <FormSwitch
                title="Simulate Nitro"
                description="Enables banner and profile color"
                value={p.simulateNitro}
                onChange={v => set("simulateNitro", v)}
                hideBorder
            />

            {field("Bio", "", <TextInput value={p.bio} onChange={v => set("bio", v)} placeholder="My description..." />)}
            {field("Pronouns", "", <TextInput value={p.pronouns} onChange={v => set("pronouns", v)} placeholder="he/him" />)}

            {field("Profile Color (Nitro — gradient possible)", "", (
                <div style={{ display: "flex", gap: 16 }}>
                    <label style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        Color 1
                        <input type="color" value={p.color1} onChange={e => set("color1", e.currentTarget.value)} />
                    </label>
                    <label style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        Color 2
                        <input type="color" value={p.color2} onChange={e => set("color2", e.currentTarget.value)} />
                    </label>
                </div>
            ))}

            {field("Account Creation Date", "", <TextInput value={p.creationDate} onChange={v => set("creationDate", v)} placeholder="dd/mm/yyyy" />)}
            {field("Email Address (local display)", "", <TextInput value={p.email} onChange={v => set("email", v)} placeholder="example@mail.com" />)}

            <div style={{ display: "flex", gap: 8, marginTop: 16 }}>
                <Button onClick={save}>{saved ? "✓ Saved" : "Save"}</Button>
                <Button variant="dangerPrimary" onClick={reset}>Reset</Button>
            </div>
        </div>
    );
}

const settings = definePluginSettings({
    editor: {
        type: OptionType.COMPONENT,
        description: "",
        component: Editor
    }
});

export default definePlugin({
    name: "CustomProfile",
    description: "Build a custom local profile — name, avatar, bio, pronouns, gradient colors and more. Stored on your client only.",
    authors: [MallCordDevs.pepsify],
    settings,
    start: load,
    stop() {
        styleNode?.remove();
        styleNode = null;
    }
});
