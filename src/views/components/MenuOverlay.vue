<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { logoutUser } from '@/adapters/pocketbase'
import { useAuthStore } from '@/stores/auth'
import { useSettingsStore } from '@/stores/settings'
import { sync } from '@/services/sync'
import { t } from '@/lang/i18n'
import AppLogo from '@/views/components/AppLogo.vue'
import ButtonMulti from '@/views/components/ButtonMulti.vue'
import MenuOverlaySetting from '@/views/components/MenuOverlaySetting.vue'
import CloseIcon from '@/views/icons/IconClose.vue'
import LogoutIcon from '@/views/icons/IconLogout.vue'
import ChangeMailIcon from '@/views/icons/IconChangeMail.vue'
import ResetPasswordIcon from '@/views/icons/IconResetPassword.vue'
import ModeLightIcon from '@/views/icons/IconModeLight.vue'
import ModeDarkIcon from '@/views/icons/IconModeDark.vue'
import LanguageIcon from '@/views/icons/IconLanguage.vue'
import UiIcon from '@/views/icons/IconUI.vue'

type SettingView = 'appearance' | 'ui' | null

const router = useRouter()
const open = defineModel()
const authStore = useAuthStore()
const settingsStore = useSettingsStore()
const settings = computed(() => settingsStore.settings)
const activeSetting = ref<SettingView>(null)
const settingsTransition = ref<'slide-in-rtl-out-in' | 'slide-in-ltr-out-in'>('slide-in-rtl-out-in')

const activeTheme = computed<'light' | 'dark'>(() =>
  settings.value.theme === 'light' ? 'light' : 'dark',
)

watch(
  () => open.value,
  (isOpen) => {
    if (!isOpen) {
      activeSetting.value = null
      settingsTransition.value = 'slide-in-rtl-out-in'
    }
  },
)

function openSetting(setting: Exclude<SettingView, null>) {
  settingsTransition.value = 'slide-in-rtl-out-in'
  activeSetting.value = setting
}

function closeSetting() {
  settingsTransition.value = 'slide-in-ltr-out-in'
  activeSetting.value = null
}

function close() {
  open.value = false
  activeSetting.value = null
  sync.pushLocalChanges()
}

function logout() {
  logoutUser()
  router.push({ name: 'login' })
}
</script>

<template>
  <Transition name="fade">
    <div v-if="open" class="menu">
      <div class="menu__inner">
        <div class="menu__header">
          <AppLogo omitAnimation />
          <ButtonMulti :icon="CloseIcon" :desc="t('Close menu')" @click="close" />
        </div>
        <Transition :name="settingsTransition" mode="out-in">
          <div v-if="!activeSetting" key="menu-overview">
            <h3 class="heading--muted">{{ t('Settings') }}</h3>
            <menu class="menu__content--settings">
              <li>
                <ButtonMulti
                  :icon="activeTheme === 'light' ? ModeLightIcon : ModeDarkIcon"
                  :desc="t('settings.appearance')"
                  showDesc
                  @click="openSetting('appearance')"
                />
              </li>
              <li>
                <ButtonMulti
                  :icon="UiIcon"
                  :desc="t('settings.user_interface')"
                  showDesc
                  @click="openSetting('ui')"
                />
              </li>
              <li>
                <ButtonMulti :icon="LanguageIcon" :desc="t('settings.language')" showDesc />
              </li>
            </menu>
            <h3 class="heading--muted">
              {{ t('settings.user_account') }} <span>{{ authStore.user?.email }}</span>
            </h3>
            <menu class="menu__content--account">
              <li>
                <ButtonMulti :icon="LogoutIcon" :desc="t('auth.logout')" showDesc @click="logout" />
              </li>
              <li>
                <ButtonMulti
                  route="reset"
                  :icon="ResetPasswordIcon"
                  :desc="t('auth.reset_password')"
                  showDesc
                />
              </li>
              <li>
                <ButtonMulti
                  route="change"
                  :icon="ChangeMailIcon"
                  :desc="t('auth.change_email')"
                  showDesc
                />
              </li>
            </menu>
          </div>

          <MenuOverlaySetting
            v-else-if="activeSetting === 'appearance'"
            key="menu-appearance"
            setting="appearance"
            @back="closeSetting"
          />

          <MenuOverlaySetting
            v-else-if="activeSetting === 'ui'"
            key="menu-ui"
            setting="ui"
            @back="closeSetting"
          />
        </Transition>
      </div>
    </div>
  </Transition>
</template>

<style scoped>
div.menu {
  position: fixed;
  inset: 0;
  background-color: var(--bg);
  z-index: 20;
  padding: var(--outer-spacing);

  svg {
    width: var(--icon-size);
    height: var(--icon-size);
    cursor: pointer;
  }
}

div.menu__inner h3.heading--muted {
  margin-bottom: 10px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;

  span {
    color: var(--text);
    opacity: var(--text-secondary-opacity);
    font-size: 0.9rem;
  }
}

div.menu__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: var(--inner-spacing);
}

menu.menu__content--settings,
menu.menu__content--account {
  display: flex;
  flex-wrap: wrap;
  gap: var(--inner-spacing);

  li {
    list-style: none;
  }

  .btn-button,
  .btn-link {
    font-weight: 500;
  }
}

menu.menu__content--settings {
  padding-bottom: var(--inner-spacing-l);
  border-bottom: 1px solid var(--decor);
  margin-bottom: calc(var(--inner-spacing-l) - 1ex);
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity var(--transition-duration) linear;
}

.fade-leave-to,
.fade-enter-from {
  opacity: 0;
}
</style>
