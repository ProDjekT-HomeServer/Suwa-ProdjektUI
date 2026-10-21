/*
 * Copyright (C) Contributors to the Suwayomi project
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

import Grid from '@mui/material/Grid';
import type { Ref } from 'react';
import { memo } from 'react';
import { requestManager } from '@/lib/requests/RequestManager.ts';
import { useGetVisibleLibraryMangas } from '@/features/library/hooks/useGetVisibleLibraryMangas.ts';
import { STABLE_EMPTY_ARRAY } from '@/base/Base.constants.ts';
import type { CategoryMetadataInfo } from '@/features/category/Category.types.ts';
import { MangaCard } from '@/features/manga/components/cards/MangaCard.tsx';
import { useMetadataServerSettings } from '@/features/settings/services/ServerSettingsMetadata.ts';
import { useNavBarContext } from '@/features/navigation-bar/NavbarContext.tsx';
import { GridLayout } from '@/base/Base.types.ts';
import { TabPreview } from '@/base/components/tabs/TabPreview.tsx';

const GRID_COLUMNS = 12;
const LIST_ITEM_MIN_HEIGHT = 64;
// manga covers have roughly a 2:3 aspect ratio, additional space for the title
const GRID_ITEM_HEIGHT_TO_WIDTH_RATIO = 1.6;

/**
 * Non-virtualized preview of the first mangas of a category, shown while swiping between categories.
 *
 * Only renders as many mangas as are needed to fill the screen.
 */
export const LibraryCategoryPreview = memo(
    ({ category, ref }: { category: CategoryMetadataInfo; ref?: Ref<HTMLDivElement> }) => {
        const {
            settings: { gridLayout, mangaGridItemWidth },
        } = useMetadataServerSettings();
        const { navBarWidth } = useNavBarContext();

        const { data } = requestManager.useGetCategoryMangas(category.id);
        const { visibleMangas } = useGetVisibleLibraryMangas(data?.mangas.nodes ?? STABLE_EMPTY_ARRAY, category);

        const width = Math.max(0, document.documentElement.offsetWidth - navBarWidth);
        const isListLayout = gridLayout === GridLayout.List;
        const itemsPerRow = isListLayout ? 1 : Math.max(1, Math.ceil(width / mangaGridItemWidth));
        const itemHeight = isListLayout
            ? LIST_ITEM_MIN_HEIGHT
            : (width / itemsPerRow) * GRID_ITEM_HEIGHT_TO_WIDTH_RATIO;
        const rows = Math.ceil(window.innerHeight / itemHeight) + 1;
        const mangas = visibleMangas.slice(0, rows * itemsPerRow);

        return (
            <TabPreview ref={ref}>
                <Grid container spacing={1} sx={{ p: 1 }}>
                    {mangas.map((manga) => (
                        <Grid key={manga.id} size={GRID_COLUMNS / itemsPerRow}>
                            <MangaCard manga={manga} gridLayout={gridLayout} selected={null} />
                        </Grid>
                    ))}
                </Grid>
            </TabPreview>
        );
    },
);
