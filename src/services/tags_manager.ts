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
}
