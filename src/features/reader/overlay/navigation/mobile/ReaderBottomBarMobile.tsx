/*
 * Copyright (C) Contributors to the Suwayomi project
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

import IconButton from '@mui/material/IconButton';
import SettingsIcon from '@mui/icons-material/Settings';
import Stack from '@mui/material/Stack';
import { useTheme } from '@mui/material/styles';
import AppSettingsAltIcon from '@mui/icons-material/AppSettingsAlt';
import FormatListBulletedIcon from '@mui/icons-material/FormatListBulleted';
import { bindDialog, bindTrigger, usePopupState } from 'material-ui-popup-state/hooks';
import Dialog from '@mui/material/Dialog';
import DialogContent from '@mui/material/DialogContent';
import Slide from '@mui/material/Slide';
import { memo, useCallback, useLayoutEffect, useRef, useState } from 'react';
import { useLingui } from '@lingui/react/macro';
import { CustomTooltip } from '@/base/components/CustomTooltip.tsx';
import type { ReaderBottomBarMobileProps } from '@/features/reader/overlay/ReaderOverlay.types.ts';
import { MobileReaderProgressBar } from '@/features/reader/overlay/progress-bar/mobile/MobileReaderProgressBar.tsx';
import { ReaderChapterList } from '@/features/reader/overlay/navigation/components/ReaderChapterList.tsx';
import { ReaderBottomBarMobileQuickSettings } from '@/features/reader/overlay/navigation/mobile/quick-settings/ReaderBottomBarMobileQuickSettings.tsx';
import { useResizeObserver } from '@/base/hooks/useResizeObserver.tsx';
import { useReaderChaptersStore, useReaderScrollbarStore } from '@/features/reader/stores/ReaderStore.ts';
import { CAPSULE_RADIUS, GLASS_FLOATING_MARGIN, liquidGlass } from '@/features/theme/LiquidGlass.ts';

const BaseReaderBottomBarMobile = ({
    openSettings,
    isVisible,
    topOffset = 0,
}: ReaderBottomBarMobileProps & { topOffset?: number }) => {
    const { t } = useLingui();
    const theme = useTheme();
    const { currentChapterId, chapters } = useReaderChaptersStore((state) => ({
        currentChapterId: state.currentChapter?.id,
        chapters: state.chapters,
    }));

    const chapterListPopupState = usePopupState({ variant: 'dialog', popupId: 'reader-chapter-list-dialog' });
    const quickSettingsPopupState = usePopupState({ variant: 'dialog', popupId: 'reader-quick-settings-dialog' });
    const scrollbar = useReaderScrollbarStore((state) => state);

    const [bottomBarRefHeight, setBottomBarRefHeight] = useState(0);
    const bottomBarRef = useRef<HTMLDivElement>(null);
    useResizeObserver(
        bottomBarRef,
        useCallback(() => setBottomBarRefHeight(bottomBarRef.current?.clientHeight ?? 0), [bottomBarRefHeight]),
    );

    useLayoutEffect(() => {
        chapterListPopupState.close();
    }, [currentChapterId]);

    return (
        <>
            <Stack
                sx={{
                    position: 'fixed',
                    right: `${scrollbar.ySize}px`,
                    bottom: 0,
                    left: 0,
                    height: `calc(100% - ${topOffset}px)`,
                }}
            >
                <MobileReaderProgressBar topOffset={topOffset} bottomOffset={bottomBarRefHeight} />
                <Slide direction="up" in={isVisible}>
                    <Stack
                        ref={bottomBarRef}
                        sx={{
                            alignItems: 'center',
                            pt: `${GLASS_FLOATING_MARGIN}px`,
                            // floats above the home indicator instead of filling the safe area
                            pb: `max(${scrollbar.xSize}px, env(safe-area-inset-bottom), ${GLASS_FLOATING_MARGIN}px)`,
                        }}
                    >
                        <Stack
                            sx={{
                                ...liquidGlass(theme, { clear: true }),
                                flexDirection: 'row',
                                p: 0.75,
                                gap: 2,
                                justifyContent: 'center',
                                alignItems: 'center',
                                borderRadius: CAPSULE_RADIUS,
                                pointerEvents: 'all',
                            }}
                        >
                            <CustomTooltip title={t`Chapter list`}>
                                <IconButton {...bindTrigger(chapterListPopupState)} color="inherit">
                                    <FormatListBulletedIcon />
                                </IconButton>
                            </CustomTooltip>
                            <CustomTooltip title={t`Quick settings`}>
                                <IconButton {...bindTrigger(quickSettingsPopupState)} color="inherit">
                                    <AppSettingsAltIcon />
                                </IconButton>
                            </CustomTooltip>
                            <CustomTooltip title={t`Settings`}>
                                <IconButton onClick={openSettings} color="inherit">
                                    <SettingsIcon />
                                </IconButton>
                            </CustomTooltip>
                        </Stack>
                    </Stack>
                </Slide>
            </Stack>
            {chapterListPopupState.isOpen && (
                <Dialog {...bindDialog(chapterListPopupState)} fullWidth maxWidth="md" scroll="paper">
                    <DialogContent sx={{ p: 0, pb: 1 }}>
                        <ReaderChapterList
                            style={{
                                minHeight: '15vh',
                                maxHeight: '75vh',
                            }}
                            currentChapterId={currentChapterId}
                            chapters={chapters}
                        />
                    </DialogContent>
                </Dialog>
            )}
            {quickSettingsPopupState.isOpen && (
                <Dialog {...bindDialog(quickSettingsPopupState)} fullWidth maxWidth="md" scroll="paper">
                    <DialogContent>
                        <ReaderBottomBarMobileQuickSettings />
                    </DialogContent>
                </Dialog>
            )}
        </>
    );
};

export const ReaderBottomBarMobile = memo(BaseReaderBottomBarMobile);
