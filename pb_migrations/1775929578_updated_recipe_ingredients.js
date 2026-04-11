/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("pbc_4122981313")

  // add field
  collection.fields.addAt(4, new Field({
    "hidden": false,
    "id": "number3050761889",
    "max": null,
    "min": null,
    "name": "quantityUpper",
    "onlyInt": false,
    "presentable": false,
    "required": false,
    "system": false,
    "type": "number"
  }))

  return app.save(collection)
}, (app) => {
  const collection = app.findCollectionByNameOrId("pbc_4122981313")

  // remove field
  collection.fields.removeById("number3050761889")

  return app.save(collection)
})
