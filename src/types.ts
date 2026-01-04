type UUID = `${string}-${string}-${string}-${string}-${string}`
// PocketBase validation pattern for UUIDs: ^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$

export interface User {
  id: UUID
  name: string
}

export type Tag = {
  id: UUID
  name: string
}

export type Ingredient = {
  id: UUID
  name: string
  quantity?: number
  unit?: string
  notes?: string
}

export type Unit = {
  id: UUID
  name: string
}

export interface Recipe {
  id: UUID
  userId: UUID
  name: string
  tags?: Tag[]
  ingredients?: string
  instructions?: string
  notes?: string
}
