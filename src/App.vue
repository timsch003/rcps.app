<script setup lang="ts"></script>

<template>
  <RouterView />
</template>

<style>
#app {
  max-width: unset;
}

@media screen and (min-width: 850px) {
  #app {
    position: absolute;
    max-width: 820px;
    inset: 0 calc(100vw / 2 - 410px);
  }

  .menu,
  nav.bottom {
    max-width: 816px;
    margin: 0 auto;
  }

  main > nav.recipe {
    inset: 0 calc(100vw / 2 - 410px) auto auto;
  }

  main {
    border-inline: var(--nav-border-width) solid var(--bg-lighter);
  }

  main,
  .menu {
    overflow: hidden;
  }
}
</style>
