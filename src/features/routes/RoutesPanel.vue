<!-- RoutesPanel.vue — side-panel content for the GPX routes feature -->
<script setup>
import { inject } from "vue";

const {
  routes,
  navigating,
  error,
  isMetric,
  importGPX,
  deleteRoute,
  showOnMap,
  startNavigation,
  stopNavigation,
  formatDistance,
} = inject("routes");

const onFiles = async (e) => {
  for (const file of e.target.files) {
    await importGPX(file);
  }
  e.target.value = "";
};
</script>

<template>
  <div class="sidebar-section sidebar-section-body p-3 pb-0">
    <h5 class="mb-0">Routes</h5>
  </div>

  <div class="sidebar-section sidebar-section-body p-3 border-top">
    <input
      type="file"
      accept=".gpx,application/gpx+xml"
      multiple
      class="form-control"
      @change="onFiles"
    />
    <div v-if="error" class="small text-danger mt-2">
      {{ error }}
    </div>
  </div>

  <div class="sidebar-section sidebar-section-body p-3 border-top">
    <p v-if="!routes.length" class="text-body-tertiary small mb-0">
      No routes yet. Import a GPX file to get started.
    </p>

    <div v-for="route in routes" :key="route.id" class="border-top py-2">
      <div class="d-flex justify-content-between align-items-center">
        <div>
          <div class="fw-semibold">{{ route.name }}</div>
          <div class="small text-body-secondary">
            {{ formatDistance(route.distance, isMetric) }}
          </div>
        </div>
        <div class="btn-group btn-group-sm" role="group">
          <button class="btn btn-outline-primary" @click="showOnMap(route.id)">
            Show
          </button>
          <button
            v-if="navigating === route.id"
            class="btn btn-success"
            @click="stopNavigation"
          >
            Stop
          </button>
          <button
            v-else
            class="btn btn-outline-success"
            @click="startNavigation(route.id)"
          >
            Navigate
          </button>
          <button class="btn btn-outline-danger" @click="deleteRoute(route.id)">
            Delete
          </button>
        </div>
      </div>
    </div>

    <div v-if="navigating" class="border-top small text-body-secondary py-2">
      Navigation active — following GPS position.
    </div>
  </div>
</template>
