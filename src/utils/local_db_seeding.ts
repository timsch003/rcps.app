import { ingredientsManager } from '@/services/ingredients_manager'
import { recipeIngredientsManager } from '@/services/recipe_ingredients_manager'
import { tagsManager } from '@/services/tags_manager'
import { unitsManager } from '@/services/units_manager'
import { db } from '@/adapters/dexie'
import { v7 as uuidv7 } from 'uuid'
import type { RecipeLocal } from '@/types'

export const seedLocalDB = async () => {
  const flourId = await ingredientsManager.add('Flour')
  const sugarId = await ingredientsManager.add('Sugar')
  const tofuId = await ingredientsManager.add('Tofu')
  const carrotsId = await ingredientsManager.add('Carrots')
  const potatoesId = await ingredientsManager.add('Potatoes')
  const onionsId = await ingredientsManager.add('Onions')
  const dessertTagId = uuidv7()
  const mainDishTagId = uuidv7()
  const recipeId = uuidv7()
  const recipe2Id = uuidv7()
  const recipe3Id = uuidv7()
  const recipe4Id = uuidv7()
  const recipeIngredient1Id = uuidv7()
  const recipeIngredient2Id = uuidv7()
  const recipeIngredient3Id = uuidv7()
  const recipeIngredient4Id = uuidv7()
  const recipeIngredient5Id = uuidv7()
  const recipeIngredient6Id = uuidv7()
  const recipeIngredient7Id = uuidv7()
  const recipeIngredient8Id = uuidv7()
  const recipeIngredient9Id = uuidv7()

  const unitGramId = uuidv7()
  const unitCupId = uuidv7()

  await tagsManager.add('Dessert', dessertTagId)
  await tagsManager.add('Main dish', mainDishTagId)

  await unitsManager.add('gram', unitGramId)
  await unitsManager.add('cup', unitCupId)

  const recipe1: RecipeLocal = {
    id: recipeId,
    name: 'Cake',
    servings: 8,
    instructions: 'Mix ingredients and bake.',
    tagIds: [mainDishTagId, dessertTagId],
    recipeIngredientIds: [
      recipeIngredient1Id,
      recipeIngredient2Id,
      recipeIngredient3Id,
      recipeIngredient4Id,
      recipeIngredient5Id,
    ],
    synced: false,
  }
  await db.recipes.add(recipe1)

  const recipe2: RecipeLocal = {
    id: recipe2Id,
    name: 'Fruit salad',
    servings: 0,
    instructions: 'Chop fruit and mix.',
    tagIds: [dessertTagId],
    recipeIngredientIds: [],
    synced: false,
  }
  await db.recipes.add(recipe2)

  const recipe3: RecipeLocal = {
    id: recipe3Id,
    name: 'Tofu stir-fry',
    instructions: 'Cook tofu with vegetables.',
    tagIds: [mainDishTagId],
    servings: 2,
    recipeIngredientIds: [recipeIngredient6Id, recipeIngredient7Id, recipeIngredient8Id],
    synced: false,
  }
  await db.recipes.add(recipe3)

  const recipe4: RecipeLocal = {
    id: recipe4Id,
    name: 'Pancakes',
    instructions: 'Mix ingredients and cook on griddle.',
    notes: 'Serve with syrup.',
    tagIds: [dessertTagId],
    servings: 4,
    recipeIngredientIds: [recipeIngredient9Id],
    synced: false,
  }
  await db.recipes.add(recipe4)

  await recipeIngredientsManager.add({
    id: recipeIngredient1Id,
    recipeId: recipeId,
    ingredientId: flourId!,
    quantity: 2,
    unitId: unitCupId,
    sortOrder: 1,
  })

  await recipeIngredientsManager.add({
    id: recipeIngredient2Id,
    recipeId: recipeId,
    ingredientId: sugarId!,
    quantity: 1,
    unitId: unitGramId,
    sortOrder: 2,
  })

  await recipeIngredientsManager.add({
    id: recipeIngredient3Id,
    recipeId: recipeId,
    ingredientId: tofuId!,
    quantity: 300,
    unitId: unitGramId,
    sortOrder: 1,
  })

  await recipeIngredientsManager.add({
    id: recipeIngredient4Id,
    recipeId: recipeId,
    ingredientId: carrotsId!,
    quantity: 50,
    unitId: unitGramId,
    sortOrder: 3,
  })

  await recipeIngredientsManager.add({
    id: recipeIngredient5Id,
    recipeId: recipeId,
    ingredientId: potatoesId!,
    quantity: 100,
    unitId: unitGramId,
    sortOrder: 2,
  })

  await recipeIngredientsManager.add({
    id: recipeIngredient6Id,
    recipeId: recipe3Id,
    ingredientId: onionsId!,
    quantity: 50,
    unitId: unitGramId,
    sortOrder: 3,
  })

  await recipeIngredientsManager.add({
    id: recipeIngredient7Id,
    recipeId: recipe3Id,
    ingredientId: carrotsId!,
    quantity: 75,
    unitId: unitGramId,
    sortOrder: 2,
  })

  await recipeIngredientsManager.add({
    id: recipeIngredient8Id,
    recipeId: recipe3Id,
    ingredientId: tofuId!,
    quantity: 200,
    unitId: unitGramId,
    sortOrder: 1,
  })

  await recipeIngredientsManager.add({
    id: recipeIngredient9Id,
    recipeId: recipe4Id,
    ingredientId: flourId!,
    quantity: 1.5,
    unitId: unitCupId,
    sortOrder: 1,
  })

  localStorage.setItem('seeded', 'true')
}
