<script setup lang="ts">
const { desc, route, icon, showDesc, accentColor, inNavBottom, inline, smallIcon, smallText } =
  defineProps<{
    desc: string
    route?: string
    icon?: object
    showDesc?: boolean | false
    accentColor?: boolean | false
    inNavBottom?: boolean | false
    inline?: boolean | false
    smallIcon?: boolean | false
    smallText?: boolean | false
  }>()

const baseElem = !!route ? 'RouterLink' : 'button'
const baseClass = !!route ? 'btn-link' : 'btn-button'
const accentClass = !!accentColor ? 'btn--accent' : ''

let modifierClass = !!inNavBottom ? 'btn-link--nav-bottom' : ''
if (!inNavBottom && inline) modifierClass = 'btn-button--inline'
if (smallIcon || (icon && showDesc)) modifierClass += ' btn--small-icon'
if (smallText) modifierClass += ' btn--small-text'

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
    :class="`${baseClass} ${accentClass} ${modifierClass}`"
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
    :class="`${baseClass} ${accentClass} ${modifierClass}`"
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
  padding: var(--btn-padding-block) var(--btn-padding-inline);
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

.btn--small-icon,
.btn-button--inline {
  svg {
    width: var(--icon-size-s);
    height: var(--icon-size-s);
  }
}

.btn-link__desc,
.btn-button__desc {
  opacity: var(--secondary-opacity);
  margin-left: var(--inner-spacing);
  text-align: start;
}

.btn--small-text {
  font-size: var(--font-size-s);
  font-weight: 400;
  text-transform: uppercase;
  padding: calc(var(--btn-padding-block) - 2px) calc(var(--btn-padding-inline) - 2px);

  svg {
    width: var(--icon-size-xs);
    height: var(--icon-size-xs);
  }
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
  transform: translate(0, 0);
}

.btn-link--nav-bottom.active::before {
  content: '';
  position: absolute;
  top: -13px;
  z-index: 11;
  width: 100%;
  border-top: 2px solid var(--accent);
}

.btn-button--inline,
.btn-button--inline:not(:disabled):hover,
.btn-button--inline:not(:disabled):focus,
.btn-button--inline:not(:disabled):active {
  padding: 0;
  margin: 0;
  box-shadow: none;
  background-color: transparent;
  transform: none;
  transition: none;
}
</style>
