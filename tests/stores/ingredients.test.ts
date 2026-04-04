import { describe, beforeEach, expect, it } from 'vitest'
import 'fake-indexeddb/auto'
import { db } from '@/services/dexie'
import { setActivePinia, createPinia } from 'pinia'
import { useIngredientsStore } from '/src/stores/ingredients'

let ingredientsStore

describe('Ingredients store', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    ingredientsStore = useIngredientsStore()
  })

  it('stores an ingredient and returns its ID', () => {
    expect(
      ingredientsStore.add([
        {
          quantity: 1,
          knownUnit: 'g',
          textAfterQuantity: 'Salz',
          selected: true,
        },
        {
          quantity: 2,
          knownUnit: 'g',
          textAfterQuantity: 'Pfeffer',
          selected: true,
        },
      ]),
    ).toBeDefined()
  })

  it('gets an ingredient name by ID and vice versa', async () => {
    await db.ingredients.add({
      id: '019d585a-773f-7348-8216-c0529df70afd',
      name: 'Test-Zutat',
    })
    await ingredientsStore.init()

    expect(ingredientsStore.getName('019d585a-773f-7348-8216-c0529df70afd')).toBe('Test-Zutat')

    expect(ingredientsStore.getId('Test-Zutat')).toBe('019d585a-773f-7348-8216-c0529df70afd')
  })
})
