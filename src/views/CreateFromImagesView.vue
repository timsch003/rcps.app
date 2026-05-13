<script setup lang="ts">
import { computed, onUnmounted, ref } from 'vue'
import { useFileDialog } from '@vueuse/core'
import { useRouter } from 'vue-router'
import { useCreateDraftStore } from '@/stores/create_draft'
import { importFromImages } from '@/services/image_import'
import ButtonMulti from '@/views/components/ButtonMulti.vue'
import { t } from '@/lang/i18n'
import SpinnerIcon from '@/views/icons/IconSpinner.vue'
import XIcon from '@/views/icons/IconX.vue'
import ArrowRightIcon from '@/views/icons/IconArrowRight.vue'
import TrashIcon from '@/views/icons/IconTrash.vue'

const router = useRouter()
const createDraftStore = useCreateDraftStore()

interface CropRect {
  x: number
  y: number
  width: number
  height: number
}

type CropSlot = 'title' | 'ingredients' | 'directions' | 'notes'
type ResizeHandle = 'n' | 'e' | 's' | 'w' | 'nw' | 'ne' | 'sw' | 'se'
type InteractionMode = 'resize'
type DragState = {
  slot: CropSlot
  mode: InteractionMode
  startX: number
  startY: number
  startCrop: CropRect
  handle?: ResizeHandle
}

const MIN_CROP_SIZE = 12

const titleImage = ref<File | null>(null)
const ingredientsImage = ref<File | null>(null)
const directionsImage = ref<File | null>(null)
const notesImage = ref<File | null>(null)
const titleImageUrl = ref('')
const ingredientsImageUrl = ref('')
const directionsImageUrl = ref('')
const notesImageUrl = ref('')
const titleImageElement = ref<HTMLImageElement | null>(null)
const ingredientsImageElement = ref<HTMLImageElement | null>(null)
const directionsImageElement = ref<HTMLImageElement | null>(null)
const notesImageElement = ref<HTMLImageElement | null>(null)
const titlePreviewElement = ref<HTMLDivElement | null>(null)
const ingredientsPreviewElement = ref<HTMLDivElement | null>(null)
const directionsPreviewElement = ref<HTMLDivElement | null>(null)
const notesPreviewElement = ref<HTMLDivElement | null>(null)
const titleCrop = ref<CropRect | null>(null)
const ingredientsCrop = ref<CropRect | null>(null)
const directionsCrop = ref<CropRect | null>(null)
const notesCrop = ref<CropRect | null>(null)
const dragState = ref<DragState | null>(null)
const isActiveCropDrag = ref(false)
const shortcutImageFile = ref<File | null>(null)
const processing = ref(false)
const errorMessage = ref('')

const canImport = computed(
  () =>
    (!!titleImage.value ||
      !!ingredientsImage.value ||
      !!directionsImage.value ||
      !!notesImage.value) &&
    !processing.value,
)

function updateShortcutImage(slot: CropSlot, file: File | null): void {
  if (!file) return
  shortcutImageFile.value = file
}

function setSlotImage(slot: CropSlot, file: File | null): void {
  switch (slot) {
    case 'title':
      if (titleImageUrl.value) URL.revokeObjectURL(titleImageUrl.value)
      titleImage.value = file
      titleImageUrl.value = file ? URL.createObjectURL(file) : ''
      titleCrop.value = null
      break
    case 'ingredients':
      if (ingredientsImageUrl.value) URL.revokeObjectURL(ingredientsImageUrl.value)
      ingredientsImage.value = file
      ingredientsImageUrl.value = file ? URL.createObjectURL(file) : ''
      ingredientsCrop.value = null
      break
    case 'directions':
      if (directionsImageUrl.value) URL.revokeObjectURL(directionsImageUrl.value)
      directionsImage.value = file
      directionsImageUrl.value = file ? URL.createObjectURL(file) : ''
      directionsCrop.value = null
      break
    case 'notes':
      if (notesImageUrl.value) URL.revokeObjectURL(notesImageUrl.value)
      notesImage.value = file
      notesImageUrl.value = file ? URL.createObjectURL(file) : ''
      notesCrop.value = null
      break
  }
}

