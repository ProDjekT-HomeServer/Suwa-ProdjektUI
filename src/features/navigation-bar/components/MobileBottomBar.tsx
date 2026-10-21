/*
 * Copyright (C) Contributors to the Suwayomi project
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

import Box from '@mui/material/Box';
import { useCallback, useLayoutEffect, useRef } from 'react';
import {} from 'react-router-dom';
import { useTheme } from '@mui/material/styles';
import { useResizeObserver } from '@/base/hooks/useResizeObserver.tsx';
import { useNavBarContext } from '@/features/navigation-bar/NavbarContext.tsx';
import type { NavbarItem } from '@/features/navigation-bar/NavigationBar.types.ts';
import { NavigationBarItem } from '@/features/navigation-bar/components/NavigationBarItem.tsx';
import Stack from '@mui/material/Stack';
import { CAPSULE_RADIUS, GLASS_FLOATING_MARGIN, liquidGlass, scrollEdgeEffect } from '@/features/theme/LiquidGlass.ts';

export const MobileBottomBar = ({ navBarItems }: { navBarItems: NavbarItem[] }) => {
    const theme = useTheme();
    const { setBottomBarHeight } = useNavBarContext();

    const ref = useRef<HTMLDivElement | null>(null);
    useResizeObserver(
        ref,
        useCallback(() => setBottomBarHeight(ref.current?.clientHeight ?? 0), [ref.current]),
    );
    useLayoutEffect(() => () => setBottomBarHeight(0), []);

    return (
        // the measured wrapper includes the floating margin, thus, the content can scroll below the floating bar
        <Box
            ref={ref}
            sx={{
                position: 'fixed',
                bottom: 0,
                left: 0,
                right: 0,
                pt: `${GLASS_FLOATING_MARGIN}px`,
                pb: `max(env(safe-area-inset-bottom), ${GLASS_FLOATING_MARGIN}px)`,
                pl: `calc(env(safe-area-inset-left) + ${GLASS_FLOATING_MARGIN}px)`,
                pr: `calc(env(safe-area-inset-right) + ${GLASS_FLOATING_MARGIN}px)`,
                zIndex: theme.zIndex.drawer - 1,
                pointerEvents: 'none',
                isolation: 'isolate',
                '&::before': scrollEdgeEffect(theme, 'bottom'),
            }}
        >
            <Stack
                component="nav"
                sx={{
                    ...liquidGlass(theme, { elevated: true }),
                    flexDirection: 'row',
                    borderRadius: CAPSULE_RADIUS,
                    p: 0.5,
                    pointerEvents: 'auto',
                }}
            >
                {navBarItems.map((item) => (
                    <NavigationBarItem
                        key={item.path}
                        {...item}
                        slots={{
                            listItemLink: {
                                sx: {
                                    py: 0.25,
                                    borderRadius: CAPSULE_RADIUS,
                                    overflow: 'hidden',
                                },
                            },
                        }}
                        forceCollapsed
                    />
                ))}
            </Stack>
        </Box>
    );
};
