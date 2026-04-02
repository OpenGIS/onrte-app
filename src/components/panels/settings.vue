<script setup>
import { useSettings } from "@/composables/useSettings";
import { useLocale } from "@/composables/useLocale";

const { isDark, resolvedUnits, toggleTheme, setUnits } = useSettings();
const { t, locale, locales, localeNames, setLocale } = useLocale();
</script>

<template>
    <div class="sidebar-section sidebar-section-body p-3 pb-0">
        <h5 class="mb-0">{{ t('panel.settings.title') }}</h5>
    </div>

    <div class="sidebar-section sidebar-section-body p-3 border-top">
        <h6 class="mb-3 text-muted small text-uppercase fw-semibold">
            {{ t('panel.settings.appearance') }}
        </h6>
        <div class="form-check form-switch">
            <input
                class="form-check-input"
                type="checkbox"
                role="switch"
                id="settings-dark-mode"
                :checked="isDark"
                @change="toggleTheme"
            />
            <label class="form-check-label" for="settings-dark-mode">
                {{ t('panel.settings.darkMode') }}
            </label>
        </div>
    </div>

    <div class="sidebar-section sidebar-section-body p-3 border-top">
        <h6 class="mb-3 text-muted small text-uppercase fw-semibold">{{ t('panel.settings.units') }}</h6>
        <select
            id="settings-units"
            class="form-select form-select-sm w-auto"
            :value="resolvedUnits"
            @change="(e) => setUnits(e.target.value)"
        >
            <option value="metric">{{ t('panel.settings.metric') }}</option>
            <option value="imperial">{{ t('panel.settings.imperial') }}</option>
        </select>
    </div>

    <div class="sidebar-section sidebar-section-body p-3 border-top">
        <h6 class="mb-3 text-muted small text-uppercase fw-semibold">{{ t('panel.settings.language') }}</h6>
        <select
            id="settings-language"
            class="form-select form-select-sm w-auto"
            :value="locale"
            @change="(e) => setLocale(e.target.value)"
        >
            <option v-for="code in locales" :key="code" :value="code">
                {{ localeNames[code] }}
            </option>
        </select>
    </div>
</template>
