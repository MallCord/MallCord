/*
 * Vencord, a Discord client mod
 * Copyright (c) 2024 Vendicated and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { definePluginSettings } from "@api/Settings";
import { Devs, MallCordDevs } from "@utils/constants";
import definePlugin, { OptionType } from "@utils/types";

let closeSuppressCount = 0;
const settings = definePluginSettings({
    keepOpen: {
        description: "Keeps the gif picker open after selecting a gif",
        type: OptionType.BOOLEAN,
        default: false
    },
});

export default definePlugin({
    name: "BetterGifPicker",
    description: "Makes the gif picker open the favourite category by default",
    tags: ["Emotes", "Customisation"],
    authors: [Devs.Samwich, MallCordDevs.justjxke],
    isModified: true,
    settings,
    patches: [
        {
            find: "renderHeaderContent(){",
            replacement: [
                {
                    match: /(?<=state={resultType:)null/,
                    replace: '"Favorites"'
                }
            ]
        },
    ],
});
