<script setup lang="ts">
import { t } from '@/lang/i18n'
import { logoutUser } from '@/services/pocketbase'
import { useRouter } from 'vue-router'
import AppLogo from '@/components/AppLogo.vue'
import ButtonButton from '@/components/ButtonButton.vue'
import CloseIcon from '@/components/icons/IconClose.vue'
import LogoutIcon from '@/components/icons/IconLogout.vue'
import ChangeMailIcon from '@/components/icons/IconChangeMail.vue'
import ResetPasswordIcon from '@/components/icons/IconResetPassword.vue'
import ModeLightIcon from '@/components/icons/IconModeLight.vue'
import TagsIcon from '@/components/icons/IconTags.vue'
import LanguageIcon from '@/components/icons/IconLanguage.vue'
import SettingsIcon from '@/components/icons/IconSettings.vue'

const router = useRouter()
const open = defineModel()

const close = () => {
  open.value = false
}

const logout = async () => {
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
          <ButtonButton :icon="CloseIcon" :desc="t('Close menu')" @click="close" />
        </div>
        <h3>{{ t('Settings') }}</h3>
        <menu class="menu__content--settings">
          <li>
            <ButtonButton :icon="TagsIcon" :desc="t('Tags')" showDesc />
          </li>
          <li>
            <ButtonButton :icon="ModeLightIcon" :desc="t('Colors')" showDesc />
          </li>
          <li>
            <ButtonButton :icon="SettingsIcon" :desc="t('User interface')" showDesc />
          </li>
          <li>
            <ButtonButton :icon="LanguageIcon" :desc="t('Language')" showDesc />
          </li>
        </menu>
        <h3>{{ t('User account') }}</h3>
        <menu class="menu__conten--account">
          <!-- TODO: Show user name and logout in a separate row -->
          <li>
            <ButtonButton routeName="logout" :icon="LogoutIcon" :desc="t('auth.logout')" showDesc @click="logout" />
          </li>
          <li>
            <ButtonButton routeName="reset" :icon="ResetPasswordIcon" :desc="t('auth.reset_password')" showDesc />
          </li>
          <li>
            <ButtonButton routeName="change" :icon="ChangeMailIcon" :desc="t('auth.change_email')" showDesc />
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
  z-index: 11;
  padding: var(--outer-spacing);

  svg {
    width: var(--icon-size);
    height: var(--icon-size);
    cursor: pointer;
  }
}

div.menu__inner h3 {
  font-size: 1.1rem;
  letter-spacing: 1px;
  font-weight: 400;
  opacity: var(--secondary-text-opacity);
  margin-bottom: var(--inner-spacing);
}

div.menu__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding-block: 6px;
  margin-bottom: var(--inner-spacing);
}

menu.menu__content--settings,
menu.menu__conten--account {
  display: flex;
  flex-wrap: wrap;
  gap: var(--gap);

  li {
    list-style: none;
  }

  button {
    font-weight: 400;
  }
}

menu.menu__content--settings {
  padding-bottom: calc(var(--inner-spacing) * 2);
  border-bottom: 1px solid var(--decor);
  margin-bottom: calc(var(--inner-spacing) * 1.2);
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
