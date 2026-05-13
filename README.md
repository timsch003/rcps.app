# rcps.app

**Table of Contents:**

1. [Stack](#stack)
2. [Setup](#setup)
3. [Architecture](#architecture)
4. [Planned features](#planned-features)
5. [TODOs](#todos)
6. [Deployment checklist](#deployment-checklist)

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

#### Access dev servers via local network (no https) (no https)

1. Set the local IP of the device you want to use in _.env.development_
2. Start PocketBase using `npm run pb:lan`
3. Start Vite using `npm run dev:lan`

#### Local caching

The app registers a service worker (`public/sw.js`) and caches the app shell as well as the bundled app assets.

## Architecture

### Backend

Pivot tables are employed to share data which is likely to be duplicated a lot between users (ingredients, units and tags).

### IDs

For all types that have an ID UUIDv7 is used which offers integrated time stamps. Those can be used e.g. for sorting purposes or syncing conflict handling. IDs are only created on the client.

### Services

Services (`/src/services`) are used to keep responsibility for mutating data as decoupled as possible.

## Planned features

### General

- Alphabetical <-> last edited sorting toggle for card views
- Multiple tags selection mode
- Auto-conversion of known units from/to abbreviations
- Bulk importing recipes from exports of other recipe apps / Schema.org / JSON-LD
- Share screenshots/photos for recipe creation (Web Share Target API, ingredients <-> directions assignment toggle view)
- Ticking ingredients and resetting ticks

### Settings

- UX
  - Default view to show on app load (settings key with value of route object: `{name: 'tags'}`)
  - Display 'Categorie(s)' instead of 'Tag(s)' or even let user edit the term freely
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

### Bugs

- Menu -> submenu transition is delayed
- When after editing a recipe a tag has no recipes associated to it anymore:
  - users get a non-breaking error when navigating back
  - the tag stays cached and being displayed in the tags view

### MVP Roadmap

- Sync last viewed in user settings
- Sort items by name in favorites and tags views
- Add spinners to RecipesView, TagsView etc. (for syncing recipes on empty cache)
- Adjust ingredient quantities based on portions
- Improve OCR results, especially regarding empty lines between ingredients
  - Optimize images for Tesseract (https://tesseract-ocr.github.io/tessdoc/ImproveQuality.html)
  - If not sufficient research if NLP could help
- Basic search functionality
- Trigger sync on menu close only when changes were made
- Recipe images (up to 5 per recipe, low resolution version for offline storage)
- Menu functionality
  - Language selection
  - Reset password
  - Change email

### Functionality

- Link tags in recipe view to tag views
- Add option to set changed portions count and adjusted ingredient quantities permanently (= edit recipe from RecipeView?)

### UI/UX

- Sync status
  - Add sync info section to menu (icons legend, advice user to let offline changes sync before editing on other device/browser)
- Navs
  - Add transition / animation to nav bottom active indicator (:before)
- Create/View/Edit
  - Add spaces after commas when populating tags edit input
  - Show tag suggestions on input focus (last) and when typing (autocomplete)
- Settings
  - Add breadcrumbs component to sub-views

### Accessibility

- Check tab-index for NavBottom create sub-menu

### Testing

- Check how pivot tables entries shared between users are handeled when created offline and already present under different ID when synced

### Optimization

- Implement using ingredientsManager.sortOrderMultiplier to avoid syncing unchanged recipes

### Refactoring

- Sync logic
  - Handle connection loss while syncing / active pb request (outbox, state machine / transition map patterns)
  - Partial recipe updates
- Auth
  - Removal of storage data when using different accounts on one browser/device
  - Check auth token timeout
- Error handling
  - Check retraceability and user feedback
  - Automated emails when errors occur?
- CSS
  - Rename spacing CSS vars uniformly to --spacing-xs etc.
  - Change all non-logical CSS rules to logical ones

### Internationalization

- Support mixed-direction content by applying dir="auto" or <bdi> where necessary
- Flip arrows and back button positions where appropriate
- Add script to handle <html dir> and fonts when changing language
- Check if there are numerals that used regexes do not account for

### General

- Set up multilangual landing page with SEO
- Check (international) legal implications of storing user email/password and recipe data (no other personal data)

## Deployment checklist

- Email translations import endpoint deleted from pb_hooks?
- All API Rules safe?
