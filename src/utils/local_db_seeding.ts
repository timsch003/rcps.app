import { db } from '@/adapters/dexie'
import { ingredientsManager } from '@/services/ingredients_manager'
import { recipesManager } from '@/services/recipes_manager'
import { unitsSet } from '@/utils/fixed_values'
import type { MatchedIngredient, RecipeRaw } from '@/types'

const SEED_STORAGE_KEY = 'seeded'
const SEEDED_RECIPE_COUNT = 10

const ingredientNames = [
  'all-purpose flour',
  'whole wheat flour',
  'bread flour',
  'almond flour',
  'rolled oats',
  'panko breadcrumbs',
  'white rice',
  'brown rice',
  'quinoa',
  'couscous',
  'spaghetti',
  'penne',
  'udon noodles',
  'ramen noodles',
  'chickpeas',
  'black beans',
  'kidney beans',
  'red lentils',
  'green lentils',
  'tofu',
  'tempeh',
  'paneer',
  'chicken breast',
  'ground turkey',
  'beef strips',
  'salmon fillet',
  'shrimp',
  'eggs',
  'egg whites',
  'whole milk',
  'coconut milk',
  'greek yogurt',
  'heavy cream',
  'butter',
  'olive oil',
  'sesame oil',
  'garlic',
  'ginger',
  'yellow onion',
  'red onion',
  'green onion',
  'shallot',
  'leek',
  'carrot',
  'sweet potato',
  'russet potato',
  'zucchini',
  'eggplant',
  'bell pepper',
  'jalapeno',
  'broccoli florets',
  'cauliflower florets',
  'spinach',
  'kale',
  'arugula',
  'romaine lettuce',
  'cabbage',
  'mushrooms',
  'cherry tomatoes',
  'tomato paste',
  'canned tomatoes',
  'avocado',
  'cucumber',
  'lemon',
  'lime',
  'orange zest',
  'fresh basil',
  'fresh parsley',
  'fresh cilantro',
  'fresh dill',
  'mint leaves',
  'soy sauce',
  'tamari',
  'fish sauce',
  'rice vinegar',
  'apple cider vinegar',
  'honey',
  'maple syrup',
  'brown sugar',
  'white sugar',
  'sea salt',
  'black pepper',
  'paprika',
  'smoked paprika',
  'cumin',
  'coriander',
  'turmeric',
  'curry powder',
  'garam masala',
  'chili flakes',
  'oregano',
  'thyme',
  'rosemary',
  'bay leaf',
  'parmesan',
  'mozzarella',
  'cheddar',
  'feta',
  'walnuts',
  'almonds',
  'cashews',
  'pumpkin seeds',
  'sunflower seeds',
]

const unitNames = Array.from(unitsSet)
  .filter((unit) => /^[a-z ]+$/.test(unit) && unit.length <= 20)
  .filter((unit) => !unit.includes('cubic'))

const quantityValues = [
  '0.1',
  '0,1',
  '0.2',
  '0,2',
  '0.25',
  '0,25',
  '0.3',
  '0,3',
  '0.33',
  '0,33',
  '0.4',
  '0,4',
  '0.5',
  '0,5',
  '0.66',
  '0,66',
  '0.75',
  '0,75',
  '0.8',
  '0,8',
  '1/4',
  '1/3',
  '1/2',
  '2/3',
  '3/4',
  '1',
  '1.1',
  '1,1',
  '1.2',
  '1,2',
  '1 1/4',
  '1.25',
  '1,25',
  '1.33',
  '1,33',
  '1 1/2',
  '1.5',
  '1,5',
  '1 3/4',
  '1.75',
  '1,75',
  '2',
  '2.1',
  '2,1',
  '2.25',
  '2,25',
  '2 1/2',
  '2.5',
  '2,5',
  '2.75',
  '2,75',
  '3',
  '3.25',
  '3,25',
  '3.5',
  '3,5',
  '3.75',
  '3,75',
  '4',
  '4.5',
  '4,5',
  '5',
  '5.5',
  '5,5',
  '6',
  '6.5',
  '6,5',
  '7',
  '7.5',
  '7,5',
  '8',
  '9',
  '10',
]

const ingredientSuffixes = [
  '',
  'finely minced',
  'coarsely chopped',
  'finely chopped',
  'roughly chopped',
  'thinly sliced',
  'thickly sliced',
  'diced',
  'small dice',
  'peeled',
  'crushed',
  'toasted',
  'lightly toasted',
  'rinsed',
  'drained',
  'softened',
  'room temperature',
  'cold',
  'freshly grated',
  'zested',
  'julienned',
  'mashed',
  'divided',
  'plus more for garnish',
]

const tagNames = [
  'Weeknight',
  'Meal Prep',
  'Comfort Food',
  'Family Favorite',
  'Date Night',
  'Batch Cooking',
  'One Pot',
  'One Pan',
  'Sheet Pan',
  'Stovetop',
  'Oven Baked',
  'Grilled',
  'No Bake',
  'Slow Cooker',
  'Air Fryer',
  'High Protein',
  'High Fiber',
  'Low Carb',
  'Low Fat',
  'Gluten Free',
  'Dairy Free',
  'Nut Free',
  'Vegan',
  'Vegetarian',
  'Pescatarian',
  'Kid Friendly',
  'Party Food',
  'Picnic',
  'Potluck',
  'Quick',
  'Under 30 Minutes',
  'Budget',
  'Spicy',
  'Mild',
  'Fresh',
  'Hearty',
  'Cozy',
  'Summer',
  'Autumn',
  'Winter',
  'Spring',
  'Italian Inspired',
  'Mediterranean',
  'Asian Inspired',
  'Mexican Inspired',
  'Middle Eastern',
  'Breakfast',
  'Lunch',
  'Dinner',
  'Snack',
  'Dessert',
]

