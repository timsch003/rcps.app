<script setup lang="ts">
import AppLogo from '@/components/AppLogo.vue'
import LinkButton from '@/components/LinkButton.vue'
import { t } from '@/lang/i18n'
</script>

<template>
  <main>
    <header>
      <AppLogo />
      <nav class="top">
        <LinkButton href="/a/login" :desc="t('auth.login')" />
        <LinkButton href="/a/register" :desc="t('auth.register')" />
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

header,
nav.top {
  display: flex;
  align-items: center;
  background-color: var(--bg);
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

nav.top {
  justify-content: flex-end;
  gap: var(--gap);
  width: 100vw;
}
</style>
