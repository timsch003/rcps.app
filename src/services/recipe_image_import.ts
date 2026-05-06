import { env, pipeline } from '@huggingface/transformers'
import type { TextGenerationPipeline } from '@huggingface/transformers'
import { createWorker } from 'tesseract.js'
import type { ImportedRecipeDraft } from '@/types'

const MODEL_ID = 'onnx-community/gemma-3-270m-it-ONNX'
const LOCAL_MODEL_BASE_PATH = '/models/'
const DTYPE_PREFERRED = 'q4f16'
const DTYPE_FALLBACK = 'q4'
const OCR_LANGS = 'eng+deu'

type TextGenerator = TextGenerationPipeline
type ModelDtype = typeof DTYPE_PREFERRED | typeof DTYPE_FALLBACK

let generator: TextGenerator | null = null

type ModelInitCandidate = {
  device: 'webgpu' | 'wasm'
  dtype: ModelDtype
  source: 'local' | 'remote'
}

async function localModelAvailable(): Promise<boolean> {
  try {
    const probeUrl = `${LOCAL_MODEL_BASE_PATH}${MODEL_ID}/config.json`
    const response = await fetch(probeUrl, { method: 'GET', cache: 'no-store' })
    return response.ok
  } catch {
    return false
  }
}

async function localModelLooksValid(): Promise<boolean> {
  try {
    const tokenizerUrl = `${LOCAL_MODEL_BASE_PATH}${MODEL_ID}/tokenizer.json`
    const response = await fetch(tokenizerUrl, { method: 'GET', cache: 'no-store' })
    if (!response.ok) return false

    const firstLine = (await response.text()).split('\n', 1)[0]?.trim() || ''
    // Git LFS pointer files start with this marker and are not usable model artifacts.
    if (firstLine === 'version https://git-lfs.github.com/spec/v1') return false

    return true
  } catch {
    return false
  }
}

function normalizeNewlines(value: string): string {
  return value.replace(/\r\n?/g, '\n')
}

