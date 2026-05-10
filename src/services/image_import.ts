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

function normalizeInstructionsText(text: string): string {
  return text
    .replace(/\r\n?/g, '\n')
    .split('\n')
    .map((l) => l.trimEnd())
    .join('\n')
    .replace(/(?<!\n)\n(?!\n)/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
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
  ingredientsImage: File | null,
  directionsImage: File | null,
): Promise<ImportedRecipeDraft> {
  if (!ingredientsImage && !directionsImage) {
    throw new Error('No screenshot selected for OCR import.')
  }

  const worker = await createWorker(getCurrentOcrLanguage())
  let ingredients = ''
  let instructions = ''

  try {
    if (ingredientsImage) ingredients = normalizeOcrText(await runOcr(worker, ingredientsImage))
    if (directionsImage)
      instructions = normalizeInstructionsText(await runOcr(worker, directionsImage))
  } finally {
    await worker.terminate()
  }

  if (!ingredients && !instructions) {
    throw new Error('OCR extracted no text from the selected screenshots.')
  }

  return {
    name: '',
    tags: [],
    ingredients,
    instructions,
    notes: '',
  }
}

export { importFromImages }
