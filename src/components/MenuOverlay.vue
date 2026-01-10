<script setup lang="ts">
import { t } from '@/lang/i18n'
import ButtonAction from '@/components/ButtonAction.vue'
import CloseIcon from '@/components/icons/IconClose.vue'

const model = defineModel()
const close = () => {
  model.value = false
}
</script>

<template>
  <div :class="model ? 'menu menu--open' : 'menu menu--closed'">
    <div class="menu__inner">
      <div class="menu__close">
        <ButtonAction :icon="CloseIcon" :desc="t('Close menu')" @click="close" />
      </div>
    </div>
  </div>
</template>

<style scoped>
div.menu--open {
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

div.menu--closed {
  display: none;
}

div.menu__inner {
  display: flex;
  justify-content: flex-end;
  padding-block: 6px;
}
</style>
