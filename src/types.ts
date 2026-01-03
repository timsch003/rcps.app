export type Tag = {
  id: number
  name: string
}

export interface Recipe {
  id: number
  name: string
  tags: Tag[]
}
