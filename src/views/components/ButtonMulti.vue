<script setup lang="ts">
const { route, accentColor, inNavBottom, inline } = defineProps<{
  route?: string
  desc: string
  icon?: object
  showDesc?: boolean | false
  accentColor?: boolean | false
  inNavBottom?: boolean | false
  inline?: boolean | false
}>()

const baseElem = !!route ? 'RouterLink' : 'button'
const baseClass = !!route ? 'btn-link' : 'btn-button'
const accentClass = !!accentColor ? 'btn--accent' : ''
let modifierClass = !!inNavBottom ? 'btn-link--nav-bottom' : ''
modifierClass = !inNavBottom && inline ? 'btn-button--inline' : ''
const link = baseElem === 'RouterLink' ? { name: route } : null
</script>

<template>
  <component :is="baseElem" v-if="icon && showDesc" :to="link" :class="`${baseClass} ${accentClass} btn--icon-desc`">
    <component :is="icon" />
    <span :class="`${baseClass}__desc`">{{ desc }}</span>
  </component>
  <component :is="baseElem" v-else-if="icon && !showDesc" :to="link"
    :class="`${baseClass} ${accentClass} ${modifierClass}`" :aria-label="desc">
    <component :is="icon" />
  </component>
  <component :is="baseElem" v-else :to="link" :class="`${baseClass} ${accentClass}`" :aria-label="desc">
    {{ desc }}
  </component>
</template>

<style scoped>
.btn-link,
.btn-button {
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  font-size: 0.9rem;
  font-weight: 200;
  background-color: var(--bg-light);
  box-shadow: 2px 2px var(--bg-lighter);
  border: none;
  border-radius: 10em;
  font-weight: 600;
  transform: translate(-1px, -1px);
  padding: 6px 12px;
  cursor: pointer;
  color: var(--text);

  svg {
    display: inline-flex;
    width: var(--icon-size);
    height: var(--icon-size);
  }
}

.btn--accent {
  color: var(--accent);
}

.btn--icon-desc,
.btn-button--inline {
  svg {
    width: var(--icon-size-s);
    height: var(--icon-size-s);
  }
}

.btn-link__desc,
.btn-button__desc {
  opacity: var(--text-secondary-opacity);
  margin-left: var(--gap);
}

.btn-link:hover,
.btn-button:hover,
.btn-link:focus,
.btn-button:focus {
  background-color: var(--bg-lighter);
}

.btn-link:active,
.btn-button:active,
.btn-link--nav-bottom.active {
  background-color: var(--bg-lighter);
  box-shadow: 0px 0px var(--bg-lighter);
  transform: translate(1px, 1px);
  transition:
    box-shadow var(--transition-duration) ease-in-out,
    transform var(--transition-duration) ease-in-out;
}

/* .active is added by RouterLink when the route is active */
.btn-link--nav-bottom.active {
  transition: none;
}

.btn-link--nav-bottom.active::before {
  content: '';
  position: absolute;
  top: -15px;
  z-index: 30;
  width: 100%;
  border-top: 2px solid var(--accent);
}

.btn-button--inline {
  padding: 0;
  box-shadow: none;
  background-color: transparent;
  transform: none;
}

.btn-button--inline:hover,
.btn-button--inline:focus,
.btn-button--inline:active {
  transform: none;
  transition: none;
}
</style>
