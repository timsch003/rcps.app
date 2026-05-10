<script setup lang="ts">
import { computed, onUnmounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useCreateDraftStore } from '@/stores/create_draft'
import { importFromImages } from '@/services/image_import'
import ButtonMulti from '@/views/components/ButtonMulti.vue'
import { t } from '@/lang/i18n'
import SpinnerIcon from '@/views/icons/IconSpinner.vue'
import XIcon from '@/views/icons/IconX.vue'
import ArrowRight from '@/views/icons/IconArrowRight.vue'

const router = useRouter()
const createDraftStore = useCreateDraftStore()

interface CropRect {
  x: number
  y: number
  width: number
  height: number
}

type CropSlot = 'ingredients' | 'directions'
type ResizeHandle = 'n' | 'e' | 's' | 'w' | 'nw' | 'ne' | 'sw' | 'se'
type InteractionMode = 'create' | 'move' | 'resize'
type DragState = {
  slot: CropSlot
  mode: InteractionMode
  startX: number
  startY: number
  startCrop: CropRect
  handle?: ResizeHandle
}

const MIN_CROP_SIZE = 24

const ingredientsImage = ref<File | null>(null)
const directionsImage = ref<File | null>(null)
const ingredientsImageUrl = ref('')
const directionsImageUrl = ref('')
const ingredientsImageElement = ref<HTMLImageElement | null>(null)
const directionsImageElement = ref<HTMLImageElement | null>(null)
const ingredientsPreviewElement = ref<HTMLDivElement | null>(null)
const directionsPreviewElement = ref<HTMLDivElement | null>(null)
const ingredientsCrop = ref<CropRect | null>(null)
const directionsCrop = ref<CropRect | null>(null)
const dragState = ref<DragState | null>(null)
const processing = ref(false)
const errorMessage = ref('')

const canImport = computed(
  () => (!!ingredientsImage.value || !!directionsImage.value) && !processing.value,
)

function onIngredientsImageChange(e: Event) {
  const input = e.target as HTMLInputElement
  if (ingredientsImageUrl.value) URL.revokeObjectURL(ingredientsImageUrl.value)
  ingredientsImage.value = input.files?.[0] || null
  ingredientsImageUrl.value = ingredientsImage.value
    ? URL.createObjectURL(ingredientsImage.value)
    : ''
  ingredientsCrop.value = null
}

function onDirectionsImageChange(e: Event) {
  const input = e.target as HTMLInputElement
  if (directionsImageUrl.value) URL.revokeObjectURL(directionsImageUrl.value)
  directionsImage.value = input.files?.[0] || null
  directionsImageUrl.value = directionsImage.value ? URL.createObjectURL(directionsImage.value) : ''
  directionsCrop.value = null
}

function getPreviewElement(slot: CropSlot): HTMLDivElement | null {
  return slot === 'ingredients' ? ingredientsPreviewElement.value : directionsPreviewElement.value
}

function getImageElement(slot: CropSlot): HTMLImageElement | null {
  return slot === 'ingredients' ? ingredientsImageElement.value : directionsImageElement.value
}

function getCrop(slot: CropSlot): CropRect | null {
  return slot === 'ingredients' ? ingredientsCrop.value : directionsCrop.value
}

function setCrop(slot: CropSlot, rect: CropRect | null): void {
  if (slot === 'ingredients') {
    ingredientsCrop.value = rect
    return
  }
  directionsCrop.value = rect
}

function getRelativePoint(e: PointerEvent, element: HTMLElement): { x: number; y: number } {
  const bounds = element.getBoundingClientRect()
  const x = Math.max(0, Math.min(e.clientX - bounds.left, bounds.width))
  const y = Math.max(0, Math.min(e.clientY - bounds.top, bounds.height))
  return { x, y }
}

function getPreviewBounds(slot: CropSlot): { width: number; height: number } {
  const preview = getPreviewElement(slot)
  if (!preview) return { width: 0, height: 0 }
  const rect = preview.getBoundingClientRect()
  return { width: rect.width, height: rect.height }
}

function pointInRect(point: { x: number; y: number }, rect: CropRect): boolean {
  return (
    point.x >= rect.x &&
    point.x <= rect.x + rect.width &&
    point.y >= rect.y &&
    point.y <= rect.y + rect.height
  )
}

