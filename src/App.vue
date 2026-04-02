<script setup>
import { ref, inject, onMounted } from "vue";
import iconSprite from "@ogis/icons/dist/ogis-icons.svg?raw";

// UI
import Top from "@/components/ui/top.vue";
import Panels from "@/components/ui/panels.vue";
import LocateConfirm from "@/components/modals/locate-confirm.vue";

import { useMap } from "@/composables/useMap";
import { useUI } from "@/composables/useUI";
import { useSettings } from "@/composables/useSettings";
import { useWakeLock } from "@/composables/useWakeLock";

const instanceId = inject("onrteAppId", "app");

// Map — template ref passed so useMap manages the full lifecycle
const mapContainer = ref(null);
useMap(mapContainer, {});

const { resolvedTheme } = useSettings();

// UI Store
const {
	closeNav,
	openPanel,
	togglePanelExpanded,
	isNavVisible,
	isPanelVisible,
	isPanelExpanded,
	isDesktop,
	isMobile,
} = useUI();

const handleMapClick = () => {
	if (isNavVisible.value && !isDesktop.value) {
		closeNav();
	}

	// If Mobile Panel is visible and expanded, collapse it (minimize it)
	if (isMobile.value && isPanelVisible.value && isPanelExpanded.value) {
		togglePanelExpanded();
	}
};

if (isDesktop.value) {
	openPanel();
}

const rootEl = ref(null);
const { init: initWakeLock } = useWakeLock();
onMounted(() => initWakeLock());
</script>

<template>
	<div
		ref="rootEl"
		class="onrte-root position-fixed top-0 start-0 w-100 h-100 overflow-hidden"
		:data-bs-theme="resolvedTheme"
	>
		<div style="display: none" v-html="iconSprite"></div>
		<div class="onrte-top">
			<Top />
		</div>

		<div class="onrte-content">
			<Panels />
		</div>

		<!-- Map -->
		<div
			ref="mapContainer"
			class="onrte-map"
			:data-onrte-id="instanceId"
			:class="{ 'panel-open': isPanelVisible && isDesktop }"
			@click="handleMapClick"
		/>

		<!-- Global modals -->
		<LocateConfirm />
	</div>
</template>
