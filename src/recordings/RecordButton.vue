<!-- RecordButton.vue — centre-aligned navbar button that toggles recording -->
<script setup>
import { inject, computed } from 'vue';
import { useUI } from '@ogis/navigator';

const { state, start, pause, resume } = inject('recordings');
const { setActivePanel, openPanel } = useUI();

const toggle = () => {
  if (state.isRecording) {
    pause();
    // Open the Recordings panel so the user can save or discard
    setActivePanel('record');
    openPanel();
  } else if (state.isPaused) {
    resume();
  } else {
    start();
  }
};

const color = computed(() => {
  if (state.isRecording) return 'var(--bs-danger)';
  if (state.isPaused) return 'var(--bs-secondary)';
  return 'currentColor';
});

const label = computed(() => {
  if (state.isRecording) return 'Recording';
  if (state.isPaused) return 'Paused';
  return 'Record';
});
</script>

<template>
  <button
    type="button"
    class="border-0 bg-transparent text-white d-flex flex-column align-items-center"
    @click="toggle"
  >
    <svg width="40" height="40" :fill="color">
      <use href="#record-btn-fill" />
    </svg>
    <small :style="{ color }">{{ label }}</small>
  </button>
</template>
