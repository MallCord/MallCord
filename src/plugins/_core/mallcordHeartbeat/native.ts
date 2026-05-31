/*
 * MallCord, a vaporwave-inspired Discord client mod
 * Copyright (c) 2026 unfamiliardev
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

// Runs in the Electron main process, so it isn't subject to the renderer's CORS
// or Discord's request guards. Posts the anonymous heartbeat embed to the
// MallCord webhook. Only a random install id + version are sent.

const WEBHOOK = "https://discord.com/api/webhooks/1510574414780170351/968KMRkrB2eFgT8UnRBwoiEcxVVooVTUPBLZLFjBu91a93hM16xCE3syHTDnh0uD1PYt";

export async function sendHeartbeat(_: unknown, installId: string, version: string) {
    try {
        const res = await fetch(WEBHOOK, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                username: "MallCord",
                embeds: [{
                    title: "MallCord client online",
                    color: 0xff71ce,
                    description: "An anonymous MallCord client checked in.",
                    fields: [
                        { name: "Install", value: "`" + installId + "`", inline: true },
                        { name: "Version", value: "`" + version + "`", inline: true }
                    ],
                    timestamp: new Date().toISOString()
                }]
            })
        });
        return res.ok;
    } catch {
        return false;
    }
}
