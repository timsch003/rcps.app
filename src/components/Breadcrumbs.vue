<script setup>
import { Link } from "@inertiajs/vue3";
import InlineIcon from "./InlineIcon.vue";

defineProps({
    origin: Object,
    recipe: {
        type: String,
        default: null,
    },
    isSingleRecipe: {
        type: Boolean,
        default: false,
    },
});
</script>

<template>
    <nav>
        <Link href="/">
            <InlineIcon icon="tag" inBreadcrumbs>{{ $t("Tags") }}</InlineIcon>
        </Link>
        <span aria-hidden="true">→</span>
        <span v-if="!isSingleRecipe" class="shown-tag">{{ origin.name }}</span>
        <Link v-else href=""><span>{{ origin.name }}</span></Link>
        <span v-if="recipe" aria-hidden="true">→</span>
        <span v-if="recipe">{{ recipe }}</span>
    </nav>
</template>

<style scoped>
nav {
    display: flex;
    align-items: center;
    gap: 0.75ch;
    padding-bottom: var(--inner-spacing);
    font-size: 0.9rem;

    a:hover,
    a:active,
    a:focus {
        text-decoration: underline;
    }

    .shown-tag {
        font-weight: 600;
    }
}
</style>
