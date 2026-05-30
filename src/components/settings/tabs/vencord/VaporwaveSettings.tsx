/*
 * MallCord, a vaporwave-inspired Discord client mod
 * Copyright (c) 2026 unfamiliardev
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { useSettings } from "@api/Settings";
import ErrorBoundary from "@components/ErrorBoundary";
import { Heading } from "@components/Heading";
import { Margins } from "@components/margins";
import { Paragraph } from "@components/Paragraph";
import { vaporwavePalettes } from "@utils/vaporwavePalettes";
import { Select } from "@webpack/common";

export function VaporwaveSettings() {
    const settings = useSettings(["vaporwaveTheme", "vaporwavePalette"]);

    if (!settings.vaporwaveTheme) return null;

    return (
        <ErrorBoundary noop>
            <Heading tag="h5">Vaporwave Palette</Heading>
            <Paragraph className={Margins.bottom8}>
                Pick the color scheme for the Vaporwave theme. Applies instantly.
            </Paragraph>

            <Select
                options={Object.entries(vaporwavePalettes).map(([value, p]) => ({
                    label: p.label,
                    value,
                    default: value === "classic"
                }))}
                closeOnSelect={true}
                select={v => (settings.vaporwavePalette = v)}
                isSelected={v => v === settings.vaporwavePalette}
                serialize={s => s}
            />
        </ErrorBoundary>
    );
}
