/*
 * Copyright (C) Contributors to the Suwayomi project
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

import type { ChipProps } from '@mui/material/Chip';
import Chip from '@mui/material/Chip';
import Tab from '@mui/material/Tab';
import { styled, useTheme } from '@mui/material/styles';
import { useCallback, useMemo, useState } from 'react';
import { useQueryParam, NumberParam, StringParam } from 'use-query-params';
import Button from '@mui/material/Button';
import { Link } from 'react-router-dom';
import Box from '@mui/material/Box';
import { useLingui } from '@lingui/react/macro';
import { plural } from '@lingui/core/macro';
import { requestManager } from '@/lib/requests/RequestManager.ts';
import { EmptyViewAbsoluteCentered } from '@/base/components/feedback/EmptyViewAbsoluteCentered.tsx';
import { LoadingPlaceholder } from '@/base/components/feedback/LoadingPlaceholder.tsx';
import { TabPanel } from '@/base/components/tabs/TabPanel.tsx';
import { LibraryToolbarMenu } from '@/features/library/components/LibraryToolbarMenu.tsx';
import { LibraryMangaGrid } from '@/features/library/components/LibraryMangaGrid.tsx';
import { AppbarSearch } from '@/base/components/AppbarSearch.tsx';
import { UpdateChecker } from '@/features/updates/components/UpdateChecker.tsx';
import { SyncButton } from '@/features/sync/components/SyncButton.tsx';
import { useSelectableCollection } from '@/base/collection/hooks/useSelectableCollection.ts';
import { SelectableCollectionSelectMode } from '@/base/collection/components/SelectableCollectionSelectMode.tsx';
import { useGetVisibleLibraryMangas } from '@/features/library/hooks/useGetVisibleLibraryMangas.ts';
import { SelectionFAB } from '@/base/collection/components/SelectionFAB.tsx';
import { MangaActionMenuItems } from '@/features/manga/components/MangaActionMenuItems.tsx';
import { TabsMenu } from '@/base/components/tabs/TabsMenu.tsx';
import { TabsWrapper } from '@/base/components/tabs/TabsWrapper.tsx';
import { defaultPromiseErrorHandler } from '@/lib/DefaultPromiseErrorHandler.ts';
import type {
    GetCategoriesLibraryQuery,
    GetCategoriesLibraryQueryVariables,
    GetMangasCountQuery,
    GetMangasCountQueryVariables,
    MangaChapterStatFieldsFragment,
} from '@/lib/graphql/generated/graphql.ts';
import { GET_CATEGORIES_LIBRARY } from '@/lib/graphql/category/CategoryQuery.ts';
import { Mangas } from '@/features/manga/services/Mangas.ts';
import { MANGA_CHAPTER_STAT_FIELDS } from '@/lib/graphql/manga/MangaFragments.ts';
import { useMetadataServerSettings } from '@/features/settings/services/ServerSettingsMetadata.ts';
import { GET_MANGAS_COUNT } from '@/lib/graphql/manga/MangaQuery.ts';
import { useAppTitle } from '@/features/navigation-bar/hooks/useAppTitle.ts';
import { useAppAction } from '@/features/navigation-bar/hooks/useAppAction.ts';
import { AppRoutes } from '@/base/AppRoute.constants.ts';
import { SearchParam } from '@/base/Base.types.ts';
import { STABLE_EMPTY_ARRAY } from '@/base/Base.constants.ts';
import type { MangaIdInfo } from '@/features/manga/Manga.types.ts';
import { OffsetComponent } from '@/base/OffsetComponent.tsx';
import { MUIUtil } from '@/lib/mui/MUI.util.ts';
import type { LibraryCategoryVisibleCountValue } from '@/features/library/components/LibraryCategoryVisibleCount.tsx';
import { LibraryCategoryVisibleCount } from '@/features/library/components/LibraryCategoryVisibleCount.tsx';
import { useTouchGestures } from '@/base/hooks/useTouchGestures.ts';
import { useTabSwipe } from '@/base/hooks/useTabSwipe.ts';
import { LibraryCategoryPreview } from '@/features/library/components/LibraryCategoryPreview.tsx';
import { PullToRefreshIndicator } from '@/base/components/feedback/PullToRefreshIndicator.tsx';
import { makeToast } from '@/base/utils/Toast.ts';
import { getErrorMessage } from '@/lib/HelperFunctions.ts';
import type { CategoryIdInfo } from '@/features/category/Category.types.ts';

const TitleWithSizeTag = styled('span')({
    display: 'flex',
    alignItems: 'center',
});

const TitleSizeTag = ({ sx, ...props }: ChipProps) => (
    <Chip {...props} size="small" sx={MUIUtil.mergeSx(sx, { marginLeft: '5px' })} />
);

export function Library() {
    const { t } = useLingui();
    const theme = useTheme();

    const {
        settings: { showTabSize, hideEmptyCategories },
    } = useMetadataServerSettings();

    const {
        data: categoriesResponse,
        error: tabsError,
        loading: areCategoriesLoading,
        refetch: refetchCategories,
    } = requestManager.useGetCategories<GetCategoriesLibraryQuery, GetCategoriesLibraryQueryVariables>(
        GET_CATEGORIES_LIBRARY,
    );
    const tabsData = categoriesResponse?.categories.nodes.filter(
        (category) => category.id !== 0 || (category.id === 0 && category.mangas.totalCount),
    );
    const allTabs = tabsData ?? STABLE_EMPTY_ARRAY;

    const [visibleCounts, setVisibleCounts] = useState<Record<CategoryIdInfo['id'], LibraryCategoryVisibleCountValue>>(
        {},
    );
    const handleVisibleCountChange = useCallback(
        (categoryId: CategoryIdInfo['id'], count: LibraryCategoryVisibleCountValue) =>
            setVisibleCounts((counts) => (counts[categoryId] === count ? counts : { ...counts, [categoryId]: count })),
        [],
    );
    const areVisibleCountsKnown = allTabs.every((tab) => visibleCounts[tab.id] !== undefined);

    const tabs = useMemo(() => {
        if (!hideEmptyCategories) {
            return allTabs;
        }

        const nonEmptyTabs = allTabs.filter((tab) => visibleCounts[tab.id] !== 0);
        // in case every category is empty, show all of them, otherwise, there would be no way to change the filters
        return nonEmptyTabs.length ? nonEmptyTabs : allTabs;
    }, [allTabs, visibleCounts, hideEmptyCategories]);

    const visibleCountReporters = allTabs.map((tab) => (
        <LibraryCategoryVisibleCount key={tab.id} category={tab} onCountChange={handleVisibleCountChange} />
    ));

    const librarySizeResponse = requestManager.useGetMangas<GetMangasCountQuery, GetMangasCountQueryVariables>(
        GET_MANGAS_COUNT,
        { condition: { inLibrary: true } },
    );

    const librarySize = librarySizeResponse.data?.mangas.totalCount ?? 0;

    const [tabSearchParam, setTabSearchParam] = useQueryParam(SearchParam.TAB, NumberParam);
    const [query] = useQueryParam(SearchParam.QUERY, StringParam);

    const activeTab: (typeof tabs)[number] | undefined = tabs.find((tab) => tab.id === tabSearchParam) ?? tabs[0];

    const {
        data: categoryMangaResponse,
        error: mangaError,
        loading: mangaLoading,
        refetch: refetchCategoryMangas,
    } = requestManager.useGetCategoryMangas(activeTab?.id, { skip: !activeTab });
    const categoryMangas = categoryMangaResponse?.mangas.nodes ?? STABLE_EMPTY_ARRAY;
    const {
        visibleMangas: mangas,
        searchSuggestions,
        showFilteredOutMessage,
        filterKey,
    } = useGetVisibleLibraryMangas(categoryMangas, activeTab);

    const getTabCount = (tab: (typeof tabs)[number]) => {
        if (tab === activeTab && !mangaLoading) {
            return mangas.length;
        }

        return visibleCounts[tab.id] ?? tab.mangas.totalCount;
    };

    const { data: globalUpdateData } = requestManager.useGetGlobalUpdateSummary();
    const isGlobalUpdateRunning = !!globalUpdateData?.libraryUpdateStatus.jobsInfo.isRunning;

    const startLibraryUpdate = async () => {
        if (isGlobalUpdateRunning) {
            makeToast(t`Library update is already running`, 'info');
            return;
        }

        try {
            await requestManager.startGlobalUpdate().response;
            makeToast(t`Updating library`, 'info');
        } catch (e) {
            makeToast(t`Could not check for updates`, 'error', getErrorMessage(e));
        }
    };

    const retryFetchCategoryMangas = useCallback(
        () => refetchCategoryMangas().catch(defaultPromiseErrorHandler('Library::refetchCategoryMangas')),
        [refetchCategoryMangas, activeTab],
    );

    const mangaIds = useMemo(() => mangas.map((manga) => manga.id), [mangas]);
    const mangaTitles = useMemo(() => searchSuggestions.map((manga) => manga.title), [searchSuggestions]);

    const [isSelectModeActive, setIsSelectModeActive] = useState(false);
    const {
        areNoItemsForKeySelected: areNoItemsSelected,
        areAllItemsForKeySelected: areAllItemsSelected,
        selectedItemIds,
        handleSelectAll,
        handleSelection,
        clearSelection,
    } = useSelectableCollection<MangaIdInfo['id'], string>(mangas.length, {
        itemIds: mangaIds,
        currentKey: activeTab?.id.toString(),
        initialState: undefined,
    });

    const handleSelect: typeof handleSelection = useCallback(
        (id, selected, selectOptions) => {
            setIsSelectModeActive(!!(selectedItemIds.length + (selected ? 1 : -1)));
            handleSelection(id, selected, selectOptions);
        },
        [setIsSelectModeActive, handleSelection],
    );

    const activeTabIndex = activeTab ? tabs.indexOf(activeTab) : -1;
    const previousTab = activeTabIndex > 0 ? tabs[activeTabIndex - 1] : undefined;
    const nextTab = activeTabIndex >= 0 ? tabs[activeTabIndex + 1] : undefined;
    const { panelRef, previousPreviewRef, nextPreviewRef, gestureHandlers } = useTabSwipe({
        activeTabId: activeTab?.id,
        previousTabId: previousTab?.id,
        nextTabId: nextTab?.id,
        onTabChange: setTabSearchParam,
    });
    const { ref: gestureRef, pullDistance } = useTouchGestures({
        ...gestureHandlers,
        onPullDown: startLibraryUpdate,
        disabled: isSelectModeActive,
        ignoreSelector: '[role="tablist"]',
    });

    const selectedMangas = useMemo(
        () =>
            selectedItemIds
                .map((id) =>
                    Mangas.getFromCache<MangaChapterStatFieldsFragment>(
                        id,
                        MANGA_CHAPTER_STAT_FIELDS,
                        'MANGA_CHAPTER_STAT_FIELDS',
                    ),
                )
                .filter((manga) => !!manga),
        [selectedItemIds.length, mangas],
    );

    const selectionFab = useMemo(() => {
        if (!isSelectModeActive) {
            return null;
        }

        return (
            <SelectionFAB title={plural(selectedItemIds.length, { one: '# manga', other: '# manga' })}>
                {(handleClose, setHideMenu) => (
                    <MangaActionMenuItems
                        selectedMangas={selectedMangas}
                        onClose={() => {
                            handleClose();
                            setIsSelectModeActive(false);
                            clearSelection();
                        }}
                        setHideMenu={setHideMenu}
                    />
                )}
            </SelectionFAB>
        );
    }, [isSelectModeActive, selectedMangas]);

    const triggerGlobalSearchButton = useMemo(
        () =>
            !!query && (
                <Box sx={{ p: 2 }}>
                    <Button
                        size="large"
                        component={Link}
                        to={AppRoutes.sources.children.searchAll.path(query)}
                        sx={{ textTransform: 'none', width: '100%' }}
                    >
                        {t`Search for "${query}" globally`}
                    </Button>
                </Box>
            ),
        [query],
    );

    useAppTitle(
        <TitleWithSizeTag>
            {t`Library`}
            {showTabSize && (
                <TitleSizeTag
                    sx={theme.applyStyles('light', { backgroundColor: 'background.paper' })}
                    label={librarySize}
                />
            )}
        </TitleWithSizeTag>,
        t`Library`,
        [t, showTabSize, librarySize, theme],
    );
    useAppAction(
        <>
            {!isSelectModeActive && activeTab && (
                <>
                    <AppbarSearch searchHistoryKey="library" suggestions={mangaTitles} />
                    <LibraryToolbarMenu category={activeTab} mangas={mangas} />
                    <SyncButton />
                    <UpdateChecker categoryId={activeTab?.id} />
                </>
            )}
            {!!mangas.length && (
                <SelectableCollectionSelectMode
                    isActive={isSelectModeActive}
                    areAllItemsSelected={areAllItemsSelected}
                    areNoItemsSelected={areNoItemsSelected}
                    onSelectAll={(selectAll) =>
                        handleSelectAll(selectAll, [...new Set(mangas.map((manga) => manga.id))])
                    }
                    onModeChange={(checked) => {
                        setIsSelectModeActive(checked);

                        if (checked) {
                            handleSelectAll(true, [...new Set(mangas.map((manga) => manga.id))]);
                        } else {
                            tabs.forEach((tab) => handleSelectAll(false, [], tab.id.toString()));
                        }
                    }}
                />
            )}
        </>,
        [isSelectModeActive, areNoItemsSelected, areAllItemsSelected, activeTab, mangas, mangaTitles],
    );

    const handleTabChange = (newTab: number) => {
        setTabSearchParam(newTab);
    };

    if (tabsError != null || librarySizeResponse.error) {
        return (
            <EmptyViewAbsoluteCentered
                message={t`Unable to load data`}
                messageExtra={tabsError?.message ?? librarySizeResponse.error?.message}
                retry={() => {
                    if (tabsError) {
                        refetchCategories().catch(defaultPromiseErrorHandler('Library::refetchCategories'));
                    }

                    if (librarySizeResponse.error) {
                        librarySizeResponse.refetch().catch(defaultPromiseErrorHandler('Library::refetchLibrarySize'));
                    }
                }}
            />
        );
    }

    if (areCategoriesLoading || librarySizeResponse.loading) {
        return <LoadingPlaceholder />;
    }

    if (tabs.length === 0) {
        return <EmptyViewAbsoluteCentered message={t`Your library is empty`} />;
    }

    // prevent tabs from popping in and out while the visible counts of the categories are getting determined
    if (hideEmptyCategories && !areVisibleCountsKnown) {
        return (
            <>
                {visibleCountReporters}
                <LoadingPlaceholder />
            </>
        );
    }

    if (tabs.length === 1) {
        return (
            <Box ref={gestureRef}>
                {visibleCountReporters}
                <PullToRefreshIndicator pullDistance={pullDistance} />
                {triggerGlobalSearchButton}
                <LibraryMangaGrid
                    // the key needs to include filters and query to force a re-render of the virtuoso grid to prevent https://github.com/petyosi/react-virtuoso/issues/1242
                    key={filterKey}
                    mangas={mangas}
                    message={mangaError ? t`Could not load manga` : t`Your library is empty`}
                    messageExtra={mangaError?.message}
                    isLoading={mangaLoading}
                    selectedMangaIds={selectedItemIds}
                    isSelectModeActive={isSelectModeActive}
                    handleSelection={handleSelect}
                    showFilteredOutMessage={!mangaError && showFilteredOutMessage}
                    retry={mangaError && retryFetchCategoryMangas}
                />
                {selectionFab}
            </Box>
        );
    }

    return (
        <TabsWrapper ref={gestureRef} sx={{ overflowX: 'clip' }}>
            {visibleCountReporters}
            {previousTab && (
                <LibraryCategoryPreview key={previousTab.id} ref={previousPreviewRef} category={previousTab} />
            )}
            {nextTab && <LibraryCategoryPreview key={nextTab.id} ref={nextPreviewRef} category={nextTab} />}
            <PullToRefreshIndicator pullDistance={pullDistance} />
            <OffsetComponent>
                <TabsMenu value={activeTab.id} onChange={(e, newTab) => handleTabChange(newTab)}>
                    {tabs.map((tab) => (
                        <Tab
                            sx={{ flexGrow: 1, maxWidth: 'unset' }}
                            key={tab.id}
                            label={
                                <TitleWithSizeTag>
                                    {tab.name}
                                    {showTabSize ? <TitleSizeTag label={getTabCount(tab)} /> : null}
                                </TitleWithSizeTag>
                            }
                            value={tab.id}
                        />
                    ))}
                </TabsMenu>
            </OffsetComponent>
            {triggerGlobalSearchButton}
            <Box ref={panelRef}>
                {tabs.map((tab) => (
                    <TabPanel key={tab.id} index={tab.order} currentIndex={activeTab.order}>
                        {tab === activeTab && (
                            <LibraryMangaGrid
                                // the key needs to include filters and query to force a re-render of the virtuoso grid to prevent https://github.com/petyosi/react-virtuoso/issues/1242
                                key={filterKey}
                                mangas={mangas}
                                message={mangaError ? t`Could not load manga` : t`The category is empty`}
                                messageExtra={mangaError?.message}
                                isLoading={mangaLoading}
                                selectedMangaIds={selectedItemIds}
                                isSelectModeActive={isSelectModeActive}
                                handleSelection={handleSelect}
                                showFilteredOutMessage={!mangaError && showFilteredOutMessage}
                                retry={mangaError && retryFetchCategoryMangas}
                            />
                        )}
                    </TabPanel>
                ))}
            </Box>
            {selectionFab}
        </TabsWrapper>
    );
}
