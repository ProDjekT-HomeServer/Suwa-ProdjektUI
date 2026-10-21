/*
 * Copyright (C) Contributors to the Suwayomi project
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

import { CombinedGraphQLErrors } from '@apollo/client';
import type { ReactNode } from 'react';
import { makeToast } from '@/base/utils/Toast.ts';
import { t } from '@lingui/core/macro';
import DOMPurify from 'dompurify';
import { marked } from 'marked';

export const jsonSaveParse = <T = any>(...args: Parameters<typeof JSON.parse>): T | null => {
    try {
        return JSON.parse(...args);
    } catch (e) {
        return null;
    }
};

export const getErrorMessage = (error: unknown): string => {
    if (error instanceof Error || CombinedGraphQLErrors.is(error)) {
        return error.message;
    }

    if (error == null) {
        return '';
    }

    return `${error}`;
};

export const getValueFromObject = <T>(obj: Record<string, any>, key: string): T => {
    const keys = key.split('.');

    return keys.reduce((acc, curr) => acc?.[curr], obj) as T;
};

export const coerceIn = (value: number, min: number, max: number = value): number =>
    Math.max(Math.min(value, max), min);

export const noOp = () => {};

const GRAPHQL_EXCEPTION_MESSAGE_REGEX = /(.*Exception while fetching data \(.*\) : .*)\r\n\r\n(.*)/s;
export const extractGraphqlExceptionInfo = (
    error: ReactNode | string,
): {
    isGraphqlException: boolean;
    graphqlError?: string;
    graphqlStackTrace?: string;
} => {
    if (typeof error !== 'string') {
        return { isGraphqlException: false };
    }

    const regexMatch = error.match(GRAPHQL_EXCEPTION_MESSAGE_REGEX);

    const isGraphqlException = !!regexMatch;
    if (!isGraphqlException) {
        return { isGraphqlException: false };
    }

    const [, message, stackTrace] = regexMatch;
    return {
        isGraphqlException: true,
        graphqlError: message,
        graphqlStackTrace: stackTrace,
    };
};

export const getNextRotationValue = <Value>(
    indexOfValue: number,
    values: Value[],
    isDefaultable?: boolean,
): Value | undefined => {
    const nextValueIndex = (indexOfValue + 1) % values.length;
    const wasLastValue = nextValueIndex === 0;

    const isDefaultNextValue = !!isDefaultable && wasLastValue;
    if (isDefaultNextValue) {
        return undefined;
    }

    return values[(indexOfValue + 1) % values.length];
};

export const maybeExecuteWithDelay = (
    action: () => void,
    delay: number,
    condition: boolean,
): NodeJS.Timeout | undefined => {
    if (condition) {
        return setTimeout(() => action(), delay);
    }

    action();
    return undefined;
};

/**
 * The clipboard api is only available in secure contexts (https, localhost), thus, it is missing when accessing the
 * server via http and its ip address.
 * The deprecated "copy" command still works there, as long as it gets executed during a user activation.
 */
const copyViaCommand = (text: string) => {
    const textArea = document.createElement('textarea');
    textArea.value = text;
    textArea.readOnly = true;
    // prevents scrolling to the element and zooming into it on iOS
    textArea.style.cssText = 'position: fixed; top: 0; left: 0; opacity: 0; font-size: 16px;';
    document.body.appendChild(textArea);

    try {
        textArea.select();
        // iOS ignores "select()"
        textArea.setSelectionRange(0, text.length);

        if (!document.execCommand('copy')) {
            throw new Error('The "copy" command is not supported');
        }
    } finally {
        textArea.remove();
    }
};

export const isClipboardSupported = (): boolean => !!navigator.clipboard || !!document.queryCommandSupported?.('copy');

export const copyToClipboard = async (text: string) => {
    try {
        if (navigator.clipboard) {
            await navigator.clipboard.writeText(text);
        } else {
            copyViaCommand(text);
        }
        makeToast(t`Copied to clipboard`, 'info');
    } catch (e) {
        makeToast(t`Could not copy to clipboard`, 'error', getErrorMessage(e));
    }
};

export const getRenderedText = (el: HTMLElement, cssText: string) => {
    const clone = el.cloneNode(true) as HTMLElement;

    const rect = el.getBoundingClientRect();

    clone.style.cssText = `
    position: absolute;
    left: -99999px;
    top: 0;
    visibility: visible;
    display: block;
    height: auto;
    max-height: none;
    overflow: visible;
    width: ${rect.width}px;
    ${cssText}
  `;

    document.body.appendChild(clone);
    const text = clone.innerText;
    clone.remove();

    return text;
};

export const markdownToSafeHtml = (markdown: string): string => {
    const html = marked.parse(markdown, {
        async: false,
        breaks: true,
    });

    return DOMPurify.sanitize(html, {
        USE_PROFILES: {
            html: true,
        },
    });
};
