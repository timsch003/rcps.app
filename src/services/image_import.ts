import { createWorker, PSM } from 'tesseract.js'
import { i18n } from '@/lang/i18n'
import type { ImportedRecipeDraft } from '@/types'

const OCR_LANG_BY_LOCALE: Record<string, string> = {
  de: 'deu',
  en: 'eng',
}

function normalizeText(
  text: string,
  options: {
    collapseSingleNewlines?: boolean
    collapseAllWhitespace?: boolean
    removeEmptyLines?: boolean
  } = {},
): string {
  let normalized = text
    .replace(/\r\n?/g, '\n') // Normalize line endings to LF
    .split('\n')
    .map((l) => l.trimEnd())
    .join('\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim()

  if (options.removeEmptyLines)
    normalized = normalized
      .split('\n')
      .map((line) => line.trim())
      .filter((line) => line.length > 0)
      .join('\n')

  if (options.collapseAllWhitespace) normalized = normalized.replace(/\s+/g, ' ').trim()

  if (options.collapseSingleNewlines) normalized = normalized.replace(/(?<!\n)\n(?!\n)/g, ' ')

  return normalized
}

function normalizeTitleText(text: string): string {
  return normalizeText(text, { collapseAllWhitespace: true })
}

function normalizeIngredientsText(text: string): string {
  return normalizeText(text, { removeEmptyLines: true })
}

function normalizeInstructionsText(text: string): string {
  return normalizeText(text, { collapseSingleNewlines: true })
}

function normalizeNotesText(text: string): string {
  return normalizeText(text, { collapseSingleNewlines: true })
}

function getCurrentOcrLanguage(): string {
  const locale = String(i18n.global.locale.value || 'en')
  const baseLocale = locale.toLowerCase().split('-')[0] || 'en'
  const language = OCR_LANG_BY_LOCALE[baseLocale] || 'eng'
  return language
}

async function runOcr(
  worker: Awaited<ReturnType<typeof createWorker>>,
  file: File,
  psm: PSM = PSM.AUTO,
): Promise<string> {
  const preprocessedImage = file
  await worker.setParameters({
    tessedit_pageseg_mode: psm,
  })
  const { data } = await worker.recognize(preprocessedImage)
  return data.text
}

async function importFromImages(
  titleImage: File | null,
  ingredientsImage: File | null,
  instructionsImage: File | null,
  notesImage: File | null,
): Promise<ImportedRecipeDraft> {
  if (!titleImage && !ingredientsImage && !instructionsImage && !notesImage) {
    throw new Error('No screenshot selected for OCR import.')
  }

  const worker = await createWorker(getCurrentOcrLanguage())
  let name = ''
  let ingredients = ''
  let instructions = ''
  let notes = ''

  try {
    if (titleImage) name = normalizeTitleText(await runOcr(worker, titleImage, PSM.SINGLE_LINE))

    if (ingredientsImage)
      ingredients = normalizeIngredientsText(
        await runOcr(worker, ingredientsImage, PSM.SINGLE_BLOCK),
      )

    if (instructionsImage)
      instructions = normalizeInstructionsText(
        await runOcr(worker, instructionsImage, PSM.SINGLE_BLOCK),
      )

    if (notesImage) notes = normalizeNotesText(await runOcr(worker, notesImage, PSM.SINGLE_BLOCK))
  } finally {
    await worker.terminate()
  }

  if (!name && !ingredients && !instructions && !notes) {
    throw new Error('OCR extracted no text from the selected screenshots.')
  }

  return {
    name,
    tags: [],
    ingredients,
    instructions,
    notes,
  }
}

export { importFromImages }
