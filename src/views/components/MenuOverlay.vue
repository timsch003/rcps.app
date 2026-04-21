<script setup lang="ts">
import { computed, watch } from 'vue'
import { useRouter } from 'vue-router'
import { logoutUser } from '@/adapters/pocketbase'
import { useAuthStore } from '@/stores/auth'
import { useSettingsStore } from '@/stores/settings'
import { t } from '@/lang/i18n'
import AppLogo from '@/views/components/AppLogo.vue'
import ButtonMulti from '@/views/components/ButtonMulti.vue'
import CloseIcon from '@/views/icons/IconClose.vue'
import LogoutIcon from '@/views/icons/IconLogout.vue'
import ChangeMailIcon from '@/views/icons/IconChangeMail.vue'
import ResetPasswordIcon from '@/views/icons/IconResetPassword.vue'
import ModeLightIcon from '@/views/icons/IconModeLight.vue'
import ModeDarkIcon from '@/views/icons/IconModeDark.vue'
import TagsIcon from '@/views/icons/IconTags.vue'
import LanguageIcon from '@/views/icons/IconLanguage.vue'
import SettingsIcon from '@/views/icons/IconSettings.vue'

const router = useRouter()
const open = defineModel()
const authStore = useAuthStore()
const settingsStore = useSettingsStore()
const settings = computed(() => settingsStore.settings)

watch(
  () => settings.value.theme,
  (theme) => {
    if (theme) document.documentElement.setAttribute('data-theme', theme)
  },
  { immediate: true },
)

function toggleTheme() {
  settingsStore.update({ theme: settings.value.theme === 'light' ? 'dark' : 'light' })
}

function close() {
  open.value = false
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
        <h3 class="heading--muted">{{ t('Settings') }}</h3>
        <menu class="menu__content--settings">
          <li>
            <ButtonMulti :icon="TagsIcon" :desc="t('Tags')" showDesc />
          </li>
          <li>
            <ButtonMulti
              :icon="settings.theme === 'light' ? ModeLightIcon : ModeDarkIcon"
              :desc="t('Appearance')"
              showDesc
              @click="toggleTheme"
            />
          </li>
          <li>
            <ButtonMulti :icon="SettingsIcon" :desc="t('User interface')" showDesc />
          </li>
          <li>
            <ButtonMulti :icon="LanguageIcon" :desc="t('Language')" showDesc />
          </li>
        </menu>
        <h3 class="heading--muted">
          {{ t('User account') }} <span>{{ authStore.user?.email }}</span>
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

div.menu__inner h3 {
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
