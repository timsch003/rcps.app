import { db } from '@/adapters/dexie'
import { useIngredientsStore } from '@/stores/ingredients'
import { unitsManager } from './units_manager'
import { dashes, unitsSet } from '@/utils/fixed_values'
import { fractionToFloat, limitDecimals } from '@/utils/conversion'
import { v7 as uuidv7 } from 'uuid'
import type {
  Ingredient,
  RecipeIngredient,
  MatchedIngredient,
  QuantityUnitText,
  Unit,
  RecipeLocal,
} from '@/types'

// Matches integers, decimals, common fractions, fraction characters and mixed numbers
// (e.g., "1 ½", "1½", "1.5", "1,5", "1/2", "1 1/2", but also "0.0", plus all of those as a range using various dashes)
// plus everything that follows until the next quantity
const quantityUnitTextRegex =
  /((?:(?:[1-9]\d*\s+\d+\/\d+)|(?:\d+\/\d+)|(?:\d+[,.]\d+)|(?:[1-9]\d*\s?[½⅓⅔¼¾⅕⅖⅗⅘⅙⅚⅐⅛⅜⅝⅞⅑⅒])|(?:[½⅓⅔¼¾⅕⅖⅗⅘⅙⅚⅐⅛⅜⅝⅞⅑⅒])|(?:\d+))(?:\s?[-–—−~〜～\u2010-\u2015]\s?(?:(?:[1-9]\d*\s+\d+\/\d+)|(?:\d+\/\d+)|(?:\d+[,.]\d+)|(?:[1-9]\d*\s?[½⅓⅔¼¾⅕⅖⅗⅘⅙⅚⅐⅛⅜⅝⅞⅑⅒])|(?:[½⅓⅔¼¾⅕⅖⅗⅘⅙⅚⅐⅛⅜⅝⅞⅑⅒])|(?:\d+)))?)(\s?[^0-9½⅓⅔¼¾⅕⅖⅗⅘⅙⅚⅐⅛⅜⅝⅞⅑⅒]+)?/gu

const dashesRegex = /\s?[-–—−~〜～\u2010-\u2015]\s?/

async function addRecipeIngredient(
  recipeId: RecipeLocal['id'],
  matchedIngredient: MatchedIngredient,
  index: number,
): Promise<RecipeIngredient['id'] | undefined> {
  let ingredientName: string
  let ingredientId: Ingredient['id']
  let unitId: Unit['id'] | undefined = undefined
  let quantityUnitPosition: number | undefined = undefined
  let selectedQut: QuantityUnitText | undefined = undefined
  let singleQut: QuantityUnitText | undefined = undefined

  if (typeof matchedIngredient === 'string') {
    ingredientName = matchedIngredient
  } else {
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

    const quantityString = `${qut.quantity}${qut.quantityUpper ? dashes[1]! + String(qut.quantityUpper) : ''}`
    let quantityUnitString = `${quantityString}${qut.knownUnit ? ' ' + qut.knownUnit : ''}`
    quantityUnitPosition = qut.normalizedLine.indexOf(quantityUnitString)
    if (quantityUnitPosition === -1)
      quantityUnitString = `${quantityString}${qut.knownUnit ? qut.knownUnit : ''}`
    quantityUnitPosition = qut.normalizedLine.indexOf(quantityUnitString)
    ingredientName = qut.normalizedLine.replace(quantityUnitString, '').trim()
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
    quantityUpper: selectedQut?.quantityUpper,
    unitId: unitId,
    quantityUnitPosition: quantityUnitPosition,
    sortOrder: index * 100, // multiply index by 100 to allow for future reordering without needing to update all recipe ingredients
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
  if (!ingredients.trim()) return []

  const ingredientLines = ingredients.split('\n').filter((line) => line.trim() !== '')

  return ingredientLines.map((line) => {
    const trimmedLine = line.replace(/\s+/g, ' ').trim()

    const parts = []
    let match

    while ((match = quantityUnitTextRegex.exec(trimmedLine)) !== null) {
      const quantity = match[1] && match[1].trim()
      const potentialUnit = match[2] && match[2].trim()
      const knownUnit = potentialUnit
        ?.split(' ')
        .find((part) => unitsSet.has(part.toLowerCase()))
        ?.trim()
      const textAfterQuantity = (
        knownUnit ? potentialUnit?.replace(knownUnit, '') : potentialUnit
      )?.trim()

      const quantityIsRange = quantity && dashesRegex.test(quantity)
      const [lower, upper] = quantity?.split(dashesRegex).map((q) => q.trim()) || []
      let lowerFloat: number = -1
      let upperFloat: number = -1

      if (quantityIsRange && lower && upper) {
        lowerFloat = limitDecimals(fractionToFloat(lower))
        upperFloat = limitDecimals(fractionToFloat(upper))
      } else {
        if (quantity) lowerFloat = limitDecimals(fractionToFloat(quantity))
      }

      const normalizedLine = quantityIsRange
        ? trimmedLine.replace(String(quantity), String(lowerFloat + dashes[1]! + upperFloat))
        : trimmedLine.replace(String(quantity), String(lowerFloat))

      parts.push({
        textBeforeFirstMatch:
          parts.length === 0 && match.index > 0
            ? trimmedLine.slice(0, match.index).trim()
            : undefined,
        normalizedLine: normalizedLine,
        quantity: lowerFloat !== -1 ? lowerFloat : undefined,
        quantityUpper: upperFloat !== -1 ? upperFloat : undefined,
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
