<script setup>
import Modal from "@/components/modals/modal.vue";
import { useUI } from "@/composables/useUI";
import { useLocale } from "@/composables/useLocale";
import { useSettings } from "@/composables/useSettings";

const { showAboutModal, closeAboutModal } = useUI();
const { t, locale, locales, localeNames, setLocale } = useLocale();
const { resolvedUnits, setUnits } = useSettings();
</script>

<template>
  <Modal
    id="about-modal"
    :model-value="showAboutModal"
    labelledby="about-modal-title"
    @update:model-value="closeAboutModal"
  >
    <template #default>
      <div class="modal-header">
        <h5 class="modal-title" id="about-modal-title">
          {{ t("modal.welcome.title") }}
        </h5>
        <button
          type="button"
          class="btn-close"
          aria-label="Close"
          @click="closeAboutModal"
        ></button>
      </div>
      <div class="modal-body">
        <p class="lead">{{ t("modal.welcome.introOne") }}</p>
        <p>{{ t("modal.welcome.introTwo") }}</p>
        <p class="fw-semibold mb-2">{{ t("modal.welcome.preferences") }}</p>
        <div class="mb-2">
          <label for="about-language" class="form-label small mb-1">
            {{ t("panel.settings.language") }}
          </label>
          <select
            id="about-language"
            class="form-select form-select-sm w-auto"
            :value="locale"
            @change="(e) => setLocale(e.target.value)"
          >
            <option v-for="code in locales" :key="code" :value="code">
              {{ localeNames[code] }}
            </option>
          </select>
        </div>
        <div class="mb-3">
          <label for="about-units" class="form-label small mb-1">
            {{ t("panel.settings.units") }}
          </label>
          <select
            id="about-units"
            class="form-select form-select-sm w-auto"
            :value="resolvedUnits"
            @change="(e) => setUnits(e.target.value)"
          >
            <option value="metric">{{ t("panel.settings.metric") }}</option>
            <option value="imperial">{{ t("panel.settings.imperial") }}</option>
          </select>
        </div>
        <p class="mb-0 text-body-secondary small">
          {{ t("modal.welcome.locateInfo") }}
        </p>
      </div>
      <div class="modal-footer">
        <button
          type="button"
          class="btn btn-primary"
          id="about-modal-close"
          @click="closeAboutModal"
        >
          {{ t("modal.welcome.getStarted") }}
        </button>
      </div>
    </template>
  </Modal>
</template>
