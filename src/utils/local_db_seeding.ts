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
  const carrotsId = uuidv7()
  const potatoesId = uuidv7()
  const onionsId = uuidv7()
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

  useIngredientsStore().add('Flour', flourId)
  useIngredientsStore().add('Sugar', sugarId)
  useIngredientsStore().add('Tofu', tofuId)
  useIngredientsStore().add('Carrots', carrotsId)
  useIngredientsStore().add('Potatoes', potatoesId)
  useIngredientsStore().add('Onions', onionsId)

  useTagsStore().add('Dessert', dessertTagId)
  useTagsStore().add('Main dish', mainDishTagId)

  useUnitsStore().add('gram', unitGramId)
  useUnitsStore().add('cup', unitCupId)

  useRecipesStore().add(
    {
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
    },
    recipeId,
  )

  useRecipesStore().add(
    {
      name: 'Fruit salad',
      servings: 0,
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
      servings: 2,
      recipeIngredientIds: [recipeIngredient6Id, recipeIngredient7Id, recipeIngredient8Id],
    },
    recipe3Id,
  )

  useRecipesStore().add(
    {
      name: 'Pancakes',
      instructions: 'Mix ingredients and cook on griddle.',
      notes: 'Serve with syrup.',
      tagIds: [dessertTagId],
      servings: 4,
      recipeIngredientIds: [recipeIngredient9Id],
    },
    recipe4Id,
  )

  useRecipeIngredientsStore().add({
    id: recipeIngredient1Id,
    recipeId: recipeId,
    ingredientId: flourId,
    quantity: 2,
    unitId: unitCupId,
    sortOrder: 1,
  })

  useRecipeIngredientsStore().add({
    id: recipeIngredient2Id,
    recipeId: recipeId,
    ingredientId: sugarId,
    quantity: 1,
    unitId: unitGramId,
    sortOrder: 2,
  })

  useRecipeIngredientsStore().add({
    id: recipeIngredient3Id,
    recipeId: recipeId,
    ingredientId: tofuId,
    quantity: 300,
    unitId: unitGramId,
    sortOrder: 1,
  })

  useRecipeIngredientsStore().add({
    id: recipeIngredient4Id,
    recipeId: recipeId,
    ingredientId: carrotsId,
    quantity: 50,
    unitId: unitGramId,
    sortOrder: 3,
  })

  useRecipeIngredientsStore().add({
    id: recipeIngredient5Id,
    recipeId: recipeId,
    ingredientId: potatoesId,
    quantity: 100,
    unitId: unitGramId,
    sortOrder: 2,
  })

  useRecipeIngredientsStore().add({
    id: recipeIngredient6Id,
    recipeId: recipe3Id,
    ingredientId: onionsId,
    quantity: 50,
    unitId: unitGramId,
    sortOrder: 3,
  })

  useRecipeIngredientsStore().add({
    id: recipeIngredient7Id,
    recipeId: recipe3Id,
    ingredientId: carrotsId,
    quantity: 75,
    unitId: unitGramId,
    sortOrder: 2,
  })

  useRecipeIngredientsStore().add({
    id: recipeIngredient8Id,
    recipeId: recipe3Id,
    ingredientId: tofuId,
    quantity: 200,
    unitId: unitGramId,
    sortOrder: 1,
  })

  useRecipeIngredientsStore().add({
    id: recipeIngredient9Id,
    recipeId: recipe4Id,
    ingredientId: flourId,
    quantity: 1.5,
    unitId: unitCupId,
    sortOrder: 1,
  })

  localStorage.setItem('seeded', 'true')
}
