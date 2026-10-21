/*
 * Copyright (C) Contributors to the Suwayomi project
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

import { useMemo } from 'react';
import Typography from '@mui/material/Typography';
import Stack from '@mui/material/Stack';
import Box from '@mui/material/Box';
import { useTheme } from '@mui/material/styles';
import { ReaderService } from '@/features/reader/services/ReaderService.ts';
import { ProgressBarType, ReadingDirection } from '@/features/reader/Reader.types.ts';
import { getPage } from '@/features/reader/overlay/progress-bar/ReaderProgressBar.utils.tsx';
import { useNavBarContext } from '@/features/navigation-bar/NavbarContext.tsx';
import { reverseString } from '@/base/utils/Strings.ts';
import type { NavbarContextType } from '@/features/navigation-bar/NavigationBar.types.ts';
import { withPropsFrom } from '@/base/hoc/withPropsFrom.tsx';
import { CAPSULE_RADIUS, liquidGlass } from '@/features/theme/LiquidGlass.ts';
import {
    useReaderPagesStore,
    useReaderProgressBarStore,
    useReaderScrollbarStore,
    useReaderSettingsStore,
} from '@/features/reader/stores/ReaderStore.ts';

const BaseReaderPageNumber = ({
    isDesktop,
    readerNavBarWidth,
}: Pick<ReturnType<typeof ReaderService.useOverlayMode>, 'isDesktop'> &
    Pick<NavbarContextType, 'readerNavBarWidth'>) => {
    const scrollbar = useReaderScrollbarStore((state) => state);
    const { currentPageIndex, pages, totalPages } = useReaderPagesStore('currentPageIndex', 'pages', 'totalPages');
    const { readingDirection, shouldShowPageNumber, progressBarType, progressBarSize } = useReaderSettingsStore(
        (state) => ({
            readingDirection: state.readingDirection.value,
            shouldShowPageNumber: state.shouldShowPageNumber,
            progressBarType: state.progressBarType,
            progressBarSize: state.progressBarSize,
        }),
    );
    const progressBarSizeInset = isDesktop && progressBarType === ProgressBarType.STANDARD ? progressBarSize : 0;
    const theme = useTheme();
    const isMaximized = useReaderProgressBarStore('isMaximized');

    const pageName = useMemo(() => {
        const currentPageName = getPage(currentPageIndex, pages).name;
        const SEPARATOR = '/';
        const tmpPageName = `${currentPageName}${SEPARATOR}${totalPages}`;

        return readingDirection === ReadingDirection.LTR ? tmpPageName : reverseString(tmpPageName, SEPARATOR);
    }, [currentPageIndex, pages, totalPages, readingDirection]);

    if (!shouldShowPageNumber) {
        return null;
    }

    if (isMaximized) {
        return null;
    }

    return (
        <Stack
            sx={{
                position: 'fixed',
                left: readerNavBarWidth,
                right: 0,
                bottom:
                    // stays above the home indicator even when the pages extend below it
                    `calc(${theme.spacing(1)} + ${progressBarSizeInset}px + max(${scrollbar.xSize}px, env(safe-area-inset-bottom)))`,
                alignItems: 'center',
                transition: `left 0.${theme.transitions.duration.shortest}s`,
            }}
        >
            <Box
                sx={{
                    ...liquidGlass(theme, { clear: true }),
                    px: 1.5,
                    py: 0.25,
                    borderRadius: CAPSULE_RADIUS,
                }}
            >
                <Typography variant="body2" sx={{ fontWeight: 600, fontVariantNumeric: 'tabular-nums' }}>
                    {pageName}
                </Typography>
            </Box>
        </Stack>
    );
};

export const ReaderPageNumber = withPropsFrom(
    BaseReaderPageNumber,
    [ReaderService.useOverlayMode, useNavBarContext],
    ['isDesktop', 'readerNavBarWidth'],
);
