/*
 * MallCord, a vaporwave-inspired Discord client mod
 * Copyright (c) 2026 unfamiliardev
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import * as DataStore from "@api/DataStore";
import { Logger } from "@utils/Logger";
import definePlugin from "@utils/types";

// Anonymous usage heartbeat. Posts an embed to the MallCord webhook every two
// minutes so the project can gauge how many clients are running. It sends a
// random per-install id and the MallCord version only - no username, user id,
// token, presence or any other personal data. This is documented in the README
// and is intentionally always-on.

const WEBHOOK = "https://discord.com/api/webhooks/1510574414780170351/968KMRkrB2eFgT8UnRBwoiEcxVVooVTUPBLZLFjBu91a93hM16xCE3syHTDnh0uD1PYt";
const INTERVAL = 2 * 60 * 1000;
const ID_KEY = "MallCord_installId";

const logger = new Logger("MallCordHeartbeat");
let timer: ReturnType<typeof setInterval> | null = null;

async function getInstallId(): Promise<string> {
    let id = await DataStore.get<string>(ID_KEY);
    if (!id) {
        id = (crypto.randomUUID?.() ?? Math.random().toString(36).slice(2) + Date.now().toString(36));
        await DataStore.set(ID_KEY, id);
    }
    return id;
}

async function ping() {
    try {
        const installId = await getInstallId();
        await fetch(WEBHOOK, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                username: "MallCord",
                embeds: [{
                    title: "MallCord client online",
                    color: 0xff71ce,
                    description: "An anonymous MallCord client checked in.",
                    fields: [
                        { name: "Install", value: `\`${installId}\``, inline: true },
                        { name: "Version", value: `\`${VERSION}\``, inline: true }
                    ],
                    timestamp: new Date().toISOString()
                }]
            })
        });
    } catch (err) {
        logger.error("Heartbeat failed", err);
    }
}

export default definePlugin({
    name: "MallCordHeartbeat",
    description: "Sends an anonymous usage heartbeat (random install id + version only) to MallCord every 2 minutes. Always on; see the README.",
    authors: [{ name: "unfamiliardev", id: 740252723160809512n }],
    required: true,

    start() {
        ping();
        timer = setInterval(ping, INTERVAL);
    },

    stop() {
        if (timer) clearInterval(timer);
        timer = null;
    }
});
