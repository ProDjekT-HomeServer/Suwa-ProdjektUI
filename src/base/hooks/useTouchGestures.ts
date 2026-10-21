/*
 * Copyright (C) Contributors to the Suwayomi project
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

import { useEffect, useRef, useState } from 'react';

const AXIS_LOCK_DISTANCE = 10;
// touches starting this close to the screen edge are left to the browser (e.g. iOS back navigation)
const SCREEN_EDGE_DEAD_ZONE = 24;
const PULL_RESISTANCE = 0.5;

export const PULL_TO_REFRESH_THRESHOLD = 80;
const PULL_MAX_DISTANCE = PULL_TO_REFRESH_THRESHOLD * 1.5;

type Axis = 'x' | 'y';

type GestureState = {
    startX: number;
    startY: number;
    axis: Axis | null;
    isAtTop: boolean;
    pullDistance: number;
    lastX: number;
    lastMoveTime: number;
    /** px per ms, positive when moving to the right */
    velocityX: number;
};

export type TouchGestureOptions = {
    onHorizontalDragStart?: () => void;
    /** called for every move; dx is the distance from the touch start, positive when moving to the right */
    onHorizontalDrag?: (dx: number) => void;
    onHorizontalDragEnd?: (dx: number, velocityX: number) => void;
    onPullDown?: () => void;
    disabled?: boolean;
    /** touches starting inside an element matching this selector are ignored (e.g. horizontally scrollable tabs) */
    ignoreSelector?: string;
};

/**
 * Horizontal drag and "pull down to refresh" detection for elements inside a window scroll container.
 *
 * Returns a callback ref for the element to observe and the current pull distance in px,
 * which can be used to render a pull indicator.
 *
 * The horizontal drag is reported via callbacks instead of state to allow updating the DOM on every frame without
 * having to re-render.
 */
export const useTouchGestures = (
    options: TouchGestureOptions,
): { ref: (element: HTMLElement | null) => void; pullDistance: number } => {
    const [element, setElement] = useState<HTMLElement | null>(null);
    const [pullDistance, setPullDistance] = useState(0);

    const optionsRef = useRef(options);
    optionsRef.current = options;

    useEffect(() => {
        if (!element || options.disabled) {
            return () => {};
        }

        let state: GestureState | null = null;

        const updatePullDistance = (distance: number) => {
            if (state) {
                state.pullDistance = distance;
            }
            setPullDistance(distance);
        };

        const handleTouchStart = (e: TouchEvent) => {
            const [touch] = e.touches;
            const { ignoreSelector } = optionsRef.current;

            const isMultiTouch = e.touches.length > 1;
            const isAtScreenEdge =
                touch.clientX < SCREEN_EDGE_DEAD_ZONE || touch.clientX > window.innerWidth - SCREEN_EDGE_DEAD_ZONE;
            const isIgnoredTarget =
                !!ignoreSelector && e.target instanceof Element && !!e.target.closest(ignoreSelector);

            if (isMultiTouch || isAtScreenEdge || isIgnoredTarget) {
                state = null;
                return;
            }

            state = {
                startX: touch.clientX,
                startY: touch.clientY,
                axis: null,
                isAtTop: window.scrollY <= 0,
                pullDistance: 0,
                lastX: touch.clientX,
                lastMoveTime: e.timeStamp,
                velocityX: 0,
            };
        };

        const handleTouchMove = (e: TouchEvent) => {
            if (!state) {
                return;
            }

            const [touch] = e.touches;
            const dx = touch.clientX - state.startX;
            const dy = touch.clientY - state.startY;

            if (!state.axis) {
                if (Math.max(Math.abs(dx), Math.abs(dy)) < AXIS_LOCK_DISTANCE) {
                    return;
                }

                state.axis = Math.abs(dx) > Math.abs(dy) ? 'x' : 'y';

                if (state.axis === 'x') {
                    optionsRef.current.onHorizontalDragStart?.();
                }
            }

            if (state.axis === 'x') {
                const timeDelta = e.timeStamp - state.lastMoveTime;
                if (timeDelta > 0) {
                    state.velocityX = (touch.clientX - state.lastX) / timeDelta;
                }
                state.lastX = touch.clientX;
                state.lastMoveTime = e.timeStamp;

                // prevents the page from scrolling vertically while dragging horizontally
                e.preventDefault();
                optionsRef.current.onHorizontalDrag?.(dx);
                return;
            }

            const isPulling = state.axis === 'y' && state.isAtTop && !!optionsRef.current.onPullDown;
            if (!isPulling) {
                return;
            }

            if (dy <= 0) {
                updatePullDistance(0);
                return;
            }

            // prevents the native overscroll bounce/reload while pulling
            e.preventDefault();
            updatePullDistance(Math.min(dy * PULL_RESISTANCE, PULL_MAX_DISTANCE));
        };

        const handleTouchEnd = (e: TouchEvent) => {
            if (!state) {
                return;
            }

            const { axis, startX, lastX, velocityX, pullDistance: finalPullDistance } = state;
            const dx = (e.changedTouches[0]?.clientX ?? lastX) - startX;
            const { onHorizontalDragEnd, onPullDown } = optionsRef.current;

            if (axis === 'x') {
                onHorizontalDragEnd?.(dx, velocityX);
            }

            if (axis === 'y' && finalPullDistance >= PULL_TO_REFRESH_THRESHOLD) {
                onPullDown?.();
            }

            if (finalPullDistance) {
                setPullDistance(0);
            }
            state = null;
        };

        const handleTouchCancel = () => {
            if (state?.axis === 'x') {
                optionsRef.current.onHorizontalDragEnd?.(0, 0);
            }

            state = null;
            setPullDistance(0);
        };

        element.addEventListener('touchstart', handleTouchStart, { passive: true });
        element.addEventListener('touchmove', handleTouchMove, { passive: false });
        element.addEventListener('touchend', handleTouchEnd, { passive: true });
        element.addEventListener('touchcancel', handleTouchCancel, { passive: true });

        return () => {
            element.removeEventListener('touchstart', handleTouchStart);
            element.removeEventListener('touchmove', handleTouchMove);
            element.removeEventListener('touchend', handleTouchEnd);
            element.removeEventListener('touchcancel', handleTouchCancel);
        };
    }, [element, options.disabled]);

    return { ref: setElement, pullDistance };
};
