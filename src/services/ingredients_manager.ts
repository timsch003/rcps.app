import { db } from '@/adapters/dexie'
import { useIngredientsStore } from '@/stores/ingredients'
import { unitsManager } from './units_manager'
import { dashes, unitsSet } from '@/utils/fixed_values'
import { fractionToFloat, limitDecimals } from '@/utils/conversion'
import { normalizeName } from '@/utils/normalize_name'
import { t } from '@/lang/i18n'
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

// Enable reordering ingredients without updating all of them
const sortOrderMultiplier = 100

async function addOrGetExisting(ingredientName: Ingredient['name']): Promise<Ingredient['id']> {
  const normalizedIngredientName = normalizeName(ingredientName)

  const existingIngredientInDb = await db.ingredients
    .where('name')
    .equals(normalizedIngredientName)
    .first()
  if (existingIngredientInDb) return existingIngredientInDb.id

  const newIngredient: Ingredient = {
    id: uuidv7(),
    name: normalizedIngredientName,
  }

  const newIngredientId = await db.ingredients.add(newIngredient)
  useIngredientsStore().cache(newIngredient)
  return newIngredientId
}

async function addRecipeIngredient(
  recipeId: RecipeLocal['id'],
  matchedIngredient: MatchedIngredient,
): Promise<RecipeIngredient['id'] | undefined> {
  let ingredientName: string
  let unitId: Unit['id'] | undefined = undefined
  let quantityUnitPosition: number | undefined = undefined
  let selectedQut: QuantityUnitText | undefined = undefined
  let singleQut: QuantityUnitText | undefined = undefined

  if (!matchedIngredient.parts) {
    ingredientName = normalizeName(matchedIngredient.normalizedLine)
  } else {
    let selectedQutIndex = matchedIngredient.parts.findIndex(
      (qut: QuantityUnitText) => qut.selected,
    )
    if (selectedQutIndex === -1) {
      selectedQutIndex = 0
      console.warn(
        'Ingredients manager: no quantity/unit selected for ingredient, defaulting to first detected.',
      )
    }
    selectedQut = matchedIngredient.parts[selectedQutIndex]
    singleQut = !selectedQut ? matchedIngredient.parts[0] : undefined
    const qut = selectedQut || singleQut
    if (!qut) return undefined

    const quantityString = `${qut.quantity}${qut.quantityUpper ? dashes[1]! + String(qut.quantityUpper) : ''}`
    let quantityUnitString = `${quantityString}${qut.knownUnit ? ' ' + qut.knownUnit : ''}`
    quantityUnitPosition = matchedIngredient.normalizedLine.indexOf(quantityUnitString)
    if (quantityUnitPosition === -1)
      quantityUnitString = `${quantityString}${qut.knownUnit ? qut.knownUnit : ''}`
    quantityUnitPosition = matchedIngredient.normalizedLine.indexOf(quantityUnitString)
    ingredientName = normalizeName(
      matchedIngredient.normalizedLine.replace(quantityUnitString, '').trim(),
    )
  }

  if (selectedQut)
    unitId = selectedQut.knownUnit
      ? await unitsManager.addOrGetExisting(selectedQut.knownUnit)
      : undefined
  else
    unitId = singleQut?.knownUnit
      ? await unitsManager.addOrGetExisting(singleQut.knownUnit)
      : undefined

  const ingredientId: Ingredient['id'] = await addOrGetExisting(ingredientName)

  const newRecipeIngredient: RecipeIngredient = {
    id: uuidv7(),
    recipeId: recipeId,
    ingredientId: ingredientId,
    quantity: selectedQut?.quantity,
    quantityUpper: selectedQut?.quantityUpper,
    unitId: unitId,
    quantityUnitPosition: quantityUnitPosition,
    sortOrder: matchedIngredient.sortOrder,
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

export function matchAndNormalize(ingredients: string): MatchedIngredient[] | [] {
  if (!ingredients.trim()) return []

  const ingredientLines = ingredients.split('\n')

  return ingredientLines.map((line, index) => {
    const trimmedLine = line.replace(/\s+/g, ' ').trim()
    let normalizedLine = trimmedLine
    let textBeforeFirstMatch: string | undefined

    const parts: QuantityUnitText[] = []
    let match

    while ((match = quantityUnitTextRegex.exec(trimmedLine)) !== null) {
      const quantity = match[1] && match[1].trim()
      const quantityNormalized = quantity && quantity.replace(',', '.')
      const potentialUnit = match[2] && match[2] // Don't trim this yet!
      const knownUnit = potentialUnit
        ?.split(' ')
        .find((part) => unitsSet.has(part.toLowerCase()))
        ?.trim()

      // Preserve leading space to ensure sensible spacing when reconstructing the normalized line
      const textAfterQuantity = (knownUnit ? potentialUnit?.replace(knownUnit, '') : potentialUnit)
        ?.trimEnd()
        .replace(/^\s+/g, ' ')

      const quantityIsRange = quantityNormalized && dashesRegex.test(quantityNormalized)
      const [lower, upper] = quantityNormalized?.split(dashesRegex).map((q) => q.trim()) || []
      let lowerFloat: number = -1
      let upperFloat: number = -1

      if (quantityIsRange && lower && upper) {
        lowerFloat = limitDecimals(fractionToFloat(lower))
        upperFloat = limitDecimals(fractionToFloat(upper))
      } else {
        if (quantityNormalized) lowerFloat = limitDecimals(fractionToFloat(quantityNormalized))
      }

      if (parts.length === 0 && match.index > 0) {
        textBeforeFirstMatch = trimmedLine.slice(0, match.index).trim()
      }

      const normalizedQuantity = quantityIsRange
        ? String(lowerFloat + dashes[1]! + upperFloat)
        : String(lowerFloat)

      normalizedLine = normalizedLine.replace(String(quantity), normalizedQuantity)

      parts.push({
        quantity: lowerFloat !== -1 ? lowerFloat : undefined,
        quantityUpper: upperFloat !== -1 ? upperFloat : undefined,
        knownUnit: knownUnit || undefined,
        textAfterQuantity: textAfterQuantity || undefined,
        selected: false,
      })
    }

    if (!parts[0]) return { normalizedLine: trimmedLine, sortOrder: index * sortOrderMultiplier }

    const firstQuantityPartIndex = parts.findIndex((part) => part.quantity !== undefined)
    if (firstQuantityPartIndex !== -1 && parts[firstQuantityPartIndex])
      parts[firstQuantityPartIndex].selected = true

    return {
      normalizedLine,
      textBeforeFirstMatch,
      parts,
      sortOrder: index * sortOrderMultiplier,
    }
  })
}

async function getIngStrings(ri: RecipeIngredient): Promise<string[] | undefined> {
  try {
    const ingredientName = await getName(ri)

    if (!ingredientName) return undefined
    if (!ri.quantity) return [ingredientName]
    if (ri.quantityUnitPosition === undefined) throw new Error(t('error.no_quantity_position'))

    const stringBefore = ingredientName.substring(0, ri.quantityUnitPosition)
    const quantityString = `${String(limitDecimals(ri.quantity))}${ri.quantityUpper ? dashes[1]! + String(limitDecimals(ri.quantityUpper)) : ''}`
    const stringAfter = ingredientName.substring(ri.quantityUnitPosition)
    const leadingSpace = stringBefore ? ' ' : ''
    const trailingSpace = stringAfter ? ' ' : ''

    if (ri.unitId)
      return [
        stringBefore,
        `${leadingSpace}${quantityString} ${String(unitsManager.getNameById(ri.unitId))}${trailingSpace}`,
        stringAfter,
      ]
    else return [stringBefore, `${leadingSpace}${quantityString}${trailingSpace}`, stringAfter]
  } catch (err) {
    throw err instanceof Error ? err : new Error(String(err))
  }
}

export const ingredientsManager = {
  sortOrderMultiplier,
  addOrGetExisting,
  addRecipeIngredient,
  getRecipeIngredients,
  getName,
  getIngStrings,
  matchAndNormalize,
}