function clampCropToBounds(crop: CropRect, bounds: { width: number; height: number }): CropRect {
  const width = Math.max(MIN_CROP_SIZE, Math.min(crop.width, bounds.width))
  const height = Math.max(MIN_CROP_SIZE, Math.min(crop.height, bounds.height))
  const x = Math.max(0, Math.min(crop.x, bounds.width - width))
  const y = Math.max(0, Math.min(crop.y, bounds.height - height))
  return { x, y, width, height }
}

function normalizeRect(startX: number, startY: number, endX: number, endY: number): CropRect {
  return {
    x: Math.min(startX, endX),
    y: Math.min(startY, endY),
    width: Math.abs(endX - startX),
    height: Math.abs(endY - startY),
  }
}

function onImageLoaded(slot: CropSlot): void {
  const image = getImageElement(slot)
  if (!image?.clientWidth || !image.clientHeight) return

  setCrop(slot, {
    x: 0,
    y: 0,
    width: image.clientWidth,
    height: image.clientHeight,
  })
}

function onCropPointerDown(slot: CropSlot, e: PointerEvent): void {
  const preview = getPreviewElement(slot)
  if (!preview) return

  const point = getRelativePoint(e, preview)
  const existingCrop = getCrop(slot)

  if (existingCrop && pointInRect(point, existingCrop)) {
    dragState.value = {
      slot,
      mode: 'move',
      startX: point.x,
      startY: point.y,
      startCrop: { ...existingCrop },
    }
  } else {
    const newCrop = { x: point.x, y: point.y, width: 0, height: 0 }
    dragState.value = {
      slot,
      mode: 'create',
      startX: point.x,
      startY: point.y,
      startCrop: newCrop,
    }
    setCrop(slot, newCrop)
  }

  preview.setPointerCapture(e.pointerId)
}

function onCropHandlePointerDown(slot: CropSlot, handle: ResizeHandle, e: PointerEvent): void {
  const preview = getPreviewElement(slot)
  const crop = getCrop(slot)
  if (!preview || !crop) return

  const point = getRelativePoint(e, preview)
  dragState.value = {
    slot,
    mode: 'resize',
    startX: point.x,
    startY: point.y,
    startCrop: { ...crop },
    handle,
  }

  preview.setPointerCapture(e.pointerId)
  e.stopPropagation()
}

function onCropPointerMove(slot: CropSlot, e: PointerEvent): void {
  if (!dragState.value || dragState.value.slot !== slot) return
  const preview = getPreviewElement(slot)
  if (!preview) return

  const point = getRelativePoint(e, preview)
  const bounds = getPreviewBounds(slot)
  const state = dragState.value

  if (state.mode === 'create') {
    const rect = normalizeRect(state.startX, state.startY, point.x, point.y)
    setCrop(slot, rect)
    return
  }

  if (state.mode === 'move') {
    const dx = point.x - state.startX
    const dy = point.y - state.startY
    const next = clampCropToBounds(
      {
        x: state.startCrop.x + dx,
        y: state.startCrop.y + dy,
        width: state.startCrop.width,
        height: state.startCrop.height,
      },
      bounds,
    )
    setCrop(slot, next)
    return
  }

  if (state.mode === 'resize' && state.handle) {
    const dx = point.x - state.startX
    const dy = point.y - state.startY

    const left = state.startCrop.x
    const top = state.startCrop.y
    const right = state.startCrop.x + state.startCrop.width
    const bottom = state.startCrop.y + state.startCrop.height

    let nextLeft = left
    let nextTop = top
    let nextRight = right
    let nextBottom = bottom

    if (state.handle.includes('w')) nextLeft = Math.min(right - MIN_CROP_SIZE, left + dx)
    if (state.handle.includes('e')) nextRight = Math.max(left + MIN_CROP_SIZE, right + dx)
    if (state.handle.includes('n')) nextTop = Math.min(bottom - MIN_CROP_SIZE, top + dy)
    if (state.handle.includes('s')) nextBottom = Math.max(top + MIN_CROP_SIZE, bottom + dy)

    nextLeft = Math.max(0, nextLeft)
    nextTop = Math.max(0, nextTop)
    nextRight = Math.min(bounds.width, nextRight)
    nextBottom = Math.min(bounds.height, nextBottom)

    setCrop(slot, {
      x: nextLeft,
      y: nextTop,
      width: Math.max(MIN_CROP_SIZE, nextRight - nextLeft),
      height: Math.max(MIN_CROP_SIZE, nextBottom - nextTop),
    })
  }
}

