import { db } from '@/adapters/dexie'
import { useTagsStore } from '@/stores/tags'
import { v7 as uuidv7 } from 'uuid'
import type { Tag, UUID } from '@/types'

async function addOrGetExisting(tagName: Tag['name']): Promise<UUID | undefined> {
  const existingTagInStore = useTagsStore().cached.find((t) => t.name === tagName)
  if (existingTagInStore) return existingTagInStore.id

  const existingTagInDb = await db.tags.where('name').equals(tagName).first()
  if (existingTagInDb) return existingTagInDb.id

  const newTag: Tag = {
    id: uuidv7(),
    name: tagName,
  }

  if (newTag.name === '---untagged---') newTag.id = '00000000-0000-0000-0000-000000000000'

  const newTagId = await db.tags.add(newTag)
  if (newTagId) cache(newTag)
  return newTagId
}

function cache(tag: Tag): void {
  const tagsStore = useTagsStore()
  if (tag.name === '---untagged---') tagsStore.cached.unshift(tag)
  else tagsStore.cached.push(tag)
}

async function cacheAll(): Promise<void> {
  useTagsStore().cached = await db.tags.toArray()
}

async function removeOrphanedFromLocal(tagIds: UUID[]): Promise<void> {
  if (!tagIds.length) return

  const uniqueTagIds = [...new Set(tagIds)]
  const orphanedTagIds: UUID[] = []

  for (const tagId of uniqueTagIds) {
    const activeRecipeCount = await db.recipes
      .where('tagIds')
      .equals(tagId)
      .filter((recipe) => !recipe.deleted)
      .limit(1)
      .count()

    if (activeRecipeCount === 0) orphanedTagIds.push(tagId)
  }

  if (!orphanedTagIds.length) return

  await db.tags.bulkDelete(orphanedTagIds)
  const tagsStore = useTagsStore()
  tagsStore.cached = tagsStore.cached.filter((tag) => !orphanedTagIds.includes(tag.id))
}

function getNames(tagIds: UUID[]): Tag['name'][] {
  const tagsStore = useTagsStore()
  return tagIds
    .map((id) => {
      const name = tagsStore.getName(id)
      if (name) return name
      return undefined
    })
    .filter((name): name is Tag['name'] => !!name)
}

export const tagsManager = {
  addOrGetExisting,
  cache,
  cacheAll,
  getNames,
  removeOrphanedFromLocal,
}
