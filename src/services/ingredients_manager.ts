import { db } from '@/adapters/dexie'
import { useIngredientsStore } from '@/stores/ingredients'
import { unitsManager } from './units_manager'
import { unitsSet } from '@/utils/fixed_values'
import { fractionToFloat } from '@/utils/conversion'
import { v7 as uuidv7 } from 'uuid'
import type {
  Ingredient,
  RecipeIngredient,
  MatchedIngredient,
  QuantityUnitText,
  Unit,
  RecipeLocal,
} from '@/types'

async function addRecipeIngredient(
  recipeId: RecipeLocal['id'],
  matchedIngredient: MatchedIngredient,
): Promise<RecipeIngredient['id'] | undefined> {
  let ingredientName: string
  let ingredientId: Ingredient['id']
  let unitId: Unit['id'] | undefined = undefined
  let quantityUnitPosition = 0
  let selectedQut: QuantityUnitText | undefined = undefined
  let singleQut: QuantityUnitText | undefined = undefined

  if (typeof matchedIngredient === 'string') {
    ingredientName = matchedIngredient
  } else {
    // Extract quantity/unit and remove from the ingredient name to ensure compatibility
    // with dynamic quantities/units not placed at the beginning of the ingredient line string.

    let selectedQutIndex = matchedIngredient.findIndex((qut: QuantityUnitText) => qut.selected)
    if (selectedQutIndex === -1) {
      selectedQutIndex = 0
      console.warn(
        'Ingredients manager: no quantity/unit selected for ingredient, defaulting to first detected.',
      )
    }
    selectedQut = matchedIngredient[selectedQutIndex]
    singleQut = !selectedQut ? matchedIngredient[0] : undefined
    const qut = selectedQut || singleQut
    if (!qut) return undefined

    const quantityUnitStringSpace = `${qut.quantity || ''} ${qut.knownUnit || ''}`
    const quantityUnitStringNoSpace = `${qut.quantity || ''}${qut.knownUnit || ''}`
    let quantityUnitString = quantityUnitStringSpace
    quantityUnitPosition = qut.trimmedLine.indexOf(quantityUnitString)
    if (quantityUnitPosition === -1) {
      quantityUnitString = quantityUnitStringNoSpace
      quantityUnitPosition = qut.trimmedLine.indexOf(quantityUnitString)
    }
    ingredientName = qut.trimmedLine.replace(quantityUnitString, '')
  }

  const existingIngredient = await db.ingredients.where({ name: ingredientName }).first()
  if (existingIngredient) {
    ingredientId = existingIngredient.id
    useIngredientsStore().cache(existingIngredient)
  } else {
    const newIngredient: Ingredient = {
      id: uuidv7(),
      name: ingredientName,
    }
    const newIngredientId = await db.ingredients.add(newIngredient)
    ingredientId = newIngredientId
    useIngredientsStore().cache(newIngredient)
  }

  if (selectedQut)
    unitId = selectedQut.knownUnit
      ? await unitsManager.addOrGetExisting(selectedQut.knownUnit)
      : undefined
  else
    unitId = singleQut?.knownUnit
      ? await unitsManager.addOrGetExisting(singleQut.knownUnit)
      : undefined

  const newRecipeIngredient: RecipeIngredient = {
    id: uuidv7(),
    recipeId: recipeId,
    ingredientId: ingredientId,
    quantity: selectedQut?.quantity,
    unitId: unitId,
    quantityUnitPosition: quantityUnitPosition,
  }

  const newRecipeIngredientId = await db.recipe_ingredients.add(newRecipeIngredient)
  return newRecipeIngredientId
}

async function getRecipeIngredients(riIds: RecipeIngredient['id'][]): Promise<RecipeIngredient[]> {
  return await db.recipe_ingredients.where('id').anyOf(riIds).toArray()
}

async function getName(
  recipeIngredient: RecipeIngredient,
): Promise<Ingredient['name'] | undefined> {
  const ingredient = await db.ingredients.get(recipeIngredient.ingredientId)
  return ingredient?.name
}

export function match(ingredients: string): MatchedIngredient[] | [] {
  // Matches integers, decimals, common fractions, fraction characters and mixed numbers
  // (e.g., "1 ½", "1½", "1.5", "1,5", "1/2", "1 1/2", but also "0.0", plus all of those as a range using various dashes)
  // plus everything that follows until the next quantity
  const quantityUnitTextRegex =
    /((?:[1-9]+\s)?\d+\/\d+|\d+[,.]{1}\d+|(?:[1-9]+)?\s?[½⅓⅔¼¾⅕⅖⅗⅘⅙⅚⅐⅛⅜⅝⅞⅑⅒]{1}|\d+)\s?[-–—−~〜～\u2010-\u2015]?\s?(?:(?:[1-9]+\s)?\d+\/\d+|\d+[,.]{1}\d+|(?:[1-9]+)?\s?[½⅓⅔¼¾⅕⅖⅗⅘⅙⅚⅐⅛⅜⅝⅞⅑⅒]{1}|\d+)?(\s?[^0-9½⅓⅔¼¾⅕⅖⅗⅘⅙⅚⅐⅛⅜⅝⅞⅑⅒]+)?/gu

  if (!ingredients.trim()) return []

  const ingredientLines = ingredients.split('\n').filter((line) => line.trim() !== '')

  return ingredientLines.map((line) => {
    const trimmedLine = line.replace(/\s+/g, ' ').trim()

    const parts = []
    let match

    while ((match = quantityUnitTextRegex.exec(trimmedLine)) !== null) {
      const quantity = match[1] && match[1]
      const potentialUnit = match[2] && match[2]
      const knownUnit = potentialUnit?.split(' ').find((part) => unitsSet.has(part.toLowerCase()))
      const textAfterQuantity = knownUnit ? potentialUnit?.replace(knownUnit, '') : potentialUnit

      // check if there is text before the first match and if so add it as the first item in the parts array
      if (parts.length === 0 && match.index > 0) {
        parts.push({
          trimmedLine: trimmedLine,
          textBeforeFirstMatch: trimmedLine.slice(0, match.index).trim(),
        })
      }

      const quantityFloat = quantity && fractionToFloat(quantity)
      const quantityFloatLine = quantityFloat
        ? trimmedLine.replace(quantity, quantityFloat.toString())
        : trimmedLine

      parts.push({
        trimmedLine: quantityFloatLine,
        quantity: (quantity && quantityFloat) || undefined,
        knownUnit: knownUnit || undefined,
        textAfterQuantity: textAfterQuantity || undefined,
        selected: false,
      })
    }

    if (!parts[0]) return trimmedLine
    else {
      parts.find((part) => part.quantity !== undefined)!.selected = true
      return parts
    }
  })
}

export const ingredientsManager = {
  addRecipeIngredient,
  getRecipeIngredients,
  getName,
  match,
}