function onCropPointerUp(slot: CropSlot, e: PointerEvent): void {
  const preview = getPreviewElement(slot)
  if (preview?.hasPointerCapture(e.pointerId)) preview.releasePointerCapture(e.pointerId)

  const state = dragState.value
  if (!state || state.slot !== slot) return

  const crop = getCrop(slot)
  if (
    state.mode === 'create' &&
    (!crop || crop.width < MIN_CROP_SIZE || crop.height < MIN_CROP_SIZE)
  ) {
    setCrop(slot, null)
  }

  dragState.value = null
}

function onCropPointerCancel(slot: CropSlot, e: PointerEvent): void {
  const preview = getPreviewElement(slot)
  if (preview?.hasPointerCapture(e.pointerId)) preview.releasePointerCapture(e.pointerId)
  if (dragState.value?.slot === slot) dragState.value = null
}

async function ensureImageLoaded(image: HTMLImageElement): Promise<void> {
  if (image.complete && image.naturalWidth > 0) return

  await new Promise<void>((resolve, reject) => {
    image.onload = () => resolve()
    image.onerror = () => reject(new Error('Failed to load image for cropping.'))
  })
}

async function createCroppedImageFile(
  file: File,
  image: HTMLImageElement | null,
  crop: CropRect | null,
  suffix: CropSlot,
): Promise<File> {
  if (!crop || !image) return file

  await ensureImageLoaded(image)

  if (!image.clientWidth || !image.clientHeight || !image.naturalWidth || !image.naturalHeight) {
    return file
  }

  const scaleX = image.naturalWidth / image.clientWidth
  const scaleY = image.naturalHeight / image.clientHeight

  const sx = Math.max(0, Math.min(Math.round(crop.x * scaleX), image.naturalWidth - 1))
  const sy = Math.max(0, Math.min(Math.round(crop.y * scaleY), image.naturalHeight - 1))
  const sw = Math.max(1, Math.min(Math.round(crop.width * scaleX), image.naturalWidth - sx))
  const sh = Math.max(1, Math.min(Math.round(crop.height * scaleY), image.naturalHeight - sy))

  const canvas = document.createElement('canvas')
  canvas.width = sw
  canvas.height = sh

  const context = canvas.getContext('2d')
  if (!context) return file

  context.drawImage(image, sx, sy, sw, sh, 0, 0, sw, sh)

  const blob = await new Promise<Blob | null>((resolve) => {
    canvas.toBlob((result) => resolve(result), 'image/png', 1)
  })
  if (!blob) throw new Error('Failed to crop image.')

  const fileNameRoot = file.name.replace(/\.[^.]+$/, '')
  return new File([blob], `${fileNameRoot}-${suffix}.png`, { type: 'image/png' })
}

async function onImportFromImage() {
  if (!canImport.value) return

  processing.value = true
  errorMessage.value = ''

  try {
    const croppedIngredientsImage = ingredientsImage.value
      ? await createCroppedImageFile(
          ingredientsImage.value,
          ingredientsImageElement.value,
          ingredientsCrop.value,
          'ingredients',
        )
      : null
    const croppedDirectionsImage = directionsImage.value
      ? await createCroppedImageFile(
          directionsImage.value,
          directionsImageElement.value,
          directionsCrop.value,
          'directions',
        )
      : null

    const imported = await importFromImages(croppedIngredientsImage, croppedDirectionsImage)
    createDraftStore.setImportedRecipeDraft(imported)
    router.replace({ name: 'create' })
  } catch (err) {
    errorMessage.value = err instanceof Error ? err.message : t('unknown_error')
  } finally {
    processing.value = false
  }
}

onUnmounted(() => {
  if (ingredientsImageUrl.value) URL.revokeObjectURL(ingredientsImageUrl.value)
  if (directionsImageUrl.value) URL.revokeObjectURL(directionsImageUrl.value)
})
</script>

