/*
 * Copyright (C) Contributors to the Suwayomi project
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

import type { MutableRefObject } from 'react';
import { useEffect, useLayoutEffect, useRef, useState } from 'react';

const ZOOM_FACTOR = 2;
const DOUBLE_TAP_TIMEOUT = 250;
const DOUBLE_TAP_MAX_DISTANCE = 40;

type PendingTap = { timeout: ReturnType<typeof setTimeout>; x: number; y: number; fire: () => void };
type ZoomAnchor = { element: HTMLElement; relativeX: number; relativeY: number; x: number; y: number };

const getDirectChild = (scrollElement: HTMLElement, target: EventTarget | null): HTMLElement | null => {
    let element = target instanceof HTMLElement ? target : null;
    while (element && element.parentElement !== scrollElement) {
        element = element.parentElement;
    }
    return element;
};

/**
 * Double tapping zooms into the tapped point, double tapping again zooms back out.
 *
 * The zoom gets applied via the css "zoom" property of the viewers children, which, in contrast to a transform, changes
 * the layout, thus, the scroll element allows to pan the zoomed in pages via native scrolling.
 *
 * To be able to detect a double tap, single taps get delayed.
 */
export const useReaderDoubleTapZoom = (scrollElementRef: MutableRefObject<HTMLElement | null>, resetKey: unknown) => {
    const [zoom, setZoom] = useState(1);
    const pendingTap = useRef<PendingTap | null>(null);
    const anchor = useRef<ZoomAnchor | null>(null);

    // keep the tapped point at the same position on the screen
    useLayoutEffect(() => {
        const scrollElement = scrollElementRef.current;
        const zoomAnchor = anchor.current;
        anchor.current = null;

        if (!scrollElement || !zoomAnchor) {
            return;
        }

        const rect = zoomAnchor.element.getBoundingClientRect();
        scrollElement.scrollBy({
            left: rect.left + zoomAnchor.relativeX * rect.width - zoomAnchor.x,
            top: rect.top + zoomAnchor.relativeY * rect.height - zoomAnchor.y,
            behavior: 'instant',
        });
    }, [zoom]);

    useEffect(() => setZoom(1), [resetKey]);

    useEffect(() => () => clearTimeout(pendingTap.current?.timeout), []);

    const toggleZoom = (target: EventTarget | null, x: number, y: number) => {
        const scrollElement = scrollElementRef.current;
        const element = scrollElement ? getDirectChild(scrollElement, target) : null;

        if (element) {
            const rect = element.getBoundingClientRect();
            anchor.current = {
                element,
                relativeX: (x - rect.left) / rect.width,
                relativeY: (y - rect.top) / rect.height,
                x,
                y,
            };
        }

        setZoom((prevZoom) => (prevZoom === 1 ? ZOOM_FACTOR : 1));
    };

    const handleTap = (e: React.MouseEvent, onSingleTap: (x: number, y: number) => void) => {
        const { clientX, clientY, target } = e;
        const previousTap = pendingTap.current;
        pendingTap.current = null;

        if (previousTap) {
            clearTimeout(previousTap.timeout);

            const isDoubleTap = Math.hypot(previousTap.x - clientX, previousTap.y - clientY) <= DOUBLE_TAP_MAX_DISTANCE;
            if (isDoubleTap) {
                toggleZoom(target, clientX, clientY);
                return;
            }

            previousTap.fire();
        }

        const fire = () => onSingleTap(clientX, clientY);
        pendingTap.current = {
            timeout: setTimeout(() => {
                pendingTap.current = null;
                fire();
            }, DOUBLE_TAP_TIMEOUT),
            x: clientX,
            y: clientY,
            fire,
        };
    };

    return { zoom, isZoomed: zoom !== 1, handleTap };
};
