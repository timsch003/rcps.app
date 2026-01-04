export type UUID = `${string}-${string}-${string}-${string}-${string}`

export type IdName = {
  id: UUID
  name: string
}

export type User = {
  id: UUID
  email: string
  verified: boolean
}

export type RecipeIngredient = {
  recipeId: UUID
  ingredientId: UUID
  quantity?: number
  unit?: IdName
  notes?: string
  sortOrder?: number
}

export type Recipe = {
  id: UUID
  userId: UUID
  name: string
  tags?: IdName[]
  recipeIngredients?: RecipeIngredient[]
  instructions?: string
  notes?: string
}