<template>
  <div class="transition-navs-out-view">
    <ButtonMulti
      class="create_from_image__discard-button"
      :icon="XIcon"
      :desc="t('create_edit.discard')"
      showDesc
      @click="router.back()"
    />

    <h2 id="create_from_image-heading" class="heading--root">
      {{ t('create_from_image.heading') }}
    </h2>

    <div id="create_from_image__ingredients">
      <h3 class="heading--muted">
        {{ t('Ingredients') }}
      </h3>
      <input
        type="file"
        accept="image/*"
        @change="onIngredientsImageChange"
        :aria-label="t('Ingredients')"
      />

      <div
        v-if="ingredientsImageUrl"
        ref="ingredientsPreviewElement"
        class="create_from_image__preview"
        @pointerdown="onCropPointerDown('ingredients', $event)"
        @pointermove="onCropPointerMove('ingredients', $event)"
        @pointerup="onCropPointerUp('ingredients', $event)"
        @pointercancel="onCropPointerCancel('ingredients', $event)"
      >
        <img
          ref="ingredientsImageElement"
          :src="ingredientsImageUrl"
          :alt="t('Ingredients')"
          draggable="false"
          @load="onImageLoaded('ingredients')"
        />
        <div
          v-if="ingredientsCrop"
          class="create_from_image__crop"
          :style="{
            left: `${ingredientsCrop.x}px`,
            top: `${ingredientsCrop.y}px`,
            width: `${ingredientsCrop.width}px`,
            height: `${ingredientsCrop.height}px`,
          }"
        >
          <div
            class="create_from_image__crop-edge create_from_image__crop-edge--n"
            aria-hidden="true"
            @pointerdown="onCropHandlePointerDown('ingredients', 'n', $event)"
          ></div>
          <button
            type="button"
            class="create_from_image__crop-handle create_from_image__crop-handle--nw"
            :aria-label="t('create_from_image.crop_resize')"
            @pointerdown="onCropHandlePointerDown('ingredients', 'nw', $event)"
          ></button>
          <button
            type="button"
            class="create_from_image__crop-handle create_from_image__crop-handle--ne"
            :aria-label="t('create_from_image.crop_resize')"
            @pointerdown="onCropHandlePointerDown('ingredients', 'ne', $event)"
          ></button>
          <div
            class="create_from_image__crop-edge create_from_image__crop-edge--e"
            aria-hidden="true"
            @pointerdown="onCropHandlePointerDown('ingredients', 'e', $event)"
          ></div>
          <div
            class="create_from_image__crop-edge create_from_image__crop-edge--s"
            aria-hidden="true"
            @pointerdown="onCropHandlePointerDown('ingredients', 's', $event)"
          ></div>
          <button
            type="button"
            class="create_from_image__crop-handle create_from_image__crop-handle--sw"
            :aria-label="t('create_from_image.crop_resize')"
            @pointerdown="onCropHandlePointerDown('ingredients', 'sw', $event)"
          ></button>
          <button
            type="button"
            class="create_from_image__crop-handle create_from_image__crop-handle--se"
            :aria-label="t('create_from_image.crop_resize')"
            @pointerdown="onCropHandlePointerDown('ingredients', 'se', $event)"
          ></button>
          <div
            class="create_from_image__crop-edge create_from_image__crop-edge--w"
            aria-hidden="true"
            @pointerdown="onCropHandlePointerDown('ingredients', 'w', $event)"
          ></div>
        </div>
      </div>
    </div>

    <div id="create_from_image__directions">
      <h3 class="heading--muted">
        {{ t('Instructions') }}
      </h3>
      <input
        type="file"
        accept="image/*"
        @change="onDirectionsImageChange"
        :aria-label="t('Instructions')"
      />

      <div
        v-if="directionsImageUrl"
        ref="directionsPreviewElement"
        class="create_from_image__preview"
        @pointerdown="onCropPointerDown('directions', $event)"
        @pointermove="onCropPointerMove('directions', $event)"
        @pointerup="onCropPointerUp('directions', $event)"
        @pointercancel="onCropPointerCancel('directions', $event)"
      >
        <img
          ref="directionsImageElement"
          :src="directionsImageUrl"
          :alt="t('Instructions')"
          draggable="false"
          @load="onImageLoaded('directions')"
        />
        <div
          v-if="directionsCrop"
          class="create_from_image__crop"
          :style="{
            left: `${directionsCrop.x}px`,
            top: `${directionsCrop.y}px`,
            width: `${directionsCrop.width}px`,
            height: `${directionsCrop.height}px`,
          }"
        >
          <div
            class="create_from_image__crop-edge create_from_image__crop-edge--n"
            aria-hidden="true"
            @pointerdown="onCropHandlePointerDown('directions', 'n', $event)"
          ></div>
          <button
            type="button"
            class="create_from_image__crop-handle create_from_image__crop-handle--nw"
            :aria-label="t('create_from_image.crop_resize')"
            @pointerdown="onCropHandlePointerDown('directions', 'nw', $event)"
          ></button>
          <button
            type="button"
            class="create_from_image__crop-handle create_from_image__crop-handle--ne"
            :aria-label="t('create_from_image.crop_resize')"
            @pointerdown="onCropHandlePointerDown('directions', 'ne', $event)"
          ></button>
          <div
            class="create_from_image__crop-edge create_from_image__crop-edge--e"
            aria-hidden="true"
            @pointerdown="onCropHandlePointerDown('directions', 'e', $event)"
          ></div>
          <div
            class="create_from_image__crop-edge create_from_image__crop-edge--s"
            aria-hidden="true"
            @pointerdown="onCropHandlePointerDown('directions', 's', $event)"
          ></div>
          <button
            type="button"
            class="create_from_image__crop-handle create_from_image__crop-handle--sw"
            :aria-label="t('create_from_image.crop_resize')"
            @pointerdown="onCropHandlePointerDown('directions', 'sw', $event)"
          ></button>
          <button
            type="button"
            class="create_from_image__crop-handle create_from_image__crop-handle--se"
            :aria-label="t('create_from_image.crop_resize')"
            @pointerdown="onCropHandlePointerDown('directions', 'se', $event)"
          ></button>
          <div
            class="create_from_image__crop-edge create_from_image__crop-edge--w"
            aria-hidden="true"
            @pointerdown="onCropHandlePointerDown('directions', 'w', $event)"
          ></div>
        </div>
      </div>
    </div>

    <div class="submit">
      <ButtonMulti
        :desc="t('Import')"
        :icon="ArrowRight"
        showDesc
        :disabled="!canImport"
        @click="onImportFromImage"
      />
      <SpinnerIcon v-if="processing" />
    </div>

    <p v-if="errorMessage" class="error">{{ t('error') }}: {{ errorMessage }}</p>
  </div>
