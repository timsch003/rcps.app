<script setup>
import { Link } from "@inertiajs/vue3";
</script>

<template>
    <Link href="/">
        <div class="logo">
            <h1 aria-label="Recipes app">
                r<span :aria-hidden="true">e</span>c<span :aria-hidden="true">i</span>p<span
                    :aria-hidden="true">e</span>s<span :aria-hidden="true">.</span>app
            </h1>
        </div>
    </Link>
</template>

<style scoped>
div.logo {
    --base-letter-spacing: -0.05ch;

    h1 {
        color: var(--accent);
        font-size: 2rem;
        font-weight: 900;
        letter-spacing: var(--base-letter-spacing);
        line-height: 1;
        padding-bottom: 0.4em;
    }

    h1 span:not(:last-of-type) {
        opacity: 0;
        letter-spacing: -1ch;
        animation: app-name 4s cubic-bezier(0.5, -0.3, 0.5, 1);
    }

    h1 span:last-of-type {
        animation: app-name-dot 4s cubic-bezier(0.5, -0.3, 0.5, 1);
    }

    @media (prefers-reduced-motion: reduce) {
        h1 span {
            animation: none;
        }
    }
}

@keyframes app-name {
    0% {
        opacity: 0;
        letter-spacing: -1ch;
    }

    30% {
        opacity: 1;
        letter-spacing: var(--base-letter-spacing);
    }

    75% {
        opacity: 1;
        letter-spacing: var(--base-letter-spacing);
    }

    0% {
        opacity: 0;
        letter-spacing: -1ch;
    }
}

@keyframes app-name-dot {
    0% {
        opacity: 1;
    }

    30% {
        opacity: 0;
    }

    70% {
        opacity: 0;
    }

    0% {
        opacity: 1;
    }
}
</style>
