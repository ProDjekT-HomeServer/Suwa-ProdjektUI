/*
 * Copyright (C) Contributors to the Suwayomi project
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

import { useLocation } from 'react-router-dom';
import { MediaQuery } from '@/base/utils/MediaQuery.tsx';
import { NAVIGATION_BAR_ITEMS } from '@/features/navigation-bar/NavigationBar.constants.ts';

/**
 * Whether the current page is one of the pages of the navigation bar (e.g. library, browse), which have no back button.
 */
export const useIsMainRoute = (): boolean => {
    const { pathname } = useLocation();
    const isMobileWidth = MediaQuery.useIsMobileWidth();

    return NAVIGATION_BAR_ITEMS.some(({ path, show }) => {
        if (isMobileWidth && show === 'desktop') {
            return false;
        }

        if (!isMobileWidth && show === 'mobile') {
            return false;
        }

        return path === pathname;
    });
};
