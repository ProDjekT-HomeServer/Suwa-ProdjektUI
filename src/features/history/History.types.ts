/*
 * Copyright (C) Contributors to the Suwayomi project
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

export type MetadataHistorySettings = {
    hideHistory: boolean;
    /**
     * Epoch seconds; chapters read at or before this point are hidden from the history.
     * The server does not support resetting "lastReadAt", thus, clearing the history is done client side.
     */
    historyClearedAt: number;
    incognitoSourceIds: string[];
};
