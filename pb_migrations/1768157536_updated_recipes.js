/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("pbc_842702175")

  // update collection data
  unmarshal({
    "indexes": [
      "CREATE UNIQUE INDEX `idx_recipe_name_user_id` ON `recipes` (`userId`)"
    ]
  }, collection)

  return app.save(collection)
}, (app) => {
  const collection = app.findCollectionByNameOrId("pbc_842702175")

  // update collection data
  unmarshal({
    "indexes": [
      "CREATE UNIQUE INDEX `idx_recipe_name_user_id` ON `recipes` (\n  `userId`,\n  `name`\n)"
    ]
  }, collection)

  return app.save(collection)
})
