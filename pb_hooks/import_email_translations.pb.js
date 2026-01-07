/// <reference types="../pb_data/types" />

/**
 * Admin-only endpoint to import locales from i18n JSON file.
 * Use after deployment with live url and token from local storage
 * by executing the curl command below and delete this file afterwards.
 */

/*
curl -X POST "[URL]/api/import-locales" \
-H "Authorization: Bearer [TOKEN]" \
-H "Content-Type: application/json" \
--data-binary @src/lang/locales.json
*/

routerAdd('POST', '/api/import-locales', (e) => {
  try {
    // Get parsed request body (already JSON parsed by PocketBase)
    const info = e.requestInfo()
    const payload = info.body

    if (!payload || typeof payload !== 'object') {
      return e.json(400, { error: 'Invalid request body' })
    }

    // Ensure locales collection exists
    let collection
    try {
      collection = $app.findCollectionByNameOrId('email_translations')
    } catch (err) {
      return e.json(400, {
        error: "Missing 'email_translations' collection. Please create it with fields: locale(text, required), key(text, required), value(text, required) plus a compound index on (locale, key).",
      })
    }

    let created = 0
    let updated = 0

    // Iterate locales
    for (const locale in payload) {
      const entries = payload[locale]
      if (!entries || typeof entries !== 'object') continue

      for (const key in entries) {
        const value = entries[key]
        if (typeof value !== 'string') continue

        // Only import keys with "email." prefix
        if (!key.startsWith('email.')) continue

        // Try to find existing record
        let rec = null
        try {
          rec = $app.findFirstRecordByFilter(
            'locales',
            `locale = "${locale}" && key = "${key}"`
          )
        } catch (err) {
          rec = null
        }

        if (rec) {
          rec.set('value', value)
          $app.save(rec)
          updated++
        } else {
          const r = new Record(collection)
          r.set('locale', locale)
          r.set('key', key)
          r.set('value', value)
          $app.save(r)
          created++
        }
      }
    }

    return e.json(200, { created, updated })
  } catch (err) {
    return e.json(500, { error: (err && err.message) || 'Internal error' })
  }
}, $apis.requireSuperuserAuth())
