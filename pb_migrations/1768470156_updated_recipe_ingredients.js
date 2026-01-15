/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("pbc_4122981313")

  // update collection data
  unmarshal({
    "indexes": [
      "CREATE INDEX `idx_7lfMGBPfX0` ON `recipe_ingredients` (\n  `recipeId`,\n  `ingredientId`,\n  `unitId`\n)"
    ]
  }, collection)

  // update field
  collection.fields.addAt(4, new Field({
    "cascadeDelete": false,
    "collectionId": "pbc_586599074",
    "hidden": false,
    "id": "relation3703245907",
    "maxSelect": 1,
    "minSelect": 0,
    "name": "unitId",
    "presentable": false,
    "required": false,
    "system": false,
    "type": "relation"
  }))

  return app.save(collection)
}, (app) => {
  const collection = app.findCollectionByNameOrId("pbc_4122981313")

  // update collection data
  unmarshal({
    "indexes": [
      "CREATE UNIQUE INDEX `idx_sxCArJO32W` ON `recipe_ingredients` (\n  `recipeId`,\n  `ingredientId`\n)"
    ]
  }, collection)

  // update field
  collection.fields.addAt(4, new Field({
    "cascadeDelete": false,
    "collectionId": "pbc_586599074",
    "hidden": false,
    "id": "relation3703245907",
    "maxSelect": 1,
    "minSelect": 0,
    "name": "unit",
    "presentable": false,
    "required": false,
    "system": false,
    "type": "relation"
  }))

  return app.save(collection)
})
