/*
 * Copyright (C) Contributors to the Suwayomi project
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

import Box from '@mui/material/Box';
import type { ReactNode, Ref } from 'react';
import { createContext, useContext } from 'react';
import { OffsetContainer } from '@/base/OffsetComponent.tsx';

const TabPreviewContext = createContext(false);

/**
 * Screens rendered inside a {@link TabPreview} must not have global side effects (e.g. changing the app bar).
 */
export const useIsTabPreview = (): boolean => useContext(TabPreviewContext);

/**
 * Non-interactive container for the preview of an adjacent tab, positioned and shown by "useTabSwipe".
 */
export const TabPreview = ({ ref, children }: { ref?: Ref<HTMLDivElement>; children?: ReactNode }) => (
    <Box
        ref={ref}
        aria-hidden
        inert
        sx={{
            position: 'fixed',
            left: 0,
            top: 0,
            overflow: 'hidden',
            visibility: 'hidden',
            pointerEvents: 'none',
            backgroundColor: 'background.default',
            contain: 'strict',
        }}
    >
        <TabPreviewContext value>
            {/* the preview starts below the sticky elements, thus, sticky elements of the preview must not be offset */}
            <OffsetContainer initial>{children}</OffsetContainer>
        </TabPreviewContext>
    </Box>
);
