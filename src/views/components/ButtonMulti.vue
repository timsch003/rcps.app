<script setup lang="ts">
const { route, desc, icon, showDesc, accentColor, inNavBottom, inline, small } = defineProps<{
  route?: string
  desc: string
  icon?: object
  showDesc?: boolean | false
  accentColor?: boolean | false
  inNavBottom?: boolean | false
  inline?: boolean | false
  small?: boolean | false
}>()

const baseElem = !!route ? 'RouterLink' : 'button'
const baseClass = !!route ? 'btn-link' : 'btn-button'
const accentClass = !!accentColor ? 'btn--accent' : ''

let modifierClass = !!inNavBottom ? 'btn-link--nav-bottom' : ''
if (!inNavBottom && inline) modifierClass = 'btn-button--inline'
if (small || (icon && showDesc)) modifierClass += ' btn--small'

const link = baseElem === 'RouterLink' ? { name: route } : null

// Prevent buttons from submitting forms when used inside them
const buttonType = baseElem === 'button' ? 'button' : undefined
</script>

<template>
  <component
    v-if="icon && showDesc"
    :is="baseElem"
    :to="link"
    :type="buttonType"
    :class="`${baseClass} ${accentClass}`"
  >
    <component :is="icon" />
    <span :class="`${baseClass}__desc`">{{ desc }}</span>
  </component>
  <component
    v-else-if="icon && !showDesc"
    :is="baseElem"
    :to="link"
    :type="buttonType"
    :class="`${baseClass} ${accentClass} ${modifierClass}`"
    :aria-label="desc"
  >
    <component :is="icon" />
  </component>
  <component
    v-else
    :is="baseElem"
    :to="link"
    :type="buttonType"
    :class="`${baseClass} ${accentClass}`"
    :aria-label="desc"
  >
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
  font-weight: 600;
  background-color: var(--bg-light);
  box-shadow: 2px 2px var(--bg-lighter);
  border: none;
  border-radius: 10em;
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

.btn-button:disabled {
  cursor: not-allowed;
}

.btn--accent {
  color: var(--accent);
}

.btn--small,
.btn-button--inline {
  svg {
    width: var(--icon-size-s);
    height: var(--icon-size-s);
  }
}

.btn-link__desc,
.btn-button__desc {
  opacity: var(--text-secondary-opacity);
  margin-left: var(--inner-spacing);
}

.btn-link:hover,
.btn-button:hover:not(:disabled),
.btn-link:focus,
.btn-button:focus:not(:disabled) {
  background-color: var(--bg-lighter);
}

.btn-link:active,
.btn-button:active:not(:disabled),
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
  top: -13px;
  z-index: 11;
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
