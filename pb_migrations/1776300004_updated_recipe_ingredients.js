/// <reference path="../pb_data/types.d.ts" />
migrate(
  (app) => {
    const collection = app.findCollectionByNameOrId('pbc_4122981313')

    // update collection data
    unmarshal(
      {
        createRule: '@request.auth.id = recipeId.userId',
        deleteRule: '@request.auth.id = recipeId.userId',
        listRule: '@request.auth.id = recipeId.userId',
        updateRule: '@request.auth.id = recipeId.userId',
        viewRule: '@request.auth.id = recipeId.userId',
      },
      collection,
    )

    return app.save(collection)
  },
  (app) => {
    const collection = app.findCollectionByNameOrId('pbc_4122981313')

    // update collection data
    unmarshal(
      {
        createRule: null,
        deleteRule: null,
        listRule: null,
        updateRule: null,
        viewRule: null,
      },
      collection,
    )

    return app.save(collection)
  },
)
