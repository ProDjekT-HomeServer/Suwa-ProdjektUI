# Suwayomi-WebUI

This is the repository of the default client of [Suwayomi-Server](https://github.com/Suwayomi/Suwayomi-Server).

The server has this web app bundled by default and is able to automatically update to the latest versions.
Thus, there is no need to manually download any builds unless you want to host the app yourself instead of having it hosted by the Suwayomi-Server.

## ProDjekT fork

This fork (branch `release`) is the WebUI of a self-hosted Suwayomi-Server, mainly used as an iPhone PWA.
It is based on the upstream release `v20260929.01` (r3518), matching the server's stable version.

Additions:

- Library: tab counts and hidden empty categories follow the active filters, carousel swiping between categories, pull to refresh updates the whole library
- Browse: carousel swiping between Source / Extension / Migrate
- History: clear the whole history (client side, the server can't reset `lastReadAt`)
- Sources: incognito mode per source (no reading progress / history)
- Source browse: saved searches as a scrollable row next to "Filter"
- Liquid Glass inspired UI (floating glass tab bar, transparent app bar with scroll edge effect, glass sheets/menus)

### Releases

The fork version is `version` in `package.json`. To release, bump it in a `release-X.Y.Z` branch and merge it into
`release`: the `Tag release` GitHub Action tags the merged commit with that version (e.g. `1.0.0`). Existing tags are
not moved. `master` mirrors upstream and is only used to pull in upstream changes.

### Deploying

The server runs with `webUIFlavor = CUSTOM` and serves the build from its `webUI` data directory:

```sh
pnpm exec vite build && echo r3518 > build/revision
# copy build/ into <server data>/webUI and restart the server, it caches index.html
```

## Features

- Library management
    - Library page - manga management
        - Filter/Sort/Search your manga
        - Use categories to categorize your manga
        - Select manga in your library and perform actions (e.g. download, change categories, mark as read, ...) on one or multiple manga
    - Manga page - chapter management
        - Filter/Sort the chapter list
        - Select chapters and perform actions (e.g. download, bookmark, mark as read, ...) on one or multiple manga
    - Select a range of manga/chapters by using shift + left click or long press
    - Overview of duplicated manga in your library (settings > library)
- Reader
    - Desktop and Mobile UI
    - Default settings per reading mode
    - Settings per manga
    - Reading modes (Single/Double Page, Continuous Vertical/Horizontal, Webtoon)
    - Page scale modes (limit by width/height/screen, scale small pages, custom reader width)
    - Image filters
    - Customizable keybinds
    - Auto scrolling
    - Infinite chapter scrolling
    - Option to ignore duplicated chapters while reading
    - Option to automatically download next chapters while reading
    - Option to automatically delete downloaded chapters after reading them
    - ...
- Download queue
- Reading history (**rudimentary**)
- Settings per device (e.g. different reader settings for pc, phone and tablet)
- Sources
    - Migration of manga between sources
    - Hide in library manga while browsing sources
    - Save source searches to easily reuse them
    - Duplication check when adding a new manga to your library
    - Quick add/remove a manga to your library in the source browse (hover with mouse on pc or long press on touch devices)
- App updates
    - Inform about available WebUI and Server updates
    - Inform about successful WebUI and Server updates since the last time the app was used
- Themes
    - Use predefined themes
    - Create your own themes
    - Dynamic theme on manga pages

## Preview

An ongoing changelog of all relevant changes since the last stable release can be found [here](https://github.com/Suwayomi/Suwayomi-WebUI/blob/master/CHANGELOG.md)

To use the preview version you can select the PREVIEW channel in the settings of your Suwayomi-Server.
The server is then able to download and also keep the version automatically up-to-date.

Keep in mind that the preview version might need a newer version than the stable server.
In case your server is outdated, it will automatically downgrade to the latest compatible WebUI version.

Minified builds of WebUI can be found here [Suwayomi-WebUI-preview](https://github.com/Suwayomi/Suwayomi-WebUI-preview).

Additionally, there is an online build of the WebUI preview version that is available [here](https://suwayomi-webui-preview.github.io/).
_Make sure to set your Suwayomi-Server hostname in Settings or you'll get infinite loading._ Also note that its the **latest** revision of WebUI and might not work correctly if you connect to a stable build of Suwayomi-Server.

## Contributing and Technical info

See [CONTRIBUTING.md](./CONTRIBUTING.md).

## Translation

Feel free to translate the project on [Weblate](https://hosted.weblate.org/projects/suwayomi/suwayomi-webui/)

<details><summary>Translation Progress</summary>
<a href="https://hosted.weblate.org/engage/suwayomi-webui/">
<img src="https://hosted.weblate.org/widgets/suwayomi/-/suwayomi-webui/multi-auto.svg" alt="Translation status" />
</a>
</details>

## License

    Copyright (C) Contributors to the Suwayomi project

    This Source Code Form is subject to the terms of the Mozilla Public
    License, v. 2.0. If a copy of the MPL was not distributed with this
    file, You can obtain one at http://mozilla.org/MPL/2.0/.
