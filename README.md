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

### Available commands 

`npm install`  
Install dependencies.  

`./pocketbase serve`  
Start the PocketBase server.  

`npm run dev`  
Compile and hot-reload for development.  

`npm run lint`  
Lint with [ESLint](https://eslint.org/)
- `npm run test:unit`: run unit tests with [Vitest](https://vitest.dev/).  

`npm run test:e2e:dev`  
Run end-to-end tests with [Cypress](https://www.cypress.io/).  

`npm run build`  
Type-check, compile and minify for production.  

`test:e2e`  
Test the production build before deploying.  

`./pocketbase update`  
Update the PocketBase binary (_Note that 'pocketbase' in package.json refers to the JS SDK._).  
Current binary version: **0.37.3**.  

`npm run deploy:frontend`  
Deploy the locally built JS app bundle (_currently just by overwriting files on the server_).  

`npm run deploy:backend`   
Deploy the locally updated pocketbase binary, pocketbase hooks and migrations (_currently just by overwriting files on the server_).  

### Access dev servers via local network (no https)

1. Set the local IP of the device you want to use in _.env.development_
2. Start PocketBase using `npm run pb:lan`
3. Start Vite using `npm run dev:lan`

## Architecture

### Local caching

The app registers a service worker (`public/sw.js`) and caches the app shell as well as the bundled app assets.

### Backend

Pivot tables are employed to share data which is likely to be duplicated a lot between users (ingredients, units and tags). The schema of the pocketbase sync server is reflected on the client via an IndexedDB handled by Dexie.

### IDs

For all types that have an ID a UUIDv7 is created on the client. UUIDv7 has integrated time stamps which can be used for tasks like sorting or syncing conflict resolution.

### Services

#### Managers

Used to keep data flow responsibilities decoupled from the local caching mechanisms (Pinia stores and IndexedDB).

#### Sync

Locally stored data is pushed to the pocketbase sync server when

- the user triggers a sync manually (`nav.top .sync-indicator`)
- data is mutated on user interaction (editing/viewing recipes, changing settings etc.)
- coming back online

Remote data is pulled on every sync to integrate missing data into the local caches or initially populate them.

Both directions always follow the last write wins rule (including deletes). During a single sync data is always pushed first, then pulled.

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

### MVP Roadmap

- Sort items by name in favorites and tags views
- Add spinners to RecipesView, TagsView etc. (for syncing recipes on empty cache)
- Adjust ingredient quantities based on portions
- Improve OCR results, especially regarding empty lines between ingredients
  - Optimize images for Tesseract (https://tesseract-ocr.github.io/tessdoc/ImproveQuality.html)
  - If not sufficient research if NLP could help
- Refactor upsertRecord function to also check sync server for existing names and return existing IDs so duplicates between users are handled and passed to local stores
- Basic search functionality
- Recipe images (up to 5 per recipe, low resolution version for offline storage)

### Functionality

- Link tags in recipe view to tag views
- Add option to set changed portions count and adjusted ingredient quantities permanently (= edit recipe from RecipeView?)
- Menu
  - Language selection
  - Reset password
  - Change email

### UI/UX

- Sync status
  - Add sync info section to menu (icons legend, advice user to let offline changes sync before editing on other device/browser)
- Navs
  - Add transition / animation to nav bottom active indicator (:before)
- Top-level views
  - Add respective nav.bottom icon before each h2 as an indirect button label
- Create/View/Edit
  - Tags and servings order
    - RecipeView: move tags below name and add inline icon instead of heading--muted
    - CreateEditView: move servings to before ingredients, center discard and create/save buttons
  - Add spaces after commas when populating tags edit input
  - Show tag suggestions on input focus (last) and when typing (autocomplete)
- Settings
  - Add breadcrumbs component to sub-views
  - User interface: change layout to heading--muted for interface setting sub-category and non-wrapping flex rows of label and checkbox

### Accessibility

- Check tab-index for NavBottom create sub-menu

### Optimization

- Implement using ingredientsManager.sortOrderMultiplier to avoid syncing unchanged recipes

### Refactoring

- Sync logic
  - Robust outbox and mid-request connection-loss recovery
  - Partial recipe updates
- Auth
  - Removal of storage data when using different accounts on one browser/device
  - Check auth token timeout
- Error handling
  - Check retraceability and user feedback
  - Automated emails when errors occur?
- CSS
  - Rename spacing vars to --spacing-xs etc. for universal use without suffixes
  - Change all non-logical CSS rules to logical ones

### Internationalization

- RTL languages
  - Support mixed-direction content by applying dir="auto" or <bdi> where necessary
  - Flip arrows and back button positions where sensible
  - Handle <html dir> and fonts when changing language
- Check for numerals that current regexes do not account for

### General

- Add additional git origin on Hetzner server
- Set up multilangual landing page with SEO
- Check (international) legal implications of storing user email/password and recipe data (no other personal data)

## Backend deployment checklist

- Email translations import endpoint deleted from pb_hooks?
- All API Rules safe?
