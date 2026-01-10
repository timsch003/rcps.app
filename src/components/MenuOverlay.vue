<script setup lang="ts">
import { t } from '@/lang/i18n'
import ButtonAction from '@/components/ButtonAction.vue'
import CloseIcon from '@/components/icons/IconClose.vue'

const open = defineModel()

const close = () => {
  open.value = false
}
</script>

<template>
  <Transition name="fade">
    <div v-if="open" class="menu">
      <div class="menu__inner">
        <div class="menu__close">
          <ButtonAction :icon="CloseIcon" :desc="t('Close menu')" @click="close" />
        </div>
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

.fade-enter-active,
.fade-leave-active {
  transition: opacity var(--transition-duration) linear;
}

.fade-leave-to,
.fade-enter-from {
  opacity: 0;
}

div.menu__inner {
  display: flex;
  justify-content: flex-end;
  padding-block: 6px;
}
</style>