</template>

<style scoped>
.create_from_image__discard-button,
#create_from_image__ingredients,
#create_from_image__directions {
  margin: 0;
  margin-bottom: var(--inner-spacing-m);
}

#create_from_image__ingredients > input,
#create_from_image__directions > input {
  margin: 0;
  margin-bottom: 6px;
}

.create_from_image__preview {
  position: relative;
  width: 100%;
  max-width: 40rem;
  overflow: hidden;
  touch-action: none;
  user-select: none;
  cursor: crosshair;
  cursor: move;
}

.create_from_image__preview img {
  display: block;
  width: 100%;
  height: auto;
}

.create_from_image__crop {
  --crop-corner-hit-size: var(--icon-size-s);

  position: absolute;
  border: 2px solid var(--accent);
}

.create_from_image__crop-handle {
  position: absolute;
  z-index: 2;
  width: var(--icon-size-s);
  height: var(--icon-size-s);
  border-radius: 50%;
  border: 2px solid var(--bg);
  background-color: var(--accent);
  transform: translate(-50%, -50%);
  padding: 0;
}

.create_from_image__crop-edge {
  position: absolute;
  z-index: 1;
}

.create_from_image__crop-edge--n,
.create_from_image__crop-edge--s {
  left: calc(var(--crop-corner-hit-size) / 2);
  width: calc(100% - var(--crop-corner-hit-size));
  height: 1rem;
  transform: translateY(-50%);
}

.create_from_image__crop-edge--e,
.create_from_image__crop-edge--w {
  top: calc(var(--crop-corner-hit-size) / 2);
  width: 1rem;
  height: calc(100% - var(--crop-corner-hit-size));
  transform: translateX(-50%);
}

.create_from_image__crop-edge--n {
  top: 0;
  cursor: ns-resize;
}

.create_from_image__crop-handle--nw {
  top: 0;
  left: 0;
  cursor: nwse-resize;
}

.create_from_image__crop-handle--ne {
  top: 0;
  left: 100%;
  cursor: nesw-resize;
}

.create_from_image__crop-edge--e {
  left: 100%;
  cursor: ew-resize;
}

.create_from_image__crop-edge--s {
  top: 100%;
  cursor: ns-resize;
}

.create_from_image__crop-handle--sw {
  top: 100%;
  left: 0;
  cursor: nesw-resize;
}

.create_from_image__crop-handle--se {
  top: 100%;
  left: 100%;
  cursor: nwse-resize;
}

.create_from_image__crop-edge--w {
  left: 0;
  cursor: ew-resize;
}
</style>
