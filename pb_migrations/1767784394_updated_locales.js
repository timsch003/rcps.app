/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("pbc_1959275345")

  // update collection data
  unmarshal({
    "indexes": [
      "CREATE INDEX `idx_2sLOmYTiFc` ON `email_translations` (\n  `key`,\n  `value`\n)"
    ],
    "name": "email_translations"
  }, collection)

  return app.save(collection)
}, (app) => {
  const collection = app.findCollectionByNameOrId("pbc_1959275345")

  // update collection data
  unmarshal({
    "indexes": [
      "CREATE INDEX `idx_2sLOmYTiFc` ON `locales` (\n  `key`,\n  `value`\n)"
    ],
    "name": "locales"
  }, collection)

  return app.save(collection)
})