const fileDialogTargetSlot = ref<CropSlot>('title')
const { open: openFileDialog, onChange: onFileDialogChange } = useFileDialog({
  multiple: false,
  accept: 'image/*',
})

onFileDialogChange((files) => {
  const file = files?.item(0) || null
  setSlotImage(fileDialogTargetSlot.value, file)
  updateShortcutImage(fileDialogTargetSlot.value, file)
})

function onBrowseImage(slot: CropSlot): void {
  fileDialogTargetSlot.value = slot
  openFileDialog()
}

function getPreviewElement(slot: CropSlot): HTMLDivElement | null {
  if (slot === 'title') return titlePreviewElement.value
  if (slot === 'ingredients') return ingredientsPreviewElement.value
  if (slot === 'directions') return directionsPreviewElement.value
  return notesPreviewElement.value
}

function getImageElement(slot: CropSlot): HTMLImageElement | null {
  if (slot === 'title') return titleImageElement.value
  if (slot === 'ingredients') return ingredientsImageElement.value
  if (slot === 'directions') return directionsImageElement.value
  return notesImageElement.value
}

function getCrop(slot: CropSlot): CropRect | null {
  if (slot === 'title') return titleCrop.value
  if (slot === 'ingredients') return ingredientsCrop.value
  if (slot === 'directions') return directionsCrop.value
  return notesCrop.value
}

function setCrop(slot: CropSlot, rect: CropRect | null): void {
  if (slot === 'title') {
    titleCrop.value = rect
    return
  }
  if (slot === 'ingredients') {
    ingredientsCrop.value = rect
    return
  }
  if (slot === 'directions') {
    directionsCrop.value = rect
    return
  }
  notesCrop.value = rect
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
  isActiveCropDrag.value = true

  preview.setPointerCapture(e.pointerId)
  e.stopImmediatePropagation()
}

function onCropPointerMove(slot: CropSlot, e: PointerEvent): void {
  if (!dragState.value || dragState.value.slot !== slot) return
  const preview = getPreviewElement(slot)
  if (!preview) return

  const point = getRelativePoint(e, preview)
  const bounds = getPreviewBounds(slot)
  const state = dragState.value

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

  dragState.value = null
  isActiveCropDrag.value = false
}

function onCropPointerCancel(slot: CropSlot, e: PointerEvent): void {
  const preview = getPreviewElement(slot)
  if (preview?.hasPointerCapture(e.pointerId)) preview.releasePointerCapture(e.pointerId)
  if (dragState.value?.slot === slot) {
    dragState.value = null
    isActiveCropDrag.value = false
  }
}

function onCropTouchMove(e: TouchEvent): void {
  if (isActiveCropDrag.value) {
    e.preventDefault()
  }
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
    const croppedTitleImage = titleImage.value
      ? await createCroppedImageFile(
          titleImage.value,
          titleImageElement.value,
          titleCrop.value,
          'title',
        )
      : null
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
    const croppedNotesImage = notesImage.value
      ? await createCroppedImageFile(
          notesImage.value,
          notesImageElement.value,
          notesCrop.value,
          'notes',
        )
      : null

    const imported = await importFromImages(
      croppedTitleImage,
      croppedIngredientsImage,
      croppedDirectionsImage,
      croppedNotesImage,
    )
    createDraftStore.setImportedRecipeDraft(imported)
    router.replace({ name: 'create' })
  } catch (err) {
    errorMessage.value = err instanceof Error ? err.message : t('unknown_error')
  } finally {
    processing.value = false
  }
}

onUnmounted(() => {
  if (titleImageUrl.value) URL.revokeObjectURL(titleImageUrl.value)
  if (ingredientsImageUrl.value) URL.revokeObjectURL(ingredientsImageUrl.value)
  if (directionsImageUrl.value) URL.revokeObjectURL(directionsImageUrl.value)
  if (notesImageUrl.value) URL.revokeObjectURL(notesImageUrl.value)
})
</script>

