/*
 * Copyright (C) Contributors to the Suwayomi project
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

import type { RefObject } from 'react';
import { useEffect, useLayoutEffect, useRef } from 'react';
import type { TouchGestureOptions } from '@/base/hooks/useTouchGestures.ts';

const SETTLE_DURATION_MS = 220;
const COMMIT_DISTANCE_RATIO = 0.3;
/** px per ms */
const COMMIT_VELOCITY = 0.4;
/** applied when dragging towards a side without a category */
const EDGE_RESISTANCE = 0.25;

type TabId = string | number;

/**
 * Carousel like swiping between tabs.
 *
 * While dragging, the current tab follows the finger and the preview of the adjacent tab slides in.
 * The DOM gets updated directly to prevent re-rendering the screen on every frame.
 *
 * The previews are expected to be rendered via "TabPreview".
 */
export const useTabSwipe = <Id extends TabId>({
    activeTabId,
    previousTabId,
    nextTabId,
    onTabChange,
}: {
    activeTabId: Id | undefined;
    previousTabId: Id | undefined;
    nextTabId: Id | undefined;
    onTabChange: (tabId: Id) => void;
}): {
    panelRef: RefObject<HTMLDivElement | null>;
    previousPreviewRef: RefObject<HTMLDivElement | null>;
    nextPreviewRef: RefObject<HTMLDivElement | null>;
    gestureHandlers: Pick<TouchGestureOptions, 'onHorizontalDragStart' | 'onHorizontalDrag' | 'onHorizontalDragEnd'>;
} => {
    const panelRef = useRef<HTMLDivElement>(null);
    const previousPreviewRef = useRef<HTMLDivElement>(null);
    const nextPreviewRef = useRef<HTMLDivElement>(null);

    const panelWidth = useRef(0);
    const settleTimeout = useRef<ReturnType<typeof setTimeout>>(undefined);
    const animationFrame = useRef<number>(undefined);
    const pendingOffset = useRef(0);

    const latestProps = useRef({ previousTabId, nextTabId, onTabChange });
    latestProps.current = { previousTabId, nextTabId, onTabChange };

    const applyOffset = (offset: number, animate: boolean) => {
        if (animationFrame.current !== undefined) {
            cancelAnimationFrame(animationFrame.current);
            animationFrame.current = undefined;
        }

        const width = panelWidth.current;
        const elementsWithBaseOffset: [HTMLDivElement | null, number][] = [
            [panelRef.current, 0],
            [previousPreviewRef.current, -width],
            [nextPreviewRef.current, width],
        ];

        elementsWithBaseOffset.forEach(([element, baseOffset]) => {
            if (!element) {
                return;
            }

            const { style } = element;
            const actualOffset = offset + baseOffset;
            style.transition = animate ? `transform ${SETTLE_DURATION_MS}ms ease-out` : 'none';
            // a transform creates a new containing block for fixed descendants, thus, it gets removed when not needed
            style.transform = actualOffset ? `translate3d(${actualOffset}px, 0, 0)` : '';
        });
    };

    /**
     * Touch events are not synced with the display refresh, thus, the offset is only applied once per frame.
     */
    const scheduleOffset = (offset: number) => {
        pendingOffset.current = offset;

        if (animationFrame.current !== undefined) {
            return;
        }

        animationFrame.current = requestAnimationFrame(() => {
            animationFrame.current = undefined;
            applyOffset(pendingOffset.current, false);
        });
    };

    const setIsCompositingLayer = (isLayer: boolean) => {
        [panelRef.current, previousPreviewRef.current, nextPreviewRef.current].forEach((element) => {
            if (element) {
                const { style } = element;
                // moving the elements on the gpu prevents repainting the whole grid on every frame
                style.willChange = isLayer ? 'transform' : '';
            }
        });
    };

    const hidePreviews = () => {
        setIsCompositingLayer(false);
        [previousPreviewRef.current, nextPreviewRef.current].forEach((element) => {
            if (element) {
                const { style } = element;
                style.visibility = 'hidden';
            }
        });
    };

    const reset = () => {
        clearTimeout(settleTimeout.current);
        applyOffset(0, false);
        hidePreviews();
    };

    // the new tab is rendered, thus, the previews can be replaced by it
    useLayoutEffect(reset, [activeTabId]);
    useEffect(
        () => () => {
            clearTimeout(settleTimeout.current);
            if (animationFrame.current !== undefined) {
                cancelAnimationFrame(animationFrame.current);
            }
        },
        [],
    );

    const getOffset = (dx: number): number => {
        const hasTargetTab = dx > 0 ? latestProps.current.previousTabId != null : latestProps.current.nextTabId != null;
        return hasTargetTab ? dx : dx * EDGE_RESISTANCE;
    };

    return {
        panelRef,
        previousPreviewRef,
        nextPreviewRef,
        gestureHandlers: {
            onHorizontalDragStart: () => {
                clearTimeout(settleTimeout.current);

                const panel = panelRef.current;
                if (!panel) {
                    return;
                }

                // the panel itself might be offset by a previous drag, thus, the transform needs to be ignored
                panel.style.transform = '';
                const panelRect = panel.getBoundingClientRect();
                const tabsBottom = document.querySelector('[role="tablist"]')?.getBoundingClientRect().bottom ?? 0;
                const top = Math.max(panelRect.top, tabsBottom);

                panelWidth.current = panelRect.width;
                setIsCompositingLayer(true);

                [previousPreviewRef.current, nextPreviewRef.current].forEach((element) => {
                    if (!element) {
                        return;
                    }

                    const { style } = element;
                    style.top = `${top}px`;
                    style.left = `${panelRect.left}px`;
                    style.width = `${panelRect.width}px`;
                    style.height = `${window.innerHeight - top}px`;
                    style.visibility = 'visible';
                });
            },
            onHorizontalDrag: (dx) => scheduleOffset(getOffset(dx)),
            onHorizontalDragEnd: (dx, velocityX) => {
                const { previousTabId: previousId, nextTabId: nextId, onTabChange: changeTab } = latestProps.current;
                const targetTabId = dx > 0 ? previousId : nextId;

                const isFlick = Math.abs(velocityX) >= COMMIT_VELOCITY && Math.sign(velocityX) === Math.sign(dx);
                const isFarEnough = Math.abs(dx) >= panelWidth.current * COMMIT_DISTANCE_RATIO;
                const shouldChangeTab = targetTabId != null && dx !== 0 && (isFlick || isFarEnough);

                if (!shouldChangeTab) {
                    applyOffset(0, true);
                    settleTimeout.current = setTimeout(hidePreviews, SETTLE_DURATION_MS);
                    return;
                }

                applyOffset(Math.sign(dx) * panelWidth.current, true);
                settleTimeout.current = setTimeout(() => {
                    // the preview shows the start of the tab
                    window.scrollTo(0, 0);
                    changeTab(targetTabId);
                }, SETTLE_DURATION_MS);
            },
        },
    };
};
