import { db } from '@/adapters/dexie'
import { useTagsStore } from '@/stores/tags'
import { useIngredientsStore } from '@/stores/ingredients'
import { useRecipeIngredientsStore } from '@/stores/recipe_ingredients'
import { v7 as uuidv7 } from 'uuid'
import type { RecipeLocal, RecipeRaw, UUID } from '@/types'

async function getAll(): Promise<RecipeLocal[]> {
  return await db.recipes.toArray()
}

async function add(data: RecipeRaw): Promise<RecipeLocal | undefined> {
  const tagsStore = useTagsStore()
  const ingredientsStore = useIngredientsStore()
  const recipeIngredientsStore = useRecipeIngredientsStore()

  const newRecipeId = uuidv7()

  let tagIds: UUID[] = []
  let newOrExistingTags: Promise<UUID | undefined>[] = []
  if (Array.isArray(data.tags)) {
    newOrExistingTags = data.tags.map(async (newOrExistingTag) => {
      let tagId = await tagsStore.add(newOrExistingTag)
      if (!tagId) tagId = await tagsStore.getExistingId(newOrExistingTag)
      return tagId
    })

    const resolvedIds = await Promise.all(newOrExistingTags)
    tagIds = resolvedIds.filter((id): id is UUID => id !== undefined)
  }

  let ingredientIds: UUID[] = []
  if (Array.isArray(data.matchedIngredients)) {
    const recipeIngredientIdPromises: Promise<UUID | undefined>[] = data.matchedIngredients.map(
      async (mi) => {
        const id = await ingredientsStore.add(mi)
        if (id) return id
      },
    )

    const resolvedIds = await Promise.all(recipeIngredientIdPromises)
    ingredientIds = resolvedIds.filter((id): id is UUID => id !== undefined)
  }

  const recipeIngredientIds = await recipeIngredientsStore.addManyByIngredientId(
    newRecipeId,
    ingredientIds,
  )

  const newRecipe: RecipeLocal = {
    id: newRecipeId,
    name: data.name!,
    tagIds: tagIds,
    servings: data.servings || 1,
    recipeIngredientIds: recipeIngredientIds,
    instructions: data.instructions,
    notes: data.notes,
    synced: false,
  }

  try {
    await db.recipes.add(newRecipe)
    console.log('Added recipe: ', newRecipe)
    return newRecipe
  } catch (error) {
    console.error('Failed to add recipe to the local database:', error)
    return undefined
  }
}

export const recipesManager = {
  getAll,
  add,
}
