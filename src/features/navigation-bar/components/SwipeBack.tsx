/*
 * Copyright (C) Contributors to the Suwayomi project
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

import { useEffect, useRef, useState } from 'react';
import Box from '@mui/material/Box';
import { useTheme } from '@mui/material/styles';
import ArrowBack from '@mui/icons-material/ArrowBack';
import { useBackButton } from '@/base/hooks/useBackButton.ts';
import { useIsMainRoute } from '@/features/navigation-bar/hooks/useIsMainRoute.ts';
import { liquidGlass } from '@/features/theme/LiquidGlass.ts';

const AXIS_LOCK_DISTANCE = 10;
const COMMIT_DISTANCE = 90;
/** px per ms */
const COMMIT_VELOCITY = 0.5;
const MIN_FLING_DISTANCE = 30;
const INDICATOR_SIZE = 40;
const INDICATOR_MAX_OFFSET = 56;
// in the browser, touches at the screen edge trigger the native back navigation
const SCREEN_EDGE_DEAD_ZONE = 24;
// elements that handle horizontal touches themselves
const IGNORE_SELECTOR = '[role="tablist"], [role="dialog"], .MuiModal-root, .MuiSlider-root, input, textarea';

const isStandalone = () =>
    window.matchMedia('(display-mode: standalone)').matches ||
    !!(window.navigator as Navigator & { standalone?: boolean }).standalone;

const canScrollLeft = (target: EventTarget | null): boolean => {
    let element = target instanceof Element ? target : null;
    while (element && element !== document.documentElement) {
        if (element.scrollLeft > 0 && element.scrollWidth > element.clientWidth) {
            return true;
        }
        element = element.parentElement;
    }
    return false;
};

/**
 * Swiping to the right navigates back, the same as the back button of the app bar.
 *
 * iOS has no edge swipe navigation for installed web apps, thus, this replaces it.
 * Disabled on the pages of the navigation bar, which have no back button (the library and browse swipe between their tabs).
 */
export const SwipeBack = () => {
    const theme = useTheme();
    const isMainRoute = useIsMainRoute();
    const handleBack = useBackButton();

    const [gesture, setGesture] = useState<{ dx: number; y: number } | null>(null);

    const handleBackRef = useRef(handleBack);
    handleBackRef.current = handleBack;

    useEffect(() => {
        if (isMainRoute) {
            return () => {};
        }

        let state: {
            startX: number;
            startY: number;
            isLocked: boolean;
            lastX: number;
            lastMoveTime: number;
            velocityX: number;
        } | null = null;

        const handleTouchStart = (e: TouchEvent) => {
            const [touch] = e.touches;

            const isMultiTouch = e.touches.length > 1;
            const isAtScreenEdge = !isStandalone() && touch.clientX < SCREEN_EDGE_DEAD_ZONE;
            const isIgnoredTarget = e.target instanceof Element && !!e.target.closest(IGNORE_SELECTOR);

            if (isMultiTouch || isAtScreenEdge || isIgnoredTarget || canScrollLeft(e.target)) {
                state = null;
                return;
            }

            state = {
                startX: touch.clientX,
                startY: touch.clientY,
                isLocked: false,
                lastX: touch.clientX,
                lastMoveTime: e.timeStamp,
                velocityX: 0,
            };
        };

        const handleTouchMove = (e: TouchEvent) => {
            if (!state) {
                return;
            }

            if (e.touches.length > 1) {
                state = null;
                setGesture(null);
                return;
            }

            const [touch] = e.touches;
            const dx = touch.clientX - state.startX;
            const dy = touch.clientY - state.startY;

            if (!state.isLocked) {
                if (Math.max(Math.abs(dx), Math.abs(dy)) < AXIS_LOCK_DISTANCE) {
                    return;
                }

                const isSwipeToTheRight = dx > 0 && Math.abs(dx) > Math.abs(dy) * 1.5;
                if (!isSwipeToTheRight) {
                    state = null;
                    return;
                }

                state.isLocked = true;
            }

            const timeDelta = e.timeStamp - state.lastMoveTime;
            if (timeDelta > 0) {
                state.velocityX = (touch.clientX - state.lastX) / timeDelta;
            }
            state.lastX = touch.clientX;
            state.lastMoveTime = e.timeStamp;

            // prevents the page from scrolling vertically while swiping
            e.preventDefault();
            setGesture({ dx: Math.max(0, dx), y: state.startY });
        };

        const handleTouchEnd = () => {
            if (!state?.isLocked) {
                state = null;
                return;
            }

            const dx = state.lastX - state.startX;
            const isFling = state.velocityX > COMMIT_VELOCITY && dx > MIN_FLING_DISTANCE;

            state = null;
            setGesture(null);

            if (dx > COMMIT_DISTANCE || isFling) {
                handleBackRef.current();
            }
        };

        const handleTouchCancel = () => {
            state = null;
            setGesture(null);
        };

        document.addEventListener('touchstart', handleTouchStart, { passive: true });
        document.addEventListener('touchmove', handleTouchMove, { passive: false });
        document.addEventListener('touchend', handleTouchEnd, { passive: true });
        document.addEventListener('touchcancel', handleTouchCancel, { passive: true });

        return () => {
            document.removeEventListener('touchstart', handleTouchStart);
            document.removeEventListener('touchmove', handleTouchMove);
            document.removeEventListener('touchend', handleTouchEnd);
            document.removeEventListener('touchcancel', handleTouchCancel);
            setGesture(null);
        };
    }, [isMainRoute]);

    if (!gesture) {
        return null;
    }

    const progress = Math.min(gesture.dx / COMMIT_DISTANCE, 1);
    const isThresholdReached = progress === 1;

    return (
        <Box
            sx={{
                ...liquidGlass(theme),
                position: 'fixed',
                top: gesture.y - INDICATOR_SIZE / 2,
                left: 0,
                zIndex: 'modal',
                width: INDICATOR_SIZE,
                height: INDICATOR_SIZE,
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                pointerEvents: 'none',
                opacity: progress,
                transform: `translateX(${progress * INDICATOR_MAX_OFFSET - INDICATOR_SIZE}px)`,
            }}
        >
            <ArrowBack color={isThresholdReached ? 'primary' : 'inherit'} />
        </Box>
    );
};
