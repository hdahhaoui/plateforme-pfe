/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("pbc_3949707534")

  // remove field
  collection.fields.removeById("select538959466")

  // add field
  collection.fields.addAt(6, new Field({
    "autogeneratePattern": "",
    "hidden": false,
    "id": "text538959466",
    "max": 0,
    "min": 0,
    "name": "type_sujet",
    "pattern": "",
    "presentable": false,
    "primaryKey": false,
    "required": false,
    "system": false,
    "type": "text"
  }))

  return app.save(collection)
}, (app) => {
  const collection = app.findCollectionByNameOrId("pbc_3949707534")

  // add field
  collection.fields.addAt(6, new Field({
    "hidden": false,
    "id": "select538959466",
    "maxSelect": 1,
    "name": "type_sujet",
    "presentable": false,
    "required": false,
    "system": false,
    "type": "select",
    "values": [
      "classique",
      "1275"
    ]
  }))

  // remove field
  collection.fields.removeById("text538959466")

  return app.save(collection)
})
