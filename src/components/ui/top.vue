<script setup>
import { inject, computed, shallowRef } from "vue";
import About from "@/components/modals/welcome.vue";
import { useUI } from "@/composables/useUI";
import { useLocale } from "@/composables/useLocale";
import IconButton from "@/components/ui/icon-button.vue";
import LocateButton from "@/components/ui/top/locate.vue";
import { getMapInstance } from "@/composables/useMap";

const instanceId = inject("onrteAppId", "app");
const buttonsRef = inject("navigatorButtons", shallowRef([]));

const { togglePanel, setActivePanel, openPanel } = useUI();
const { t } = useLocale();

const startButtons = computed(() => buttonsRef.value.filter((b) => b.position === "start"));
const middleButtons = computed(() => buttonsRef.value.filter((b) => b.position === "middle"));
const endButtons = computed(() => buttonsRef.value.filter((b) => !b.position || b.position === "end"));

const handleCustomClick = (btn) => {
  if (btn.panel) {
    setActivePanel(btn.id);
    openPanel();
  }
  if (typeof btn.onClick === "function") {
    const map = getMapInstance(instanceId);
    btn.onClick({ map, instanceId });
  }
};
</script>

<template>
  <!-- START Top Nav -->
  <nav class="navbar bg-body" data-bs-theme="dark">
    <div class="container-fluid">
      <!-- START Start -->
      <div class="start position-relative d-flex align-items-center">
        <IconButton
          icon="layout-sidebar-inset"
          :label="t('nav.menu')"
          :icon-width="40"
          :icon-height="40"
          class="navbar-toggler position-relative"
          @click="togglePanel()"
        />
        <template v-for="btn in startButtons" :key="btn.id">
          <component v-if="btn.component" :is="btn.component" v-bind="btn.props || {}" />
          <IconButton
            v-else
            :icon="btn.icon"
            :label="btn.label"
            :data-custom-button="btn.id"
            @click="handleCustomClick(btn)"
          />
        </template>
      </div>
      <!-- END Start -->

      <!-- START Middle -->
      <ul class="middle nav">
        <li class="nav-item ms-1"></li>
        <li v-for="btn in middleButtons" :key="btn.id" class="nav-item mx-1">
          <component v-if="btn.component" :is="btn.component" v-bind="btn.props || {}" />
          <IconButton
            v-else
            :icon="btn.icon"
            :label="btn.label"
            :data-custom-button="btn.id"
            @click="handleCustomClick(btn)"
          />
        </li>
      </ul>
      <!-- END Middle -->

      <!-- START End -->
      <ul class="end nav">
        <li v-for="btn in endButtons" :key="btn.id" class="nav-item mx-1">
          <component v-if="btn.component" :is="btn.component" v-bind="btn.props || {}" />
          <IconButton
            v-else
            :icon="btn.icon"
            :label="btn.label"
            :data-custom-button="btn.id"
            @click="handleCustomClick(btn)"
          />
        </li>
        <li class="nav-item mx-1">
          <LocateButton />
        </li>
      </ul>
      <!-- END End -->
    </div>
  </nav>
  <!-- END Top Nav -->

  <About />
</template>


