import { ref, computed, inject, watch } from "vue";
import { useStorage } from "@/composables/useStorage";
import { emitter } from "@/emitter.js";

// Module-level reactive system preference — shared across the app.
const systemDark = ref(window.matchMedia("(prefers-color-scheme: dark)").matches);
window
	.matchMedia("(prefers-color-scheme: dark)")
	.addEventListener("change", (e) => {
		systemDark.value = e.matches;
	});

/**
 * Infer the user's preferred unit system from a browser locale string.
 * Only the US, Liberia (LR), and Myanmar (MM) default to imperial.
 * Returns 'imperial' for those locales, 'metric' for everything else.
 */
export function localeDefaultUnits(localeStr) {
	try {
		const region = new Intl.Locale(localeStr ?? navigator.language).maximize().region;
		return ["US", "LR", "MM"].includes(region) ? "imperial" : "metric";
	} catch {
		return "metric";
	}
}

// Module-level state — initialised on first call, shared by all callers.
const cache = new Map();

/**
 * @param {string} [instanceId] - App instance ID. If omitted, resolved via inject('onrteAppId').
 *   Pass explicitly when calling from outside Vue setup context (e.g. a feature install()).
 */
export const useSettings = (instanceId) => {
	const id = instanceId ?? inject("onrteAppId", "app");

	if (!cache.has(id)) {
		const storage = useStorage("settings", {
			theme: null, // null = follow system, 'light', or 'dark'
			units: null, // null = follow locale default
			language: null, // null = follow browser default
		}, id);
		cache.set(id, { storage });

		// Register the theme watcher once per instance.
		watch(
			() => storage.theme ?? (systemDark.value ? "dark" : "light"),
			(theme) => emitter.emit("theme:change", theme),
		);
	}

	const { storage } = cache.get(id);

	const resolvedTheme = computed(
		() => storage.theme ?? (systemDark.value ? "dark" : "light"),
	);

	const isDark = computed(() => resolvedTheme.value === "dark");

	const resolvedUnits = computed(() => storage.units ?? localeDefaultUnits());
	const isMetric = computed(() => resolvedUnits.value === "metric");

	/** Toggle between light and dark theme, persisting the choice. */
	const toggleTheme = () => {
		storage.theme = isDark.value ? "light" : "dark";
	};

	/** @param {'metric'|'imperial'} units */
	const setUnits = (units) => {
		storage.units = units;
	};

	const language = computed(() => storage.language);

	/** @param {string|null} lang - BCP 47 language tag, or null to follow browser locale. */
	const setLanguage = (lang) => {
		storage.language = lang;
	};

	return {
		resolvedTheme,
		isDark,
		isMetric,
		resolvedUnits,
		toggleTheme,
		setUnits,
		language,
		setLanguage,
	};
};
