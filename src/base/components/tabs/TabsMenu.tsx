/*
 * Copyright (C) Contributors to the Suwayomi project
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

import type { TabsProps } from '@mui/material/Tabs';
import Tabs from '@mui/material/Tabs';
import { alpha, styled } from '@mui/material/styles';
import { CAPSULE_RADIUS, liquidGlass } from '@/features/theme/LiquidGlass.ts';

const TAB_HEIGHT = 40;
const TABS_PADDING = 4;

const StyledTabsMenu = styled(Tabs)(({ theme }) => ({
    ...liquidGlass(theme),
    display: 'flex',
    alignItems: 'center',
    minHeight: TAB_HEIGHT + TABS_PADDING * 2,
    margin: theme.spacing(0.5, 1.5),
    padding: TABS_PADDING,
    borderRadius: CAPSULE_RADIUS,
    '& .MuiTabs-scroller': {
        borderRadius: CAPSULE_RADIUS,
    },
    // the indicator becomes a pill behind the selected tab (concentric to the capsule)
    '& .MuiTabs-indicator': {
        top: 0,
        bottom: 'auto',
        height: '100%',
        borderRadius: CAPSULE_RADIUS,
        backgroundColor: alpha(theme.palette.text.primary, 0.1),
        ...theme.applyStyles('dark', {
            backgroundColor: alpha(theme.palette.text.primary, 0.14),
        }),
    },
    '& .MuiTab-root': {
        zIndex: 1,
        minHeight: TAB_HEIGHT,
        paddingBlock: 0,
        borderRadius: CAPSULE_RADIUS,
        textTransform: 'none',
        fontWeight: 600,
        // the selection is shown by the pill, the tint color might not have enough contrast on the glass
        '&.Mui-selected': {
            color: theme.palette.text.primary,
        },
    },
    '& .MuiTabs-scrollButtons': {
        borderRadius: CAPSULE_RADIUS,
        minHeight: TAB_HEIGHT,
    },
}));

export const TabsMenu = ({ children, ...props }: TabsProps) => (
    <StyledTabsMenu
        indicatorColor="primary"
        textColor="primary"
        variant="scrollable"
        scrollButtons="auto"
        allowScrollButtonsMobile
        {...props}
    >
        {children}
    </StyledTabsMenu>
);
