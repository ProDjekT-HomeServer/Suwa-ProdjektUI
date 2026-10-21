/*
 * Copyright (C) Contributors to the Suwayomi project
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

import Tab from '@mui/material/Tab';
import { StringParam, useQueryParam } from 'use-query-params';
import { useLingui } from '@lingui/react/macro';
import { Sources } from '@/features/browse/sources/Sources.tsx';
import { Extensions } from '@/features/browse/extensions/Extensions.tsx';
import { TabPanel } from '@/base/components/tabs/TabPanel.tsx';
import { TabsWrapper } from '@/base/components/tabs/TabsWrapper.tsx';
import { TabsMenu } from '@/base/components/tabs/TabsMenu.tsx';
import { useAppTitle } from '@/features/navigation-bar/hooks/useAppTitle.ts';
import { BrowseTab } from '@/features/browse/Browse.types.ts';
import { GROUPED_VIRTUOSO_Z_INDEX } from '@/lib/virtuoso/Virtuoso.constants.ts';
import { SearchParam } from '@/base/Base.types.ts';
import { Migration } from '@/features/migration/screens/Migration.tsx';
import { OffsetComponentWithContainer } from '@/base/OffsetComponent.tsx';
import { useElementSize } from '@mantine/hooks';
import Box from '@mui/material/Box';
import type { ReactNode } from 'react';
import { TabPreview } from '@/base/components/tabs/TabPreview.tsx';
import { useTabSwipe } from '@/base/hooks/useTabSwipe.ts';
import { useTouchGestures } from '@/base/hooks/useTouchGestures.ts';
import { MigrationSelectSource } from '@/features/migration/screens/MigrationSelectSource.tsx';

const SWIPEABLE_TABS = [BrowseTab.SOURCES, BrowseTab.EXTENSIONS, BrowseTab.MIGRATE] as const;
type SwipeableTab = (typeof SWIPEABLE_TABS)[number];

export function Browse() {
    const { t } = useLingui();
    useAppTitle(t`Browse`);

    const { ref: tabsMenuRef, height: tabsMenuHeight } = useElementSize();

    const [tabSearchParam, setTabSearchParam] = useQueryParam(SearchParam.TAB, StringParam, {});
    const tabName = (tabSearchParam as BrowseTab) ?? BrowseTab.SOURCES;

    if (!tabSearchParam) {
        setTabSearchParam(tabName, 'replaceIn');
    }

    const swipeableTabName = tabName === BrowseTab.SOURCE_DEPRECATED ? BrowseTab.SOURCES : tabName;
    const activeTabIndex = SWIPEABLE_TABS.indexOf(swipeableTabName as SwipeableTab);
    const previousTab = activeTabIndex > 0 ? SWIPEABLE_TABS[activeTabIndex - 1] : undefined;
    const nextTab = activeTabIndex >= 0 ? SWIPEABLE_TABS[activeTabIndex + 1] : undefined;

    const { panelRef, previousPreviewRef, nextPreviewRef, gestureHandlers } = useTabSwipe({
        activeTabId: tabName,
        previousTabId: previousTab,
        nextTabId: nextTab,
        onTabChange: (newTab) => setTabSearchParam(newTab, 'replaceIn'),
    });
    const { ref: gestureRef } = useTouchGestures({
        ...gestureHandlers,
        ignoreSelector: '[role="tablist"]',
    });

    const renderPreview = (tab: SwipeableTab): ReactNode => {
        switch (tab) {
            case BrowseTab.SOURCES:
                return <Sources tabsMenuHeight={tabsMenuHeight} />;
            case BrowseTab.EXTENSIONS:
                return <Extensions tabsMenuHeight={tabsMenuHeight} />;
            case BrowseTab.MIGRATE:
                // the migration screen has global side effects (e.g. navigation), only its first step is safe to preview
                return <MigrationSelectSource />;
            default:
                return null;
        }
    };

    return (
        <TabsWrapper ref={gestureRef} sx={{ overflowX: 'clip' }}>
            <OffsetComponentWithContainer
                sx={{ zIndex: 2 }}
                component={
                    <TabsMenu
                        ref={tabsMenuRef}
                        sx={{ zIndex: GROUPED_VIRTUOSO_Z_INDEX }}
                        variant="fullWidth"
                        value={tabName}
                        onChange={(_, newTab) => setTabSearchParam(newTab, 'replaceIn')}
                    >
                        <Tab value={BrowseTab.SOURCES} sx={{ textTransform: 'none' }} label={t`Source`} />
                        <Tab value={BrowseTab.EXTENSIONS} sx={{ textTransform: 'none' }} label={t`Extension`} />
                        <Tab value={BrowseTab.MIGRATE} sx={{ textTransform: 'none' }} label={t`Migrate`} />
                    </TabsMenu>
                }
            >
                {previousTab && (
                    <TabPreview key={previousTab} ref={previousPreviewRef}>
                        {renderPreview(previousTab)}
                    </TabPreview>
                )}
                {nextTab && (
                    <TabPreview key={nextTab} ref={nextPreviewRef}>
                        {renderPreview(nextTab)}
                    </TabPreview>
                )}
                <Box ref={panelRef}>
                    <TabPanel index={BrowseTab.SOURCE_DEPRECATED} currentIndex={tabName}>
                        <Sources tabsMenuHeight={tabsMenuHeight} />
                    </TabPanel>
                    <TabPanel index={BrowseTab.SOURCES} currentIndex={tabName}>
                        <Sources tabsMenuHeight={tabsMenuHeight} />
                    </TabPanel>
                    <TabPanel index={BrowseTab.EXTENSIONS} currentIndex={tabName}>
                        <Extensions tabsMenuHeight={tabsMenuHeight} />
                    </TabPanel>
                    <TabPanel index={BrowseTab.MIGRATE} currentIndex={tabName}>
                        <Migration />
                    </TabPanel>
                </Box>
            </OffsetComponentWithContainer>
        </TabsWrapper>
    );
}