function normalizeParagraphSpacing(value: string): string {
  return normalizeNewlines(value)
    .split('\n')
    .map((line) => line.trimEnd())
    .join('\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
}

function normalizeSingleLine(value: string): string {
  return normalizeParagraphSpacing(value).replace(/\s+/g, ' ').trim()
}

function parseTags(value: string): string[] {
  if (!value) return []

  return value
    .split(',')
    .map((tag) => tag.trim())
    .filter((tag, index, all) => tag !== '' && all.indexOf(tag) === index)
}

function getSection(text: string, section: string, nextSections: string[]): string {
  const next = nextSections.length ? `\\n(?:${nextSections.join('|')}):` : '$'
  const regexp = new RegExp(`${section}:\\s*([\\s\\S]*?)(?=${next}|$)`, 'i')
  const match = text.match(regexp)
  return match?.[1]?.trim() || ''
}

function extractGeneratedText(result: unknown): string {
  if (Array.isArray(result) && result[0] && typeof result[0] === 'object') {
    const first = result[0] as { generated_text?: unknown }
    if (typeof first.generated_text === 'string') return first.generated_text
  }

  return ''
}

async function getGenerator(): Promise<TextGenerator> {
  if (generator) return generator

  env.allowLocalModels = true
  env.allowRemoteModels = true
  env.localModelPath = LOCAL_MODEL_BASE_PATH
  env.useBrowserCache = true

  const supportsWebgpu = typeof navigator !== 'undefined' && 'gpu' in navigator
  const selectedDevice: ModelInitCandidate['device'] = supportsWebgpu ? 'webgpu' : 'wasm'
  const hasLocalModel = (await localModelAvailable()) && (await localModelLooksValid())
  const candidates: ModelInitCandidate[] = hasLocalModel
    ? [
        { device: selectedDevice, dtype: DTYPE_PREFERRED, source: 'local' },
        { device: selectedDevice, dtype: DTYPE_PREFERRED, source: 'remote' },
        { device: selectedDevice, dtype: DTYPE_FALLBACK, source: 'local' },
        { device: selectedDevice, dtype: DTYPE_FALLBACK, source: 'remote' },
      ]
    : [
        { device: selectedDevice, dtype: DTYPE_PREFERRED, source: 'remote' },
        { device: selectedDevice, dtype: DTYPE_FALLBACK, source: 'remote' },
      ]

  const initErrors: string[] = []

  for (const candidate of candidates) {
    try {
      // Remote attempts must bypass local resolution so first run actually downloads.
      env.allowLocalModels = candidate.source === 'local'

      generator = (await pipeline('text-generation', MODEL_ID, {
        device: candidate.device,
        dtype: candidate.dtype,
        local_files_only: candidate.source === 'local',
      })) as TextGenerationPipeline
      return generator
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      initErrors.push(`${candidate.source}:${candidate.device}/${candidate.dtype}: ${msg}`)

      // JSON parse failures are non-recoverable for dtype fallback and typically indicate
      // broken local files (e.g. Git LFS pointers) or invalid responses.
      if (/JSON\.parse/i.test(msg)) break
    }
  }

  throw new Error(
    `Failed to initialize model ${MODEL_ID}. ` +
      `Runtime device: ${selectedDevice}; dtype order: ${DTYPE_PREFERRED} -> ${DTYPE_FALLBACK}. ` +
      `Local files are only used when both config.json and tokenizer.json exist and tokenizer.json is not a Git LFS pointer. ` +
      `Attempt order: local/${DTYPE_PREFERRED}, remote/${DTYPE_PREFERRED}, local/${DTYPE_FALLBACK}, remote/${DTYPE_FALLBACK}. ` +
      `If you cloned from Hugging Face with Git LFS, run 'git lfs pull' in ${LOCAL_MODEL_BASE_PATH}${MODEL_ID}/. ` +
      `Attempts: ${initErrors.join(' | ')}`,
  )
}

async function runOcr(files: File[]): Promise<string> {
  const worker = await createWorker(OCR_LANGS)

  try {
    const ocrTexts: string[] = []

    for (const file of files) {
      const { data } = await worker.recognize(file)
      const normalized = normalizeParagraphSpacing(data.text)
      if (normalized) ocrTexts.push(normalized)
    }

    return normalizeParagraphSpacing(ocrTexts.join('\n\n'))
  } finally {
    await worker.terminate()
  }
}

async function structureRecipe(ocrText: string): Promise<ImportedRecipeDraft> {
  const llm = await getGenerator()

  const prompt = `You are a strict recipe parser.
Your input is OCR text from one or more recipe images.
Return only the following sections exactly, with these uppercase labels:
TITLE:
TAGS:
INGREDIENTS:
INSTRUCTIONS:
NOTES:

Rules:
- TITLE: one single line.
- TAGS: one single comma-separated line, empty if not available.
- INGREDIENTS: one ingredient per line.
- INSTRUCTIONS and NOTES: preserve useful line breaks.
- Never output more than one consecutive empty line.
- Do not add explanations.

OCR TEXT:
${ocrText}`

  const rawResult = await llm(prompt, {
    max_new_tokens: 700,
    do_sample: false,
    temperature: 0.1,
    return_full_text: false,
  })

  const rawText = normalizeParagraphSpacing(extractGeneratedText(rawResult))

  const titleSection = getSection(rawText, 'TITLE', [
    'TAGS',
    'INGREDIENTS',
    'INSTRUCTIONS',
    'NOTES',
  ])
  const tagsSection = getSection(rawText, 'TAGS', ['INGREDIENTS', 'INSTRUCTIONS', 'NOTES'])
  const ingredientsSection = getSection(rawText, 'INGREDIENTS', ['INSTRUCTIONS', 'NOTES'])
  const instructionsSection = getSection(rawText, 'INSTRUCTIONS', ['NOTES'])
  const notesSection = getSection(rawText, 'NOTES', [])

  const fallbackTitle =
    normalizeNewlines(ocrText)
      .split('\n')
      .map((line) => line.trim())
      .find((line) => line) || ''

  return {
    name: normalizeSingleLine(titleSection) || fallbackTitle,
    tags: parseTags(normalizeSingleLine(tagsSection)),
    ingredients:
      normalizeParagraphSpacing(ingredientsSection) || normalizeParagraphSpacing(ocrText),
    instructions: normalizeParagraphSpacing(instructionsSection),
    notes: normalizeParagraphSpacing(notesSection),
  }
}

async function importFromImages(files: File[]): Promise<ImportedRecipeDraft> {
  if (!files.length) throw new Error('No image files selected for recipe import.')

  const ocrText = await runOcr(files)
  if (!ocrText) throw new Error('OCR extracted no text from the selected images.')

  return await structureRecipe(ocrText)
}

export const recipeImageImportManager = {
  importFromImages,
}
