# rcps.app

**Table of Contents:**

1. [Stack](#stack)
2. [Setup](#setup)
3. [Features](#features)
4. [TODOs](#todos)
5. [Deployment checklist](#deployment-checklist)

## Stack

- [Vue.js](https://vuejs.org) (Progressive web app frontend)
- [Dexie.js](https://dexie.org/) (Local-first database)
- [PocketBase](https://pocketbase.io) (Sync server and user authentication)

## Setup

### Recommended IDE Setup

[VS Code](https://code.visualstudio.com/) + [Vue (Official)](https://marketplace.visualstudio.com/items?itemName=Vue.volar) (and disable Vetur).

### Recommended Browser Setup

- Chromium-based browsers (Chrome, Edge, Brave, etc.):
  - [Vue.js devtools](https://chromewebstore.google.com/detail/vuejs-devtools/nhdogjmejiglipccpnnnanhbledajbpd)
  - [Turn on Custom Object Formatter in Chrome DevTools](http://bit.ly/object-formatters)
- Firefox:
  - [Vue.js devtools](https://addons.mozilla.org/en-US/firefox/addon/vue-js-devtools/)
  - [Turn on Custom Object Formatter in Firefox DevTools](https://fxdx.dev/firefox-devtools-custom-object-formatters/)

### Type Support for `.vue` Imports in TS

TypeScript cannot handle type information for `.vue` imports by default, so we replace the `tsc` CLI with `vue-tsc` for type checking. In editors, we need [Volar](https://marketplace.visualstudio.com/items?itemName=Vue.volar) to make the TypeScript language service aware of `.vue` types.

### Customize configuration

See [Vite Configuration Reference](https://vite.dev/config/).

### Project Setup

```sh
npm install
```

#### Compile and Hot-Reload for Development

```sh
npm run dev
```

#### Type-Check, Compile and Minify for Production

```sh
npm run build
```

#### Run Unit Tests with [Vitest](https://vitest.dev/)

```sh
npm run test:unit
```

#### Run End-to-End Tests with [Cypress](https://www.cypress.io/)

```sh
npm run test:e2e:dev
```

This runs the end-to-end tests against the Vite development server.
It is much faster than the production build.

But it's still recommended to test the production build with `test:e2e` before deploying (e.g. in CI environments):

```sh
npm run build
npm run test:e2e
```

#### Lint with [ESLint](https://eslint.org/)

```sh
npm run lint
```

#### Start the PocketBase server

```sh
./pocketbase serve
```

#### Update the PocketBase binary

**(Please update current version manually in package.json under dependencies.)**

```sh
./pocketbase update
```

## Features

### MVP

- Basic user accounts
- Local data persistence and server sync
- Card views for browsing tags and recipes
- Recipe view for creating, viewing, editing and deleting single recipes
- Importing recipes from screenshots/photos, workflow:
  1. Select screenshots/photos from gallery (view with large buttons and icons prompting user to choose one for ingredients and one for instructions)
  2. Crop both images in one view (types indicated by the icons from step 1)  
     Images are then scanned with OCR (executed on client via Tesseract.js or similar)
  3. Check imported data (quick-correct view with larger monospace font and common OCR errors highlighted)
- Settings view
  - Dark/light theme switch
  - Accent color selection (based on dark/light theme)
  - Tags (view, add, edit, delete)
  - Language (automatic or manual locale selection)

### Planned

(sorted by urgency in relation to complexity)

#### General

- Alphabetical <-> recent sorting toggle for card views
- Multiple tags selection mode
- Auto-conversion of known units from/to abbreviations
- Bulk importing recipes from exports of other recipe apps / Schema.org / JSON-LD
- Share screenshots/photos for recipe creation (Web Share Target API, ingredients <-> directions assignment toggle view)
- Ticking ingredients and resetting ticks

#### Settings

- Default view to show on app load
- Formatting
  - Spaces in quantities/units
  - Decimal or fraction quantities

## TODOs

### General

- Set up multilangual landing page with SEO

### Sync

- Check if already present locally and synced when pulling

### Functionality

- Check caching logic when size limit exceeds
- Add recipe editing
- Persist last viewed in PocketBase
- Keep screen on in recipe view

### UI/UX

- Add transition / animation to nav bottom active indicator (:before)
- Fix scroll position changing when editing textareas when manually editing

### Internationalization

- Change all non-logical CSS rules to logical ones
- Support mixed-direction content by applying dir="auto" or <bdi> where necessary
- Flip arrows and back button positions where appropriate
- Add script to handle <html dir> and fonts when changing language
- Check if there are numerals that used regexes do not account for

## Deployment checklist

- [PocketBase docs "Going to production"](https://pocketbase.io/docs/going-to-production)
- Email translations import endpoint deleted from pb_hooks?
- All API Rules safe?
