/*
 * Copyright (C) Contributors to the Suwayomi project
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

import type { ReactNode } from 'react';
import { useEffect, useRef } from 'react';
import Link from '@mui/material/Link';
import { Link as RouterLink } from 'react-router-dom';
import type { MangaLocationState } from '@/features/manga/Manga.types.ts';
import type { SourceIdInfo } from '@/features/source/Source.types.ts';
import { AppRoutes } from '@/base/AppRoute.constants.ts';
import { copyToClipboard } from '@/lib/HelperFunctions.ts';

const LONG_PRESS_DURATION = 500;
const LONG_PRESS_MAX_MOVEMENT = 10;

export const SearchLink = ({
    query,
    sourceId,
    mode,
    children,
}: {
    query: string;
    sourceId: SourceIdInfo['id'] | undefined;
    mode: MangaLocationState['mode'] | 'source.global-search';
    children?: ReactNode;
}) => {
    const link = (() => {
        const isSourceMode = mode === 'source' && sourceId !== undefined;
        if (isSourceMode) {
            return AppRoutes.sources.children.browse.path(sourceId, query);
        }

        if (mode === 'source.global-search') {
            return AppRoutes.sources.children.searchAll.path(query);
        }

        return AppRoutes.library.path(undefined, query);
    })();

    // long pressing copies the query
    // the clipboard requires a user activation, iOS reliably grants it in "touchend" but not in a timer or "pointerup",
    // thus, the long press gets tracked via touch events and the copying happens when releasing the finger
    const longPress = useRef<{ timeout?: ReturnType<typeof setTimeout>; x: number; y: number; isActive: boolean }>({
        x: 0,
        y: 0,
        isActive: false,
    });
    useEffect(() => () => clearTimeout(longPress.current.timeout), []);

    const cancelLongPress = () => {
        clearTimeout(longPress.current.timeout);
        longPress.current.isActive = false;
    };

    return (
        <Link
            component={RouterLink}
            to={link}
            onTouchStart={(e) => {
                cancelLongPress();
                const [{ clientX, clientY }] = e.nativeEvent.touches;
                longPress.current.x = clientX;
                longPress.current.y = clientY;
                longPress.current.timeout = setTimeout(() => {
                    longPress.current.isActive = true;
                }, LONG_PRESS_DURATION);
            }}
            onTouchMove={(e) => {
                const [{ clientX, clientY }] = e.nativeEvent.touches;
                const distance = Math.hypot(clientX - longPress.current.x, clientY - longPress.current.y);
                if (distance > LONG_PRESS_MAX_MOVEMENT) {
                    cancelLongPress();
                }
            }}
            onTouchCancel={cancelLongPress}
            onTouchEnd={(e) => {
                const { isActive } = longPress.current;
                cancelLongPress();

                if (isActive) {
                    // prevents the click, which would open the search
                    e.preventDefault();
                    copyToClipboard(query);
                }
            }}
            onContextMenu={(e) => e.preventDefault()}
            sx={{ textDecoration: 'none', color: 'inherit', WebkitTouchCallout: 'none', userSelect: 'none' }}
        >
            {children ?? query}
        </Link>
    );
};
