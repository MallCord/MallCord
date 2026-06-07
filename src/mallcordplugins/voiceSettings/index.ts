/*
 * Vencord, a Discord client mod
 * Copyright (c) 2026 Vendicated and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { definePluginSettings } from "@api/Settings";
import { Logger } from "@utils/Logger";
import { MallCordDevs } from "@utils/constants";
import definePlugin, { makeRange, OptionType } from "@utils/types";
import { findByPropsLazy } from "@webpack";
import { FluxDispatcher } from "@webpack/common";

const logger = new Logger("VoiceSettings");

// Lazily grab the module that owns setNoiseCancellation —
// the same function patched by AltKrispSwitch, so this is proven to exist.
const NoiseModule = findByPropsLazy("setNoiseCancellation");

// ── getUserMedia interceptor ──────────────────────────────────────────────────
// Patches browser-level audio constraints for stereo, echo-cancellation,
// noise suppression and auto gain control.  Works immediately for Vesktop /
// browser; on Discord Desktop the native voice engine still controls these,
// but the patch silently no-ops without breaking anything.
let _origGUM: (typeof navigator.mediaDevices.getUserMedia) | null = null;

function applyGUMPatch() {
    if (_origGUM) return;
    _origGUM = navigator.mediaDevices.getUserMedia.bind(navigator.mediaDevices);

    navigator.mediaDevices.getUserMedia = async function (constraints) {
        if (constraints?.audio && typeof constraints.audio === "object") {
            const s = settings.store;
            if (s.forceStereo) {
                (constraints.audio as MediaTrackConstraints).channelCount = { ideal: 2 };
            }
            if (!s.echoCancellation) {
                (constraints.audio as MediaTrackConstraints).echoCancellation = false;
            }
            if (!s.autoGainControl) {
                (constraints.audio as MediaTrackConstraints).autoGainControl = false;
            }
            if (s.noiseSuppression === "none") {
                (constraints.audio as MediaTrackConstraints).noiseSuppression = false;
            }
        }
        return _origGUM!(constraints);
    };
}

function removeGUMPatch() {
    if (_origGUM) {
        navigator.mediaDevices.getUserMedia = _origGUM;
        _origGUM = null;
    }
}

// ── Apply noise suppression preference ───────────────────────────────────────
// Mirrors the action Discord's UI dispatches when you change noise suppression.
function applyNoiseSuppression() {
    try {
        const mode = settings.store.noiseSuppression;
        // enableKrisp=true → Krisp AI | enableKrisp=false → Standard or None
        // "standard" leaves Krisp off; "none" is handled by the GUM patch above
        // plus making sure Krisp stays off.
        const enableKrisp = mode === "krisp";
        NoiseModule.setNoiseCancellation(enableKrisp, {});
    } catch (e) {
        logger.warn("setNoiseCancellation failed:", e);
    }
}

// ── Settings ──────────────────────────────────────────────────────────────────
const settings = definePluginSettings({
    voiceBitrateKbps: {
        type: OptionType.SLIDER,
        description: "Opus voice bitrate in kbps. Discord defaults to 64 kbps. Raise for better call quality (uses more bandwidth).",
        markers: [32, 64, 96, 128, 192, 256, 320, 510],
        default: 128,
        stickToMarkers: true,
    },
    forceStereo: {
        type: OptionType.BOOLEAN,
        description: "Capture microphone in stereo instead of mono. Rejoin voice for the change to take effect.",
        default: false,
    },
    noiseSuppression: {
        type: OptionType.SELECT,
        description: "Noise suppression mode for your microphone input. Changing this re-applies immediately.",
        options: [
            { label: "Krisp AI (default)", value: "krisp", default: true },
            { label: "Standard (browser-level)", value: "standard" },
            { label: "None (raw mic, best for music/instruments)", value: "none" },
        ],
    },
    echoCancellation: {
        type: OptionType.BOOLEAN,
        description: "Enable browser-level echo cancellation. Disable for music or instruments (Krisp handles this on its own). Rejoin voice to apply.",
        default: true,
    },
    autoGainControl: {
        type: OptionType.BOOLEAN,
        description: "Enable browser-level automatic gain control (normalises mic volume). Disable if you use hardware gain or prefer manual control. Rejoin voice to apply.",
        default: true,
    },
    pttDelayMax: {
        type: OptionType.SLIDER,
        description: "Maximum push-to-talk release delay in milliseconds. Discord caps this at 2 000 ms by default.",
        markers: makeRange(2000, 10000, 1000),
        default: 5000,
        stickToMarkers: true,
    },
});

// ── Plugin ────────────────────────────────────────────────────────────────────
export default definePlugin({
    name: "VoiceSettings",
    description: "Fine-grained voice audio controls: Opus bitrate, stereo capture, noise suppression mode, echo cancellation, auto gain control, and extended PTT delay.",
    tags: ["Voice", "Utility"],
    authors: [MallCordDevs.Sharp],
    settings,

    patches: [
        // ── Opus voice bitrate ────────────────────────────────────────────────
        // Discord hardcodes the voice bitrate; this replaces the literal value
        // with a reference to the plugin setting.
        {
            find: "mediaBitrate:",
            replacement: {
                match: /(?<=mediaBitrate:)\d+/,
                replace: "$self.settings.store.voiceBitrateKbps*1000",
            },
            noWarn: true,
        },

        // ── Push-to-talk release delay ────────────────────────────────────────
        // Discord caps the slider at 2 000 ms; raise the maxValue.
        {
            find: "pttReleaseDelay",
            replacement: {
                match: /(?<=pttReleaseDelay.{0,200})maxValue:2000/,
                replace: "maxValue:$self.settings.store.pttDelayMax",
            },
            noWarn: true,
        },

        // ── Stereo Opus SDP ───────────────────────────────────────────────────
        // When stereo is enabled, append stereo=1;sprop-stereo=1 to the Opus
        // fmtp line in the SDP offer/answer so the receiver accepts stereo.
        // This mirrors the approach used by WebScreenShareFixes for streaming.
        {
            find: ";usedtx=",
            replacement: {
                match: /;usedtx=\$\{(\i)\?"0":"1"\}/,
                replace: '$&${$self.settings.store.forceStereo?";stereo=1;sprop-stereo=1":""}',
            },
            noWarn: true,
        },
    ],

    start() {
        applyGUMPatch();
        applyNoiseSuppression();

        // Re-apply noise suppression preference whenever the user joins a call.
        FluxDispatcher.subscribe("VOICE_CHANNEL_SELECT", applyNoiseSuppression);
    },

    stop() {
        removeGUMPatch();
        FluxDispatcher.unsubscribe("VOICE_CHANNEL_SELECT", applyNoiseSuppression);
    },
});
