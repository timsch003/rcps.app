import { useIngredientsStore } from '@/stores/ingredients'
import { useRecipeIngredientsStore } from '@/stores/recipe_ingredients'
import { useRecipesStore } from '@/stores/recipes'
import { useTagsStore } from '@/stores/tags'
import { useUnitsStore } from '@/stores/units'
import { v7 as uuidv7 } from 'uuid'

export const seedLocalDB = () => {
  const flourId = uuidv7()
  const sugarId = uuidv7()
  const tofuId = uuidv7()
  const dessertTagId = uuidv7()
  const mainDishTagId = uuidv7()
  const recipeId = uuidv7()
  const recipe2Id = uuidv7()
  const recipe3Id = uuidv7()
  const recipe4Id = uuidv7()
  const recipeIngredient1Id = uuidv7()
  const recipeIngredient2Id = uuidv7()
  const recipeIngredient3Id = uuidv7()
  const unitGramId = uuidv7()
  const unitCupId = uuidv7()

  useIngredientsStore().add('Flour', flourId)
  useIngredientsStore().add('Sugar', sugarId)
  useIngredientsStore().add('Tofu', tofuId)

  useTagsStore().add('Dessert', dessertTagId)
  useTagsStore().add('Main dish', mainDishTagId)

  useUnitsStore().add('gram', unitGramId)
  useUnitsStore().add('cup', unitCupId)

  useRecipesStore().add(
    {
      name: 'Cake',
      instructions: 'Mix ingredients and bake.',
      tagIds: [mainDishTagId, dessertTagId],
      recipeIngredientIds: [recipeIngredient1Id, recipeIngredient2Id],
    },
    recipeId,
  )

  useRecipesStore().add(
    {
      name: 'Fruit salad',
      instructions: 'Chop fruit and mix.',
      tagIds: [dessertTagId],
      recipeIngredientIds: [],
    },
    recipe2Id,
  )

  useRecipesStore().add(
    {
      name: 'Tofu stir-fry',
      instructions: 'Cook tofu with vegetables.',
      tagIds: [mainDishTagId],
      recipeIngredientIds: [recipeIngredient3Id, recipeIngredient1Id, recipeIngredient2Id],
    },
    recipe3Id,
  )

  useRecipesStore().add(
    {
      name: 'Pancakes',
      instructions: 'Mix ingredients and cook on griddle.',
      notes: 'Serve with syrup.',
      tagIds: [dessertTagId],
      recipeIngredientIds: [recipeIngredient2Id],
    },
    recipe4Id,
  )

  useRecipeIngredientsStore().add({
    id: recipeIngredient1Id,
    recipeId: recipeId,
    ingredientId: flourId,
    quantity: 2,
    unitId: undefined,
    notes: 'Use all-purpose flour',
    sortOrder: 1,
  })

  useRecipeIngredientsStore().add({
    id: recipeIngredient2Id,
    recipeId: recipeId,
    ingredientId: sugarId,
    quantity: 1,
    unitId: undefined,
    sortOrder: 2,
  })

  useRecipeIngredientsStore().add({
    id: recipeIngredient3Id,
    recipeId: recipe3Id,
    ingredientId: tofuId,
    quantity: 300,
    unitId: undefined,
    notes: 'Firm tofu works best',
    sortOrder: 1,
  })
}
