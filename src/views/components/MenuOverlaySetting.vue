<script lang="ts" setup>
import { computed, onMounted, ref } from 'vue'
import { useSettingsStore } from '@/stores/settings'
import { t } from '@/lang/i18n'
import { DEFAULT_ACCENT_BY_THEME, resolveTheme } from '@/utils/theme_settings'
import ButtonMulti from '@/views/components/ButtonMulti.vue'
import IconArrowLeft from '@/views/icons/IconArrowLeft.vue'
import ModeLightIcon from '@/views/icons/IconModeLight.vue'
import ModeDarkIcon from '@/views/icons/IconModeDark.vue'

defineProps<{
  setting: 'appearance' | 'ui'
}>()

const emit = defineEmits<{
  back: []
}>()

const settingsStore = useSettingsStore()
const settings = computed(() => settingsStore.settings)
const darkAccents = ref<string[]>([])
const lightAccents = ref<string[]>([])

const activeTheme = computed<'light' | 'dark'>(() => resolveTheme(settings.value.theme))
const keepScreenOn = computed({
  get: () => settings.value.keepScreenOn ?? true,
  set: (value: boolean) => settingsStore.update({ keepScreenOn: value }),
})
const availableAccents = computed(() =>
  activeTheme.value === 'dark' ? darkAccents.value : lightAccents.value,
)
const selectedAccent = computed(() => {
  const savedAccent = settings.value.accent

  if (savedAccent && availableAccents.value.includes(savedAccent)) return savedAccent

  return DEFAULT_ACCENT_BY_THEME[activeTheme.value]
})

function loadAccentVariables() {
  const style = getComputedStyle(document.documentElement)
  const dark: string[] = []
  const light: string[] = []

  for (let i = 0; i < style.length; i += 1) {
    const variableName = style.item(i)

    if (variableName.startsWith('--d-')) dark.push(variableName)
    if (variableName.startsWith('--l-')) light.push(variableName)
  }

  darkAccents.value = dark
  lightAccents.value = light
}

function toggleTheme() {
  const nextTheme = activeTheme.value === 'light' ? 'dark' : 'light'
  const nextThemeAccents = nextTheme === 'dark' ? darkAccents.value : lightAccents.value
  const fallbackAccent = DEFAULT_ACCENT_BY_THEME[nextTheme]
  const nextAccent =
    settings.value.accent && nextThemeAccents.includes(settings.value.accent)
      ? settings.value.accent
      : fallbackAccent

  settingsStore.update({ theme: nextTheme, accent: nextAccent })
}

function setAccent(accent: string) {
  if (!availableAccents.value.includes(accent)) return
  settingsStore.update({ accent })
}

onMounted(() => {
  loadAccentVariables()
})
</script>

<template>
  <div class="menu-setting">
    <ButtonMulti
      :icon="IconArrowLeft"
      :desc="t('settings.back_to_menu')"
      showDesc
      @click="emit('back')"
    />

    <div v-if="setting === 'appearance'" class="menu-setting__content">
      <form class="menu-setting__group">
        <h4 class="heading--muted">{{ t('settings.theme') }}</h4>
        <ButtonMulti
          :icon="activeTheme === 'light' ? ModeLightIcon : ModeDarkIcon"
          :desc="
            activeTheme === 'light'
              ? t('settings.switch_to_dark_mode')
              : t('settings.switch_to_light_mode')
          "
          showDesc
          @click="toggleTheme"
        />
      </form>

      <form class="menu-setting__group">
        <h4 class="heading--muted">{{ t('settings.accent_color') }}</h4>
        <p v-if="!availableAccents.length" class="error">
          {{ t('settings.no_accent_colors_available') }}
        </p>
        <div
          v-else
          class="menu-setting__accent"
          role="radiogroup"
          :aria-label="t('settings.accent_color')"
        >
          <button
            v-for="accent in availableAccents"
            :key="accent"
            type="button"
            class="menu-setting__accent-btn"
            :class="{ 'menu-setting__accent--selected': accent === selectedAccent }"
            :style="{ backgroundColor: `var(${accent})` }"
            :aria-label="accent"
            :aria-checked="accent === selectedAccent"
            role="radio"
            @click="setAccent(accent)"
          />
        </div>
      </form>
    </div>

    <div v-else-if="setting === 'ui'" class="menu-setting__content">
      <form class="menu-setting__group">
        <label for="menu-setting-screen-on" class="heading--muted">{{
          t('settings.keep_screen_on')
        }}</label>
        <input id="menu-setting-screen-on" v-model="keepScreenOn" type="checkbox" />
      </form>
    </div>
  </div>
</template>

<style scoped>
div.menu-setting > button:first-child,
form.menu-setting__group:not(:last-child) {
  margin-block-end: var(--inner-spacing-l);
}

.heading--muted {
  margin-block-end: 2px;
}

div.menu-setting__accent {
  display: flex;
  flex-wrap: wrap;
  gap: var(--inner-spacing);
}

button.menu-setting__accent-btn {
  --btn-size: 3.5rem;
  box-shadow: none;
  width: var(--btn-size);
  height: var(--btn-size);
  margin-block-end: 0;
  border-radius: var(--border-radius);
  border: calc(var(--btn-size) / 7) solid var(--bg);
  cursor: pointer;
}

button.menu-setting__accent-btn.menu-setting__accent--selected {
  border-color: transparent;
}
</style>