const recipePrefixes = [
  'Easy',
  'Classic',
  'Spicy',
  'Creamy',
  'Crispy',
  'Fresh',
  'Hearty',
  'Zesty',
  'Roasted',
  'Savory',
  'Herby',
  'Bold',
  'Smoky',
  'Golden',
  'Rustic',
]
const recipeBases = [
  'Salad',
  'Stir-fry',
  'Pasta',
  'Soup',
  'Casserole',
  'Skillet',
  'Curry',
  'Stew',
  'Rice Bowl',
  'Grain Bowl',
  'Tray Bake',
  'Noodle Bowl',
  'Roast',
  'Hash',
  'Frittata',
]
const recipeFinishes = [
  'Delight',
  'Special',
  'Feast',
  'Edition',
  'Remix',
  'Favorite',
  'Twist',
  'Medley',
  'Fusion',
  'Classic',
]
const instructionOpeners = [
  'Gather all ingredients, read through the full method, and set out your tools before beginning.',
  'Start by organizing the prep work so the cooking stage can move quickly and smoothly.',
  'Prepare your mise en place first, keeping wet and dry ingredients grouped separately.',
  'If baking or roasting, preheat the oven and line your tray or dish while you prep.',
]
const instructionPrepTemplates = [
  'Rinse and trim produce, then chop sturdier vegetables slightly smaller so they cook at the same rate as softer ones.',
  'Combine aromatics with a pinch of salt and let them rest for a minute to begin releasing moisture and flavor.',
  'Whisk sauces in a bowl until fully emulsified, scraping the sides so spices are evenly distributed.',
  'Pat proteins dry, season from a little height for even coverage, and let them sit briefly at room temperature.',
]
const instructionCookTemplates = [
  'Cook in batches when needed to avoid crowding, and stir only occasionally so ingredients can caramelize.',
  'Maintain medium heat and adjust as needed to prevent scorching while still building color on the bottom of the pan.',
  'Add firmer ingredients first, then fold in delicate components near the end so texture stays balanced.',
  'Deglaze with a splash of liquid and scrape up browned bits to deepen flavor in the final dish.',
]
const instructionFinishTemplates = [
  'Taste and adjust with salt, acid, or a touch of sweetness until flavors feel bright and well rounded.',
  'Rest the finished dish for a couple of minutes before serving so juices settle and sauce thickens slightly.',
  'Finish with fresh herbs, citrus zest, or toasted seeds for contrast in aroma and texture.',
  'Serve warm with your preferred side, and reserve a little garnish for presentation at the table.',
]
const noteTemplates = [
  'Leftovers keep well in an airtight container for up to 3 days and taste even better the next day.',
  'For meal prep, portion into individual containers and keep garnish separate until serving.',
  'If the dish thickens in storage, loosen with a splash of water, broth, or milk while reheating.',
  'Swap seasonal vegetables freely and keep the seasoning profile similar for reliable results.',
  'A squeeze of lemon or lime right before serving makes the flavors noticeably brighter.',
  'Serve with crusty bread, steamed rice, or a crisp salad depending on how hearty you want the meal.',
]
const noteVariations = [
  'Use less chili for a milder version, or add chili flakes at the table for individual heat control.',
  'Toast nuts and seeds just before serving to preserve crunch and aroma.',
  'Double the sauce if serving with grains so every portion stays well coated.',
  'This recipe scales well for crowds and is easy to hold warm before serving.',
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

const randomInt = (min: number, max: number): number =>
  Math.floor(Math.random() * (max - min + 1)) + min

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

const buildInstructions = () => {
  const prep = pickUnique(instructionPrepTemplates, randomInt(2, 3))
  const cook = pickUnique(instructionCookTemplates, randomInt(2, 3))
  const finish = pickUnique(instructionFinishTemplates, randomInt(1, 2))

  return [pick(instructionOpeners), ...prep, ...cook, ...finish].join(' ')
}

const buildNotes = () => {
  const primaryNotes = pickUnique(noteTemplates, randomInt(2, 3))
  const extra = Math.random() < 0.8 ? [pick(noteVariations)] : []

  return [...primaryNotes, ...extra].join(' ')
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
  const ingredientCount = randomInt(8, 16)
  const tags = index === 0 ? ['---untagged---'] : pickUnique(tagNames, randomInt(3, 7))
  const ingredientLines = Array.from({ length: ingredientCount }, () => buildIngredientLine())
  const matchedIngredients = ingredientLines.map((ingredientLine, index) =>
    buildMatchedIngredient(ingredientLine, index),
  )

  return {
    name: buildRecipeName(index),
    tags: tags.join(', '),
    favorite: Math.random() < 0.5,
    servings: pick(servingValues),
    ingredients: ingredientLines.join('\n'),
    matchedIngredients,
    instructions: buildInstructions(),
    notes: buildNotes(),
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
