<script setup lang="ts">
import AppLogo from '@/views/components/AppLogo.vue'
import ButtonMulti from '@/views/components/ButtonMulti.vue'
import { t } from '@/lang/i18n'
import LoginIcon from '@/views/icons/IconLogin.vue'
import UserIcon from '@/views/icons/IconUser.vue'
</script>

<template>
  <main>
    <header>
      <AppLogo />
      <nav class="top">
        <ButtonMulti route="login" :icon="LoginIcon" :desc="t('auth.login')" showDesc />
        <ButtonMulti route="register" :icon="UserIcon" :desc="t('auth.register')" showDesc />
      </nav>
    </header>
    <section>
      <RouterView />
    </section>
  </main>
</template>

<style>
h1 {
  margin-bottom: 20px;
}
</style>

<style scoped>
main {
  --nav-border-width: 2px;

  min-height: calc(100vh - var(--outer-spacing) * 2);
}

section {
  padding: var(--inner-spacing) var(--outer-spacing);
}

a.logo {
  display: block;
  text-align: center;
  margin-bottom: var(--inner-spacing);
}

nav.top {
  display: flex;
  align-items: center;
  justify-content: center;
  flex-wrap: wrap;
  gap: var(--gap);
  margin-bottom: var(--inner-spacing);
}

header {
  z-index: 10;
}

nav.top {
  z-index: -1;
}

header {
  position: sticky;
  inset: 0 0 auto 0;
  background-color: var(--bg);
  border-bottom: var(--nav-border-width) solid var(--bg-lighter);
  padding: var(--outer-spacing) var(--outer-spacing) var(--outer-spacing) var(--outer-spacing);
}
</style>
