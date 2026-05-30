/*
 * MallCord, a vaporwave-inspired Discord client mod
 * Copyright (c) 2026 unfamiliardev
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

// Color palettes for the vaporwave theme. Each sets the --mc-* vars that
// vaporwave.css uses; the chosen one is injected as a :root block.

export interface VaporwavePalette {
    label: string;
    vars: Record<string, string>;
}

const make = (
    label: string,
    pink: string, cyan: string, purple: string, mint: string,
    bgDeep: string, bg: string, bgSoft: string, text: string, textDim: string
): VaporwavePalette => ({
    label,
    vars: {
        "--mc-pink": pink,
        "--mc-cyan": cyan,
        "--mc-purple": purple,
        "--mc-mint": mint,
        "--mc-bg-deep": bgDeep,
        "--mc-bg": bg,
        "--mc-bg-soft": bgSoft,
        "--mc-text": text,
        "--mc-text-dim": textDim,
    }
});

export const vaporwavePalettes: Record<string, VaporwavePalette> = {
    classic: make("Classic", "#ff71ce", "#01cdfe", "#b967ff", "#05ffa1", "#190033", "#25004d", "#320066", "#f7f0ff", "#c8a2ff"),
    miami: make("Miami", "#ff5fa2", "#00e0c7", "#ff61c3", "#ffd36e", "#1a0b2e", "#2a0f45", "#3a1560", "#fff0fb", "#ffb3e6"),
    outrun: make("Outrun", "#ff2e63", "#08f7fe", "#f72585", "#fee440", "#0d0221", "#190b3a", "#241555", "#ffeef6", "#c0a9ff"),
    seapunk: make("Seapunk", "#2ec4b6", "#20a4f3", "#74ee15", "#a7ffcb", "#04293a", "#064663", "#0a5e80", "#eafffb", "#9fe7e0"),
    mallsoft: make("Mallsoft", "#f7a8d8", "#a0d8ef", "#c9a7eb", "#cdeccd", "#2a1d3d", "#3a2a52", "#4a3666", "#fdeffb", "#d9c2ec"),
};

export const DEFAULT_PALETTE = "classic";

export function paletteToCss(name: string): string {
    const palette = vaporwavePalettes[name] ?? vaporwavePalettes[DEFAULT_PALETTE];
    const body = Object.entries(palette.vars).map(([k, v]) => `${k}:${v};`).join("");
    return `:root{${body}}`;
}