<template>
  <div class="transition-navs-out-view">
    <ButtonMulti
      class="create_from_images__discard-button"
      :icon="XIcon"
      :desc="t('create_edit.discard')"
      showDesc
      @click="router.replace($route.meta.fromPath || { name: 'tags' })"
    />

    <h2 id="create_from_images-heading" class="heading--root">
      {{ t('create_from_images.heading') }}
    </h2>

    <div id="create_from_images__title">
      <h3 class="heading--muted heading--buttons">
        {{ t('Name') }}
        <ButtonMulti
          v-if="titleImageUrl"
          :desc="t('Remove')"
          :icon="TrashIcon"
          inline
          @click="setSlotImage('title', null)"
        />
      </h3>
      <div class="create_from_images__image-actions">
        <ButtonMulti :desc="t('Browse')" showDesc smallText @click="onBrowseImage('title')" />
        <ButtonMulti
          v-if="shortcutImageFile"
          :desc="t('create_from_images.use_last')"
          showDesc
          smallText
          @click="setSlotImage('title', shortcutImageFile)"
        />
      </div>

      <div
        v-if="titleImageUrl"
        ref="titlePreviewElement"
        class="create_from_images__preview"
        @pointermove="onCropPointerMove('title', $event)"
        @pointerup="onCropPointerUp('title', $event)"
        @pointercancel="onCropPointerCancel('title', $event)"
      >
        <img
          ref="titleImageElement"
          :src="titleImageUrl"
          :alt="t('Name')"
          draggable="false"
          @load="onImageLoaded('title')"
        />
        <div
          v-if="titleCrop"
          class="create_from_images__crop"
          :style="{
            left: `${titleCrop.x}px`,
            top: `${titleCrop.y}px`,
            width: `${titleCrop.width}px`,
            height: `${titleCrop.height}px`,
          }"
          @touchmove="onCropTouchMove"
        >
          <div
            class="create_from_images__crop-edge create_from_images__crop-edge--n"
            aria-hidden="true"
            @pointerdown="onCropHandlePointerDown('title', 'n', $event)"
          ></div>
          <button
            type="button"
            class="create_from_images__crop-handle create_from_images__crop-handle--nw"
            :aria-label="t('create_from_images.crop_resize')"
            @pointerdown="onCropHandlePointerDown('title', 'nw', $event)"
          ></button>
          <button
            type="button"
            class="create_from_images__crop-handle create_from_images__crop-handle--ne"
            :aria-label="t('create_from_images.crop_resize')"
            @pointerdown="onCropHandlePointerDown('title', 'ne', $event)"
          ></button>
          <div
            class="create_from_images__crop-edge create_from_images__crop-edge--e"
            aria-hidden="true"
            @pointerdown="onCropHandlePointerDown('title', 'e', $event)"
          ></div>
          <div
            class="create_from_images__crop-edge create_from_images__crop-edge--s"
            aria-hidden="true"
            @pointerdown="onCropHandlePointerDown('title', 's', $event)"
          ></div>
          <button
            type="button"
            class="create_from_images__crop-handle create_from_images__crop-handle--sw"
            :aria-label="t('create_from_images.crop_resize')"
            @pointerdown="onCropHandlePointerDown('title', 'sw', $event)"
          ></button>
          <button
            type="button"
            class="create_from_images__crop-handle create_from_images__crop-handle--se"
            :aria-label="t('create_from_images.crop_resize')"
            @pointerdown="onCropHandlePointerDown('title', 'se', $event)"
          ></button>
          <div
            class="create_from_images__crop-edge create_from_images__crop-edge--w"
            aria-hidden="true"
            @pointerdown="onCropHandlePointerDown('title', 'w', $event)"
          ></div>
        </div>
      </div>
    </div>

    <div id="create_from_images__ingredients">
      <h3 class="heading--muted heading--buttons">
        {{ t('Ingredients') }}
        <ButtonMulti
          v-if="ingredientsImageUrl"
          :desc="t('Remove')"
          :icon="TrashIcon"
          inline
          @click="setSlotImage('ingredients', null)"
        />
      </h3>
      <div class="create_from_images__image-actions">
        <ButtonMulti :desc="t('Browse')" showDesc smallText @click="onBrowseImage('ingredients')" />
        <ButtonMulti
          v-if="shortcutImageFile"
          :desc="t('create_from_images.use_last')"
          showDesc
          smallText
          @click="setSlotImage('ingredients', shortcutImageFile)"
        />
      </div>

      <div
        v-if="ingredientsImageUrl"
        ref="ingredientsPreviewElement"
        class="create_from_images__preview"
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
          class="create_from_images__crop"
          :style="{
            left: `${ingredientsCrop.x}px`,
            top: `${ingredientsCrop.y}px`,
            width: `${ingredientsCrop.width}px`,
            height: `${ingredientsCrop.height}px`,
          }"
          @touchmove="onCropTouchMove"
        >
          <div
            class="create_from_images__crop-edge create_from_images__crop-edge--n"
            aria-hidden="true"
            @pointerdown="onCropHandlePointerDown('ingredients', 'n', $event)"
          ></div>
          <button
            type="button"
            class="create_from_images__crop-handle create_from_images__crop-handle--nw"
            :aria-label="t('create_from_images.crop_resize')"
            @pointerdown="onCropHandlePointerDown('ingredients', 'nw', $event)"
          ></button>
          <button
            type="button"
            class="create_from_images__crop-handle create_from_images__crop-handle--ne"
            :aria-label="t('create_from_images.crop_resize')"
            @pointerdown="onCropHandlePointerDown('ingredients', 'ne', $event)"
          ></button>
          <div
            class="create_from_images__crop-edge create_from_images__crop-edge--e"
            aria-hidden="true"
            @pointerdown="onCropHandlePointerDown('ingredients', 'e', $event)"
          ></div>
          <div
            class="create_from_images__crop-edge create_from_images__crop-edge--s"
            aria-hidden="true"
            @pointerdown="onCropHandlePointerDown('ingredients', 's', $event)"
          ></div>
          <button
            type="button"
            class="create_from_images__crop-handle create_from_images__crop-handle--sw"
            :aria-label="t('create_from_images.crop_resize')"
            @pointerdown="onCropHandlePointerDown('ingredients', 'sw', $event)"
          ></button>
          <button
            type="button"
            class="create_from_images__crop-handle create_from_images__crop-handle--se"
            :aria-label="t('create_from_images.crop_resize')"
            @pointerdown="onCropHandlePointerDown('ingredients', 'se', $event)"
          ></button>
          <div
            class="create_from_images__crop-edge create_from_images__crop-edge--w"
            aria-hidden="true"
            @pointerdown="onCropHandlePointerDown('ingredients', 'w', $event)"
          ></div>
        </div>
      </div>
    </div>

    <div id="create_from_images__directions">
      <h3 class="heading--muted heading--buttons">
        {{ t('Instructions') }}
        <ButtonMulti
          v-if="directionsImageUrl"
          :desc="t('Remove')"
          :icon="TrashIcon"
          inline
          @click="setSlotImage('directions', null)"
        />
      </h3>
      <div class="create_from_images__image-actions">
        <ButtonMulti :desc="t('Browse')" showDesc smallText @click="onBrowseImage('directions')" />
        <ButtonMulti
          v-if="shortcutImageFile"
          :desc="t('create_from_images.use_last')"
          showDesc
          smallText
          @click="setSlotImage('directions', shortcutImageFile)"
        />
      </div>

      <div
        v-if="directionsImageUrl"
        ref="directionsPreviewElement"
        class="create_from_images__preview"
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
          class="create_from_images__crop"
          :style="{
            left: `${directionsCrop.x}px`,
            top: `${directionsCrop.y}px`,
            width: `${directionsCrop.width}px`,
            height: `${directionsCrop.height}px`,
          }"
          @touchmove="onCropTouchMove"
        >
          <div
            class="create_from_images__crop-edge create_from_images__crop-edge--n"
            aria-hidden="true"
            @pointerdown="onCropHandlePointerDown('directions', 'n', $event)"
          ></div>
          <button
            type="button"
            class="create_from_images__crop-handle create_from_images__crop-handle--nw"
            :aria-label="t('create_from_images.crop_resize')"
            @pointerdown="onCropHandlePointerDown('directions', 'nw', $event)"
          ></button>
          <button
            type="button"
            class="create_from_images__crop-handle create_from_images__crop-handle--ne"
            :aria-label="t('create_from_images.crop_resize')"
            @pointerdown="onCropHandlePointerDown('directions', 'ne', $event)"
          ></button>
          <div
            class="create_from_images__crop-edge create_from_images__crop-edge--e"
            aria-hidden="true"
            @pointerdown="onCropHandlePointerDown('directions', 'e', $event)"
          ></div>
          <div
            class="create_from_images__crop-edge create_from_images__crop-edge--s"
            aria-hidden="true"
            @pointerdown="onCropHandlePointerDown('directions', 's', $event)"
          ></div>
          <button
            type="button"
            class="create_from_images__crop-handle create_from_images__crop-handle--sw"
            :aria-label="t('create_from_images.crop_resize')"
            @pointerdown="onCropHandlePointerDown('directions', 'sw', $event)"
          ></button>
          <button
            type="button"
            class="create_from_images__crop-handle create_from_images__crop-handle--se"
            :aria-label="t('create_from_images.crop_resize')"
            @pointerdown="onCropHandlePointerDown('directions', 'se', $event)"
          ></button>
          <div
            class="create_from_images__crop-edge create_from_images__crop-edge--w"
            aria-hidden="true"
            @pointerdown="onCropHandlePointerDown('directions', 'w', $event)"
          ></div>
        </div>
      </div>
    </div>

    <div id="create_from_images__notes">
      <h3 class="heading--muted heading--buttons">
        {{ t('Notes') }}
        <ButtonMulti
          v-if="notesImageUrl"
          :desc="t('Remove')"
          :icon="TrashIcon"
          inline
          @click="setSlotImage('notes', null)"
        />
      </h3>
      <div class="create_from_images__image-actions">
        <ButtonMulti :desc="t('Browse')" showDesc smallText @click="onBrowseImage('notes')" />
        <ButtonMulti
          v-if="shortcutImageFile"
          :desc="t('create_from_images.use_last')"
          showDesc
          smallText
          @click="setSlotImage('notes', shortcutImageFile)"
        />
      </div>

      <div
        v-if="notesImageUrl"
        ref="notesPreviewElement"
        class="create_from_images__preview"
        @pointermove="onCropPointerMove('notes', $event)"
        @pointerup="onCropPointerUp('notes', $event)"
        @pointercancel="onCropPointerCancel('notes', $event)"
      >
        <img
          ref="notesImageElement"
          :src="notesImageUrl"
          :alt="t('Notes')"
          draggable="false"
          @load="onImageLoaded('notes')"
        />
        <div
          v-if="notesCrop"
          class="create_from_images__crop"
          :style="{
            left: `${notesCrop.x}px`,
            top: `${notesCrop.y}px`,
            width: `${notesCrop.width}px`,
            height: `${notesCrop.height}px`,
          }"
          @touchmove="onCropTouchMove"
        >
          <div
            class="create_from_images__crop-edge create_from_images__crop-edge--n"
            aria-hidden="true"
            @pointerdown="onCropHandlePointerDown('notes', 'n', $event)"
          ></div>
          <button
            type="button"
            class="create_from_images__crop-handle create_from_images__crop-handle--nw"
            :aria-label="t('create_from_images.crop_resize')"
            @pointerdown="onCropHandlePointerDown('notes', 'nw', $event)"
          ></button>
          <button
            type="button"
            class="create_from_images__crop-handle create_from_images__crop-handle--ne"
            :aria-label="t('create_from_images.crop_resize')"
            @pointerdown="onCropHandlePointerDown('notes', 'ne', $event)"
          ></button>
          <div
            class="create_from_images__crop-edge create_from_images__crop-edge--e"
            aria-hidden="true"
            @pointerdown="onCropHandlePointerDown('notes', 'e', $event)"
          ></div>
          <div
            class="create_from_images__crop-edge create_from_images__crop-edge--s"
            aria-hidden="true"
            @pointerdown="onCropHandlePointerDown('notes', 's', $event)"
          ></div>
          <button
            type="button"
            class="create_from_images__crop-handle create_from_images__crop-handle--sw"
            :aria-label="t('create_from_images.crop_resize')"
            @pointerdown="onCropHandlePointerDown('notes', 'sw', $event)"
          ></button>
          <button
            type="button"
            class="create_from_images__crop-handle create_from_images__crop-handle--se"
            :aria-label="t('create_from_images.crop_resize')"
            @pointerdown="onCropHandlePointerDown('notes', 'se', $event)"
          ></button>
          <div
            class="create_from_images__crop-edge create_from_images__crop-edge--w"
            aria-hidden="true"
            @pointerdown="onCropHandlePointerDown('notes', 'w', $event)"
          ></div>
        </div>
      </div>
    </div>

    <div class="submit">
      <ButtonMulti
        :desc="t('Import')"
        :icon="ArrowRightIcon"
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
.create_from_images__discard-button,
#create_from_images__title,
#create_from_images__ingredients,
#create_from_images__directions,
#create_from_images__notes {
  margin: 0;
  margin-block-end: var(--inner-spacing-m);
}

