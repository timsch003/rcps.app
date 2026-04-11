/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("pbc_4122981313")

  // add field
  collection.fields.addAt(5, new Field({
    "hidden": false,
    "id": "number623211178",
    "max": null,
    "min": null,
    "name": "quantityUniyPosition",
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
  collection.fields.removeById("number623211178")

  return app.save(collection)
})
