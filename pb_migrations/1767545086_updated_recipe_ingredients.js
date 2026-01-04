/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("pbc_4122981313")

  // update field
  collection.fields.addAt(6, new Field({
    "hidden": false,
    "id": "number1063427325",
    "max": null,
    "min": null,
    "name": "sortOrder",
    "onlyInt": false,
    "presentable": false,
    "required": false,
    "system": false,
    "type": "number"
  }))

  return app.save(collection)
}, (app) => {
  const collection = app.findCollectionByNameOrId("pbc_4122981313")

  // update field
  collection.fields.addAt(6, new Field({
    "hidden": false,
    "id": "number1063427325",
    "max": null,
    "min": null,
    "name": "sortOrder",
    "onlyInt": true,
    "presentable": false,
    "required": false,
    "system": false,
    "type": "number"
  }))

  return app.save(collection)
})
