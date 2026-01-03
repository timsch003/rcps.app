<script setup>
import { Link } from "@inertiajs/vue3";

defineProps({
    href: { type: String, required: true },
    icon: String,
});
</script>

<template>
    <div class="link-button">
        <Link :href="href">
            <div class="icon" v-if="icon">
                <svg v-if="icon === 'menu'" aria-label="{{ $t('Menu') }}" xmlns="http://www.w3.org/2000/svg" width="24"
                    height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
                    stroke-linecap="round" stroke-linejoin="round" class="feather feather-menu">
                    <line x1="3" y1="12" x2="21" y2="12"></line>
                    <line x1="3" y1="6" x2="21" y2="6"></line>
                    <line x1="3" y1="18" x2="21" y2="18"></line>
                </svg>
                <svg v-else-if="icon === 'home'" aria-label="{{ $t('Home') }}" xmlns="http://www.w3.org/2000/svg"
                    width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
                    stroke-linecap="round" stroke-linejoin="round" class="feather feather-home">
                    <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
                    <polyline points="9 22 9 12 15 12 15 22"></polyline>
                </svg>
                <svg v-else-if="icon === 'favorites'" aria-label="{{ $t('Favorites') }}"
                    xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none"
                    stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"
                    class="feather feather-star">
                    <polygon
                        points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2">
                    </polygon>
                </svg>
                <svg v-else-if="icon === 'settings'" aria-label="{{ $t('Settings') }}"
                    xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none"
                    stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"
                    class="feather feather-sliders">
                    <line x1="4" y1="21" x2="4" y2="14"></line>
                    <line x1="4" y1="10" x2="4" y2="3"></line>
                    <line x1="12" y1="21" x2="12" y2="12"></line>
                    <line x1="12" y1="8" x2="12" y2="3"></line>
                    <line x1="20" y1="21" x2="20" y2="16"></line>
                    <line x1="20" y1="12" x2="20" y2="3"></line>
                    <line x1="1" y1="14" x2="7" y2="14"></line>
                    <line x1="9" y1="8" x2="15" y2="8"></line>
                    <line x1="17" y1="16" x2="23" y2="16"></line>
                </svg>
                <svg v-else-if="icon === 'search'" xmlns="http://www.w3.org/2000/svg" width="24" height="24"
                    viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"
                    stroke-linejoin="round" class="feather feather-search">
                    <circle cx="11" cy="11" r="8"></circle>
                    <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                </svg>
            </div>
            <slot v-if="!icon" />
        </Link><span>
            <slot v-if="icon" />
        </span>
    </div>
</template>

<style scoped>
.link-button {
    display: flex;
    flex-direction: column;
    align-items: center;
    flex-shrink: 0;
    font-size: 0.9rem;
    font-weight: 200;

    span {
        opacity: var(--secondary-text-opacity);
    }
}

a {
    background-color: var(--bg-light);
    box-shadow: 2px 2px var(--bg-lighter);
    border-radius: 10em;
    font-weight: 600;
    transform: translate(-1px, -1px);
    padding: 6px 12px;

    svg {
        width: 2rem;
        height: 1.5rem;
    }
}

a:hover,
a:active,
a:focus {
    background-color: var(--bg-lighter);
    box-shadow: 0px 0px var(--bg-lighter);
    transform: translate(0px, 0px);
    transition: box-shadow var(--ui-transition-duration) ease-in-out,
        transform var(--ui-transition-duration) ease-in-out;
}
</style>
