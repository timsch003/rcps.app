<script lang="ts" setup>
import { computed } from 'vue'
import { useSettingsStore } from '@/stores/settings'
import { t } from '@/lang/i18n'
import {
  getAvailableAccents,
  NO_ACCENT_TOKEN,
  resolveNextThemeSelection,
  resolveSelectedAccent,
  resolveTheme,
  THEME_ACCENTS,
} from '@/utils/theme_settings'
import ButtonMulti from '@/views/components/ButtonMulti.vue'
import IconArrowLeft from '@/views/icons/IconArrowLeft.vue'
import ModeLightIcon from '@/views/icons/IconModeLight.vue'
import ModeDarkIcon from '@/views/icons/IconModeDark.vue'
import XIcon from '@/views/icons/IconX.vue'

defineProps<{
  setting: 'appearance' | 'ui'
}>()

const emit = defineEmits<{
  back: []
}>()

const settingsStore = useSettingsStore()
const settings = computed(() => settingsStore.settings)

const activeTheme = computed<'light' | 'dark'>(() => resolveTheme(settings.value.theme))
const keepScreenOn = computed({
  get: () => settings.value.keepScreenOn ?? true,
  set: (value: boolean) => settingsStore.update({ keepScreenOn: value }),
})
const availableAccents = computed(() => getAvailableAccents(activeTheme.value, THEME_ACCENTS))
const accentOptions = computed(() => [NO_ACCENT_TOKEN, ...availableAccents.value])
const selectedAccent = computed(() =>
  resolveSelectedAccent(activeTheme.value, settings.value.accent, availableAccents.value),
)

function toggleTheme() {
  const nextThemeSelection = resolveNextThemeSelection(
    activeTheme.value,
    settings.value.accent,
    THEME_ACCENTS,
  )
  settingsStore.update(nextThemeSelection)
}

function setAccent(accent: string) {
  if (accent !== NO_ACCENT_TOKEN && !availableAccents.value.includes(accent)) return
  settingsStore.update({ accent })
}
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
            v-for="accent in accentOptions"
            :key="accent"
            type="button"
            class="menu-setting__accent-btn"
            :class="{
              'menu-setting__accent--selected': accent === selectedAccent,
              'menu-setting__accent-btn--none': accent === NO_ACCENT_TOKEN,
            }"
            :style="
              accent === NO_ACCENT_TOKEN
                ? undefined
                : {
                    backgroundColor: `var(${accent})`,
                  }
            "
            :aria-label="accent === NO_ACCENT_TOKEN ? t('settings.no_accent_color') : accent"
            :aria-checked="accent === selectedAccent"
            role="radio"
            @click="setAccent(accent)"
          >
            <XIcon v-if="accent === NO_ACCENT_TOKEN" />
          </button>
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

button.menu-setting__accent-btn,
button.menu-setting__accent-btn:hover,
button.menu-setting__accent-btn:focus,
button.menu-setting__accent-btn:active {
  --btn-size: 3.5rem;
  box-shadow: none;
  width: var(--btn-size);
  height: var(--btn-size);
  margin-block-end: 0;
  border-radius: var(--border-radius);
  border: calc(var(--btn-size) / 7) solid var(--bg);
  cursor: pointer;
  transform: none;
}

button.menu-setting__accent-btn.menu-setting__accent--selected {
  border-color: transparent;
}

button.menu-setting__accent-btn--none,
button.menu-setting__accent-btn--none:hover,
button.menu-setting__accent-btn--none:focus,
button.menu-setting__accent-btn--none:active {
  border: none;
  background: var(--bg);
  color: var(--text);
  svg {
    width: var(--icon-size);
    height: var(--icon-size);
  }
}
</style>
