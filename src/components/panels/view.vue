<script setup>
import { computed, ref } from "vue";
import { useMap } from "@/composables/useMap";
import { useLocale } from "@/composables/useLocale";
import Icon from "@/components/ui/icon.vue";

const { mapView } = useMap();
const { t } = useLocale();

const copied = ref(false);

const shareUrl = computed(() => {
    const base = `${window.location.origin}${window.location.pathname}`;
    if (!mapView.value) return `${base}${window.location.hash}` || base;
    const { lat, lng } = mapView.value;
    const zoom = Math.round(mapView.value.zoom);
    return `${base}#map=${zoom}/${lat.toFixed(6)}/${lng.toFixed(6)}`;
});

const osmUrl = computed(() => {
    if (!mapView.value) return null;
    const { lat, lng } = mapView.value;
    const zoom = Math.round(mapView.value.zoom);
    return `https://www.openstreetmap.org/#map=${zoom}/${lat.toFixed(6)}/${lng.toFixed(6)}`;
});

const osmEditUrl = computed(() => {
    if (!mapView.value) return null;
    const { lat, lng } = mapView.value;
    const zoom = Math.round(mapView.value.zoom);
    return `https://www.openstreetmap.org/edit#map=${zoom}/${lat.toFixed(6)}/${lng.toFixed(6)}`;
});

const copyLink = async () => {
    try {
        await navigator.clipboard.writeText(shareUrl.value);
        copied.value = true;
        setTimeout(() => { copied.value = false; }, 2000);
    } catch {
        const el = document.querySelector(".onrte-share-textarea");
        if (el) { el.select(); document.execCommand("copy"); }
    }
};
</script>

<template>
    <div class="sidebar-section sidebar-section-body p-3 pb-0">
        <h5 class="mb-0">{{ t('panel.view.title') }}</h5>
    </div>

    <div class="sidebar-section sidebar-section-body p-3 border-top">
        <p class="mb-2 small text-body-secondary">{{ t('panel.view.shareDescription') }}</p>

        <textarea
            class="onrte-share-textarea form-control form-control-sm font-monospace mb-2"
            :value="shareUrl"
            readonly
            rows="3"
            @focus="$event.target.select()"
        ></textarea>

        <button
            type="button"
            class="btn btn-sm w-100 d-flex align-items-center justify-content-center gap-1"
            :class="copied ? 'btn-success' : 'btn-outline-primary'"
            @click="copyLink"
        >
            <Icon width="16" height="16" fill="currentColor" :name="copied ? 'check' : 'globe'" />
            {{ copied ? t('panel.view.copied') : t('panel.view.copyLink') }}
        </button>

        <hr class="my-2 opacity-25">

        <div class="d-flex gap-2">
            <a
                class="btn btn-sm btn-outline-secondary flex-fill d-flex align-items-center justify-content-center gap-1"
                :href="osmUrl ?? '#'"
                target="_blank"
                rel="noopener noreferrer"
            >
                <Icon width="14" height="14" fill="currentColor" name="globe" />
                {{ t('panel.view.viewOnOsm') }}
            </a>
            <a
                class="btn btn-sm btn-outline-secondary flex-fill d-flex align-items-center justify-content-center gap-1"
                :href="osmEditUrl ?? '#'"
                target="_blank"
                rel="noopener noreferrer"
            >
                <Icon width="14" height="14" fill="currentColor" name="pencil" />
                {{ t('panel.view.editOnOsm') }}
            </a>
        </div>
    </div>
</template>
