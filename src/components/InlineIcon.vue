<script setup>
defineProps({
    icon: {
        type: String,
        required: true,
    },
    inBreadcrumbs: {
        type: Boolean,
        default: false,
    },
});
</script>

<template>
    <span :class="inBreadcrumbs ? 'breadcrumb-icon' : ''">
        <svg v-if="icon === 'tag'" aria-label="{{ $t('Tags') }}" xmlns="http://www.w3.org/2000/svg" width="24"
            height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"
            stroke-linejoin="round" class="feather feather-tag">
            <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"></path>
            <line x1="7" y1="7" x2="7.01" y2="7"></line>
        </svg>
        <slot />
    </span>
</template>

<style scoped>
svg {
    width: 16px;
    height: 16px;
    display: inline-flex;
    margin-right: 6px;
    transform: translateY(3px);
}

.breadcrumb-icon {
    display: flex;
    align-items: center;

    svg {
        transform: translateY(0px);
        margin-right: 3px;
    }
}
</style>
