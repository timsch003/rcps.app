import nlp from 'compromise'
import { createWorker } from 'tesseract.js'
import { fractionsMap, unitsSet } from '@/utils/fixed_values'
import type { ImportedRecipeDraft } from '@/types'

const OCR_LANGS = 'eng+deu'

// Known section header keywords (lowercase, without punctuation)
const INGREDIENT_HEADERS = new Set([
  'ingredients',
  'ingredient',
  'zutaten',
  'zutat',
  'ingredientes',
  'ingrédients',
  'ingredienti',
])
const INSTRUCTION_HEADERS = new Set([
  'instructions',
  'instruction',
  'directions',
  'direction',
  'method',
  'steps',
  'preparation',
  'procedure',
  'zubereitung',
  'anleitung',
  'preparación',
  'préparation',
  'preparazione',
])
const NOTE_HEADERS = new Set([
  'notes',
  'note',
  'tips',
  'tip',
  'remarks',
  'hinweise',
  'hinweis',
  'anmerkungen',
])

type SectionType = 'name' | 'ingredients' | 'instructions' | 'notes'

// Returns the section type if the line is a known section header, otherwise null.
// Only short lines (≤ 4 words, ≤ 60 chars) are considered headers.
function asSectionHeader(line: string): SectionType | null {
  const trimmed = line.trim()
  if (!trimmed || trimmed.length > 60) return null
  const clean = trimmed
    .toLowerCase()
    .replace(/[^a-zäöüßàâæçéèêëïîôœùûüÿ]/g, ' ')
    .trim()
  if (clean.split(/\s+/).length > 4) return null
  if (INGREDIENT_HEADERS.has(clean)) return 'ingredients'
  if (INSTRUCTION_HEADERS.has(clean)) return 'instructions'
  if (NOTE_HEADERS.has(clean)) return 'notes'
  return null
}

// A line looks like an ingredient if it starts with a digit/fraction or contains
// a known measurement unit in the first six words.
function isIngredientLine(line: string): boolean {
  const t = line.trim()
  if (!t) return false
  if (/^\d/.test(t)) return true
  if (Object.keys(fractionsMap).some((f) => t.startsWith(f))) return true
  const words = t.split(/\s+/).slice(0, 6)
  return words.some((w) => unitsSet.has(w.toLowerCase().replace(/[.,;:]+$/, '')))
}

// A line looks like an instruction step if it is numbered or starts with an
// imperative verb (base form, not gerund or past tense).
function isInstructionLine(line: string): boolean {
  const t = line.trim()
  if (!t) return false
  if (/^(\d+[.)]\s|\bstep\s*\d+[:.)]?\s)/i.test(t)) return true
  const firstWord = t.split(/\s+/)[0]
  if (!firstWord) return false
  const doc = nlp(firstWord)
  return doc.has('#Verb') && !doc.has('#Gerund') && !doc.has('#PastTense')
}

// Extract noun phrases from the title as tag candidates.
function extractTagsFromTitle(title: string): string[] {
  const doc = nlp(title)
  return (doc.nouns().out('array') as string[])
    .map((t: string) => t.replace(/\s+/g, ' ').trim())
    .filter((t: string) => t.length > 2 && t.toLowerCase() !== title.toLowerCase())
}

interface RecipeSection {
  type: SectionType
  lines: string[]
}

function structureRecipe(ocrText: string): ImportedRecipeDraft {
  const lines = ocrText
    .replace(/\r\n?/g, '\n')
    .split('\n')
    .map((l) => l.trimEnd())
  const nonEmpty = lines.filter((l) => l.trim())

  if (!nonEmpty.length) {
    return { name: '', tags: [], ingredients: '', instructions: '', notes: '' }
  }

  // --- Pass 1: split into sections by recognised header lines ---
  const sections: RecipeSection[] = []
  let current: RecipeSection = { type: 'name', lines: [] }

  for (const line of nonEmpty) {
    const headerType = asSectionHeader(line)
    if (headerType) {
      if (current.lines.length) sections.push(current)
      current = { type: headerType, lines: [] }
    } else {
      current.lines.push(line)
    }
  }
  if (current.lines.length) sections.push(current)

  const nameSection = sections.find((s) => s.type === 'name')
  const hasExplicitSections =
    sections.some((s) => s.type === 'ingredients') ||
    sections.some((s) => s.type === 'instructions')

  // Recipe name = first non-empty line of the name section
  const name = (nameSection?.lines[0] ?? '').replace(/\s+/g, ' ').trim()
  // Lines after the title in the name section (e.g. subtitle / serving info)
  const nameTail = nameSection?.lines.slice(1) ?? []

  let ingredientLines: string[]
  let instructionLines: string[]
  let noteLines: string[]

  if (hasExplicitSections) {
    // Use recognised sections directly
    ingredientLines = sections.filter((s) => s.type === 'ingredients').flatMap((s) => s.lines)
    instructionLines = sections.filter((s) => s.type === 'instructions').flatMap((s) => s.lines)
    noteLines = [...sections.filter((s) => s.type === 'notes').flatMap((s) => s.lines), ...nameTail]
  } else {
    // Fallback: classify every body line individually
    const bodyLines = nonEmpty.slice(1)
    ingredientLines = []
    instructionLines = []
    noteLines = []
    for (const line of bodyLines) {
      if (isIngredientLine(line)) ingredientLines.push(line)
      else if (isInstructionLine(line)) instructionLines.push(line)
      else noteLines.push(line)
    }
  }

  return {
    name,
    tags: extractTagsFromTitle(name),
    // Plain text as the user would type it — one ingredient per line
    ingredients: ingredientLines.join('\n'),
    instructions: instructionLines.join('\n'),
    notes: noteLines.join('\n'),
  }
}

function normalizeOcrText(text: string): string {
  return text
    .replace(/\r\n?/g, '\n')
    .split('\n')
    .map((l) => l.trimEnd())
    .join('\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
}

async function runOcr(files: File[]): Promise<string> {
  const worker = await createWorker(OCR_LANGS)

  try {
    const ocrTexts: string[] = []

    for (const file of files) {
      const { data } = await worker.recognize(file)
      const normalized = normalizeOcrText(data.text)
      if (normalized) ocrTexts.push(normalized)
    }

    return normalizeOcrText(ocrTexts.join('\n\n'))
  } finally {
    await worker.terminate()
  }
}

async function importFromImages(files: File[]): Promise<ImportedRecipeDraft> {
  if (!files.length) throw new Error('No image files selected for recipe import.')

  const ocrText = await runOcr(files)
  if (!ocrText) throw new Error('OCR extracted no text from the selected images.')

  return structureRecipe(ocrText)
}

export { importFromImages }