#create_from_images__notes {
  padding-block-end: 4px;
}

.create_from_images__preview {
  position: relative;
  width: 100%;
  max-width: 40rem;
  overflow: hidden;
  user-select: none;
  cursor: default;
}

.create_from_images__image-actions {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 6px;
  margin: 0;
  margin-bottom: 6px;
}

.create_from_images__preview img {
  display: block;
  width: 100%;
  height: auto;
  border: 2px solid var(--decor);
}

.create_from_images__crop {
  --crop-corner-hit-size: 12px;

  position: absolute;
  border: 2px solid var(--accent);
}

.create_from_images__crop-handle {
  position: absolute;
  z-index: 2;
  width: var(--crop-corner-hit-size);
  height: var(--crop-corner-hit-size);
  border-radius: 50%;
  border: 2px solid var(--bg);
  background-color: var(--accent);
  transform: translate(-50%, -50%);
  padding: 0;
}

.create_from_images__crop-edge {
  position: absolute;
  z-index: 1;
}

.create_from_images__crop-edge--n,
.create_from_images__crop-edge--s {
  left: calc(var(--crop-corner-hit-size) / 2);
  width: calc(100% - var(--crop-corner-hit-size) / 2);
  height: var(--crop-corner-hit-size);
  transform: translateY(-50%);
}

.create_from_images__crop-edge--e,
.create_from_images__crop-edge--w {
  top: calc(var(--crop-corner-hit-size) / 2);
  width: var(--crop-corner-hit-size);
  height: calc(100% - var(--crop-corner-hit-size) / 2);
  transform: translateX(-50%);
}

.create_from_images__crop-edge--n {
  top: 0;
  cursor: ns-resize;
}

.create_from_images__crop-handle--nw {
  top: 0;
  left: 0;
  cursor: nwse-resize;
}

.create_from_images__crop-handle--ne {
  top: 0;
  left: 100%;
  cursor: nesw-resize;
}

.create_from_images__crop-edge--e {
  left: 100%;
  cursor: ew-resize;
}

.create_from_images__crop-edge--s {
  top: 100%;
  cursor: ns-resize;
}

.create_from_images__crop-handle--sw {
  top: 100%;
  left: 0;
  cursor: nesw-resize;
}

.create_from_images__crop-handle--se {
  top: 100%;
  left: 100%;
  cursor: nwse-resize;
}

.create_from_images__crop-edge--w {
  left: 0;
  cursor: ew-resize;
}
</style>
