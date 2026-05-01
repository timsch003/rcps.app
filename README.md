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

_Note that 'pocketbase' in package.json refers to the JS SDK._  
Current binary version: **0.37.3**

```sh
./pocketbase update
```

#### Access dev servers via local network

1. Set the local IP of the device you want to use in _.env.development_
2. Start PocketBase using `npm run pb:lan`
3. Start Vite using `npm run dev:lan`

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

#### General

- Alphabetical <-> last edited sorting toggle for card views
- Multiple tags selection mode
- Auto-conversion of known units from/to abbreviations
- Bulk importing recipes from exports of other recipe apps / Schema.org / JSON-LD
- Share screenshots/photos for recipe creation (Web Share Target API, ingredients <-> directions assignment toggle view)
- Ticking ingredients and resetting ticks

#### Settings

- UX
  - Default view to show on app load
  - Categorize favorites by tags
  - Star as favorites icon
  - Condensed recipe view
- Formatting
  - Spaces between quantity & unit and inside quantity ranges
  - Quantity range character selection
  - Decimal (comma or dot) or fraction quantities
- Accessibility
  - Disable animations
  - Left-handed mode

## TODOs

### General

- Set up multilangual landing page with SEO
- Check (international) legal implications of storing user email/password and recipe data (no other personal data)

### Bugs

- Tags button in bottom nav is not active when navigated to tag view

### Refactoring

- Sync logic
  - Partial recipe updates
  - Initial sync on page load when edited on other logged in browser/device
- Auth
  - Removal of storage data when using different accounts on one browser/device
  - Check auth token timeout
- Error handling
  - Check retraceability and user feedback
  - Automated emails when errors occur?

### Optimization

- Implement using ingredientsManager.sortOrderMultiplier to avoid syncing unchanged data

### Functionality

- Persist last viewed in user settings
- Add links to tags in recipe view

### UI/UX

- Sync status
  - Indicate unsynced local changes when offline
  - Add tick to synced icon
  - Add info section explaining sync to menu
- Navs
  - Add transition / animation to nav bottom active indicator (:before)
- Create/View/Edit
  - Add commas when populating tags edit input
  - Show suggestions when typing in tags
- Settings
  - Add breadcrumbs component to sub-views

### Internationalization

- Change all non-logical CSS rules to logical ones
- Support mixed-direction content by applying dir="auto" or <bdi> where necessary
- Flip arrows and back button positions where appropriate
- Add script to handle <html dir> and fonts when changing language
- Check if there are numerals that used regexes do not account for

## Deployment checklist

- Email translations import endpoint deleted from pb_hooks?
- All API Rules safe?
