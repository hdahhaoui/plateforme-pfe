/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("pbc_3827815851")

  // update collection data
  unmarshal({
    "createRule": "",
    "deleteRule": "",
    "listRule": null,
    "updateRule": ""
  }, collection)

  return app.save(collection)
}, (app) => {
  const collection = app.findCollectionByNameOrId("pbc_3827815851")

  // update collection data
  unmarshal({
    "createRule": null,
    "deleteRule": null,
    "listRule": "",
    "updateRule": null
  }, collection)

  return app.save(collection)
})
