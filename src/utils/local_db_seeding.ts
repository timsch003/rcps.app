import { db } from '@/adapters/dexie'
import { ingredientsManager } from '@/services/ingredients_manager'
import { recipesManager } from '@/services/recipes_manager'
import type { MatchedIngredient, RecipeRaw } from '@/types'

const SEED_STORAGE_KEY = 'seeded'
const SEEDED_RECIPE_COUNT = 6

const ingredientNames = [
  'Flour',
  'Sugar',
  'Tofu',
  'Carrots',
  'Potatoes',
  'Onions',
  'Tomatoes',
  'Milk',
  'Eggs',
  'Rice',
]

const unitNames = ['gram', 'cup', 'tablespoon', 'teaspoon', 'slice', 'piece']

const quantityValues = ['1/2', '1', '1 1/2', '2', '2 1/2', '3']

const ingredientSuffixes = [
  '',
  'finely chopped',
  'roughly chopped',
  'thinly sliced',
  'diced',
  'room temperature',
]

const tagNames = ['Dessert', 'Main dish', 'Vegetarian', 'Quick', 'Breakfast']

const recipePrefixes = ['Easy', 'Classic', 'Spicy', 'Creamy', 'Crispy', 'Fresh']
const recipeBases = ['Salad', 'Stir-fry', 'Pancakes', 'Soup', 'Casserole', 'Bake']
const recipeFinishes = ['Skillet', 'Bowl', 'Plate', 'Tray', 'Mix', 'Special']
const instructionTemplates = [
  'Combine everything and cook until done.',
  'Mix the ingredients, then bake or fry.',
  'Chop the ingredients and toss together.',
  'Stir everything over medium heat until warmed through.',
]
const instructionOpeners = [
  'Prep the ingredients first.',
  'Heat a pan over medium heat.',
  'Gather everything before starting.',
  'Preheat the oven if needed.',
]
const noteTemplates = [
  'Serve hot.',
  'Best with fresh herbs.',
  'Store leftovers in the fridge.',
  'Perfect for meal prep.',
]
const servingValues = [1, 2, 3, 4, 6]

const pick = <T>(items: readonly T[]): T => items[Math.floor(Math.random() * items.length)] as T

const pickUnique = <T>(items: readonly T[], count: number): T[] => {
  const remaining = [...items]
  const result: T[] = []
  while (result.length < count && remaining.length) {
    const index = Math.floor(Math.random() * remaining.length)
    result.push(...remaining.splice(index, 1))
  }
  return result
}

const buildIngredientLine = () => {
  const quantity = pick(quantityValues)
  const unit = pick(unitNames)
  const ingredient = pick(ingredientNames)
  const suffix = pick(ingredientSuffixes)

  return [quantity, unit, ingredient, suffix].filter(Boolean).join(' ').trim()
}

const ensureSelectedQuantity = (matchedIngredient: MatchedIngredient): MatchedIngredient => {
  if (!matchedIngredient.parts) return matchedIngredient

  const hasSelectedQuantity = matchedIngredient.parts.some(
    (part) => part.quantity !== undefined && part.selected,
  )
  const firstQuantityIndex = matchedIngredient.parts.findIndex(
    (part) => part.quantity !== undefined,
  )

  return {
    ...matchedIngredient,
    parts: matchedIngredient.parts.map((part, index) => {
      const quantityPartSelected =
        part.quantity !== undefined &&
        (hasSelectedQuantity ? !!part.selected : index === firstQuantityIndex)

      return {
        ...part,
        selected: quantityPartSelected,
      }
    }),
  }
}

const buildMatchedIngredient = (ingredientLine: string, sortOrder: number): MatchedIngredient => {
  const matchedIngredient = ingredientsManager.matchAndNormalize(ingredientLine)[0]

  if (!matchedIngredient)
    return {
      normalizedLine: ingredientLine,
      sortOrder: sortOrder * ingredientsManager.sortOrderMultiplier,
    }
  return ensureSelectedQuantity(matchedIngredient)
}

const buildRecipeName = (index: number) => {
  return `${pick(recipePrefixes)} ${pick(recipeBases)} ${pick(recipeFinishes)} ${index + 1}`
}

const normalizeLikeCreateForm = (data: RecipeRaw): RecipeRaw => {
  const normalizedTags = Array.isArray(data.tags)
    ? data.tags
    : data.tags
        .split(',')
        .map((tag) => tag.trim())
        .filter((tag) => tag !== '')

  return {
    ...data,
    servings: data.servings || 1,
    tags: normalizedTags,
    favorite: data.favorite,
    matchedIngredients:
      data.matchedIngredients.length > 0
        ? data.matchedIngredients.map((matchedIngredient) =>
            ensureSelectedQuantity(matchedIngredient),
          )
        : data.ingredients
          ? ingredientsManager.matchAndNormalize(data.ingredients)
          : [],
  }
}

const buildRandomRecipe = (index: number): RecipeRaw => {
  const ingredientCount = 2 + Math.floor(Math.random() * 4)
  const tags = pickUnique(tagNames, 1 + Math.floor(Math.random() * 2))
  const ingredientLines = Array.from({ length: ingredientCount }, () => buildIngredientLine())
  const matchedIngredients = ingredientLines.map((ingredientLine, index) =>
    buildMatchedIngredient(ingredientLine, index),
  )
  const instructions = [pick(instructionOpeners), pick(instructionTemplates)].join(' ')

  return {
    name: buildRecipeName(index),
    tags: tags.join(', '),
    favorite: Math.random() < 0.5,
    servings: pick(servingValues),
    ingredients: ingredientLines.join('\n'),
    matchedIngredients,
    instructions,
    notes: Math.random() < 0.4 ? pick(noteTemplates) : '',
  }
}

export const seedLocalDB = async () => {
  const existingRecipesCount = await db.recipes.count()
  if (existingRecipesCount > 0) {
    localStorage.setItem(SEED_STORAGE_KEY, 'true')
    return
  }

  const recipesToSeed = Array.from({ length: SEEDED_RECIPE_COUNT }, (_, index) =>
    normalizeLikeCreateForm(buildRandomRecipe(index)),
  )

  for (const recipe of recipesToSeed) {
    await recipesManager.createEdit(recipe)
  }

  localStorage.setItem(SEED_STORAGE_KEY, 'true')
}
