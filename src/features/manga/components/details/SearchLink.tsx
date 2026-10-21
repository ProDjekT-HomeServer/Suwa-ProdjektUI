/*
 * Copyright (C) Contributors to the Suwayomi project
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

import type { ReactNode } from 'react';
import Link from '@mui/material/Link';
import { Link as RouterLink } from 'react-router-dom';
import type { MangaLocationState } from '@/features/manga/Manga.types.ts';
import type { SourceIdInfo } from '@/features/source/Source.types.ts';
import { AppRoutes } from '@/base/AppRoute.constants.ts';
import { usePress } from '@/base/hooks/usePress.ts';
import { copyToClipboard, noOp } from '@/lib/HelperFunctions.ts';

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
    const bindPress = usePress({
        onLongPress: noOp,
        // the clipboard requires a user activation, which iOS only grants on releasing the finger and not via a timer
        onFinish: () => copyToClipboard(query),
        onPress: noOp,
    });

    return (
        <Link
            component={RouterLink}
            to={link}
            {...bindPress()}
            sx={{ textDecoration: 'none', color: 'inherit', WebkitTouchCallout: 'none', userSelect: 'none' }}
        >
            {children ?? query}
        </Link>
    );
};
