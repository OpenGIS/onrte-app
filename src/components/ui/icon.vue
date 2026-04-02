<script setup>
defineProps({
  name: {
    type: String,
    required: true,
  },
  width: {
    type: [Number, String],
    default: 24,
  },
  height: {
    type: [Number, String],
    default: 24,
  },
  fill: {
    type: String,
    default: "currentColor",
  },
});
</script>

<template>
  <svg :width="width" :height="height" :fill="fill">
    <use :href="`#${name}`" />
  </svg>
</template>
