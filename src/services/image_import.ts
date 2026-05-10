import { createWorker } from 'tesseract.js'
import { i18n } from '@/lang/i18n'
import type { ImportedRecipeDraft } from '@/types'

const OCR_LANG_BY_LOCALE: Record<string, string> = {
  de: 'deu',
  en: 'eng',
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

function normalizeText(
  text: string,
  options: { collapseSingleNewlines?: boolean; collapseAllWhitespace?: boolean } = {},
): string {
  const normalized = normalizeOcrText(text)

  if (options.collapseAllWhitespace) {
    return normalized.replace(/\s+/g, ' ').trim()
  }

  if (options.collapseSingleNewlines) {
    return normalized.replace(/(?<!\n)\n(?!\n)/g, ' ')
  }

  return normalized
}

function normalizeInstructionsText(text: string): string {
  return normalizeText(text, { collapseSingleNewlines: true })
}

function normalizeTitleText(text: string): string {
  return normalizeText(text, { collapseAllWhitespace: true })
}

function getCurrentOcrLanguage(): string {
  const locale = String(i18n.global.locale.value || 'en')
  const baseLocale = locale.toLowerCase().split('-')[0] || 'en'
  return OCR_LANG_BY_LOCALE[baseLocale] || 'eng'
}

async function runOcr(
  worker: Awaited<ReturnType<typeof createWorker>>,
  file: File,
): Promise<string> {
  const { data } = await worker.recognize(file)
  return data.text
}

async function importFromImages(
  titleImage: File | null,
  ingredientsImage: File | null,
  directionsImage: File | null,
  notesImage: File | null,
): Promise<ImportedRecipeDraft> {
  if (!titleImage && !ingredientsImage && !directionsImage && !notesImage) {
    throw new Error('No screenshot selected for OCR import.')
  }

  const worker = await createWorker(getCurrentOcrLanguage())
  let name = ''
  let ingredients = ''
  let instructions = ''
  let notes = ''

  try {
    if (titleImage) name = normalizeTitleText(await runOcr(worker, titleImage))
    if (ingredientsImage) ingredients = await runOcr(worker, ingredientsImage)
    if (directionsImage)
      instructions = normalizeInstructionsText(await runOcr(worker, directionsImage))
    if (notesImage) notes = normalizeInstructionsText(await runOcr(worker, notesImage))
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
