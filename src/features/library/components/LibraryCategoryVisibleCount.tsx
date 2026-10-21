/*
 * Copyright (C) Contributors to the Suwayomi project
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

import { memo, useEffect } from 'react';
import { requestManager } from '@/lib/requests/RequestManager.ts';
import { useGetVisibleLibraryMangas } from '@/features/library/hooks/useGetVisibleLibraryMangas.ts';
import { STABLE_EMPTY_ARRAY } from '@/base/Base.constants.ts';
import type { CategoryIdInfo, CategoryMetadataInfo } from '@/features/category/Category.types.ts';

/**
 * - undefined: not yet known
 * - null: could not be determined (e.g. request failed)
 */
export type LibraryCategoryVisibleCountValue = number | null | undefined;

/**
 * Renders nothing, only reports the number of mangas of a category that are visible with the categories' current
 * filters and the active search query.
 *
 * Uses the same request as the library grid, thus, the data is shared via the apollo cache.
 */
export const LibraryCategoryVisibleCount = memo(
    ({
        category,
        onCountChange,
    }: {
        category: CategoryMetadataInfo;
        onCountChange: (categoryId: CategoryIdInfo['id'], count: LibraryCategoryVisibleCountValue) => void;
    }) => {
        const { data, loading, error } = requestManager.useGetCategoryMangas(category.id);
        const { visibleMangas } = useGetVisibleLibraryMangas(data?.mangas.nodes ?? STABLE_EMPTY_ARRAY, category);

        const count = ((): LibraryCategoryVisibleCountValue => {
            if (data) {
                return visibleMangas.length;
            }

            if (error) {
                return null;
            }

            return loading ? undefined : visibleMangas.length;
        })();

        useEffect(() => {
            onCountChange(category.id, count);
        }, [category.id, count]);

        return null;
    },
);
