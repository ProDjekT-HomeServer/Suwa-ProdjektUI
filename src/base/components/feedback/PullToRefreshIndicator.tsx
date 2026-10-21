/*
 * Copyright (C) Contributors to the Suwayomi project
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

import Box from '@mui/material/Box';
import { useTheme } from '@mui/material/styles';
import RefreshIcon from '@mui/icons-material/Refresh';
import { PULL_TO_REFRESH_THRESHOLD } from '@/base/hooks/useTouchGestures.ts';
import { useNavBarContext } from '@/features/navigation-bar/NavbarContext.tsx';
import { liquidGlass } from '@/features/theme/LiquidGlass.ts';

const INDICATOR_SIZE = 40;

export const PullToRefreshIndicator = ({ pullDistance }: { pullDistance: number }) => {
    const theme = useTheme();
    const { appBarHeight } = useNavBarContext();

    if (!pullDistance) {
        return null;
    }

    const progress = Math.min(pullDistance / PULL_TO_REFRESH_THRESHOLD, 1);
    const isThresholdReached = progress === 1;

    return (
        <Box
            sx={{
                ...liquidGlass(theme),
                position: 'fixed',
                top: appBarHeight,
                left: '50%',
                zIndex: 'appBar',
                width: INDICATOR_SIZE,
                height: INDICATOR_SIZE,
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                pointerEvents: 'none',
                opacity: progress,
                transform: `translate(-50%, ${pullDistance - INDICATOR_SIZE}px)`,
            }}
        >
            <RefreshIcon
                color={isThresholdReached ? 'primary' : 'inherit'}
                sx={{ transform: `rotate(${progress * 270}deg)` }}
            />
        </Box>
    );
};
