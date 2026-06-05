/*
 * Vencord, a Discord client mod
 * Copyright (c) 2026 Vendicated and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { ChatBarButton, ChatBarButtonFactory } from "@api/ChatButtons";
import { MallCordDevs } from "@utils/constants";
import definePlugin, { IconComponent } from "@utils/types";
import { MediaEngineStore, React, SelectedChannelStore, useState, useStateFromStores } from "@webpack/common";

let fakeDeafActive = false;
let originalIsSelfDeaf: (() => boolean) | null = null;

function setFakeDeaf(value: boolean) {
    fakeDeafActive = value;
    if (value && originalIsSelfDeaf === null) {
        originalIsSelfDeaf = MediaEngineStore.isSelfDeaf.bind(MediaEngineStore);
        (MediaEngineStore as any).isSelfDeaf = () => true;
    } else if (!value && originalIsSelfDeaf !== null) {
        (MediaEngineStore as any).isSelfDeaf = originalIsSelfDeaf;
        originalIsSelfDeaf = null;
    }
}

const DeafenIcon: IconComponent = ({ height = 20, width = 20, className }) => (
    <svg width={width} height={height} className={className} viewBox="0 0 24 24" fill="currentColor">
        <path d="M6.7 11H5C5 15.08 7.96 18.44 12 18.93V21H9V23H15V21H13V18.93C17.04 18.44 20 15.09 20 11H18.3C18.3 14.48 15.74 17.3 12 17.3C8.26 17.3 5.7 14.48 5.7 11H6.7Z" />
        <path d="M12 3C10.07 3 8.5 4.57 8.5 6.5V11C8.5 12.93 10.07 14.5 12 14.5C13.93 14.5 15.5 12.93 15.5 11V6.5C15.5 4.57 13.93 3 12 3Z" />
        <line x1="3" y1="3" x2="21" y2="21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
);

const FakeDeafenButton: ChatBarButtonFactory = ({ isAnyChat }) => {
    const inVc = useStateFromStores([SelectedChannelStore], () => !!SelectedChannelStore.getVoiceChannelId());
    const [active, setActive] = useState(fakeDeafActive);

    if (!isAnyChat || !inVc) return null;

    return (
        <ChatBarButton
            tooltip={active ? "Disable Fake Deafen" : "Enable Fake Deafen"}
            onClick={() => {
                const next = !active;
                setFakeDeaf(next);
                setActive(next);
            }}
            buttonProps={{
                style: { color: active ? "var(--status-danger)" : undefined }
            }}
        >
            <DeafenIcon />
        </ChatBarButton>
    );
};

export default definePlugin({
    name: "FakeDeafen",
    description: "Makes your deafen icon appear active without actually deafening your audio. Only visual — you can still hear everything.",
    tags: ["Voice", "Fun"],
    authors: [MallCordDevs.pepsify],
    dependencies: ["ChatInputButtonAPI"],

    chatBarButton: {
        icon: DeafenIcon,
        render: FakeDeafenButton,
    },

    stop() {
        setFakeDeaf(false);
    },
});
