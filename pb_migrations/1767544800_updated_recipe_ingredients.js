/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("pbc_4122981313")

  // add field
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
}, (app) => {
  const collection = app.findCollectionByNameOrId("pbc_4122981313")

  // remove field
  collection.fields.removeById("relation3703245907")

  return app.save(collection)
})
